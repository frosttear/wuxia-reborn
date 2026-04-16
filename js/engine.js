// engine.js - Game loop and event management

const Engine = {
    state: {
        char: null,
        jobs: [],
        npcs: [],
        events: [],
        enemies: [],
        bonds: {},            // loaded from bonds.json
        chains: [],           // loaded from chains.json
        pendingChainStep: null, // { chainId, stepIdx } active during chain combat
        pendingChoice: null,  // event waiting for player input
        gamePhase: 'idle',    // idle | choosing | combat | game_over | rebirth | victory
        combatState: null,
        combatBusy: false,       // true while processing a turn (prevents double-tap)
        combatAutoActive: false, // auto-combat mode
        combatAutoTimer: null,
        autoAdvance: false,
        autoTimer: null,
        seenEvents: new Set() // track seen events this life to avoid repetition
    },

    async init() {
        const [jobs, npcs, events, enemies, bonds, chainsData] = await Promise.all([
            fetch('data/jobs.json').then(r => r.json()),
            fetch('data/npcs.json').then(r => r.json()),
            fetch('data/events.json').then(r => r.json()),
            fetch('data/enemies.json').then(r => r.json()),
            fetch('data/bonds.json').then(r => r.json()),
            fetch('data/chains.json').then(r => r.json())
        ]);
        this.state.jobs = jobs;
        this.state.npcs = npcs;
        this.state.events = events;
        this.state.enemies = enemies;
        this.state.bonds = bonds;
        this.state.chains = chainsData.chains || [];
    },

    BIRTH_MONTH_NAMES: ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'],

    startNewGame(name, birthMonth, inheritedAttributes, legacyTalents) {
        const char = Character.create(name, inheritedAttributes || {}, legacyTalents || []);
        char.birthMonth = birthMonth || 1;
        Character.applyBirthMonthBonus(char);
        NPCSystem.initRelationships(char, this.state.npcs);
        const job = this.getJob(char.job);
        char.hp = Character.getHPMax(char, job);
        this.state.char = char;
        this.state.gamePhase = 'idle';
        this.state.seenEvents = new Set();
        this.saveGame();
        UI.renderAll(this.state);
        const mName = this.BIRTH_MONTH_NAMES[char.birthMonth - 1];
        const bBonus = BIRTH_MONTH_BONUSES[char.birthMonth - 1];
        UI.addLog(`【${char.name}】的传奇，从此开始。`, 'system');
        UI.addLog(`生于${mName}，年集15岁，踏入江湖。二十岁生辰日，天魔如约而至。`, 'system');
        if (bBonus) UI.addLog(`✦ 【${bBonus.label}】生于${mName}，${bBonus.tagline}。`, 'unlock');
    },

    getJob(jobId) {
        return this.state.jobs.find(j => j.id === jobId) || null;
    },

    getEnemy(enemyId) {
        return this.state.enemies.find(e => e.id === enemyId) || null;
    },

    advanceMonth() {
        const { char } = this.state;
        if (!char || this.state.gamePhase !== 'idle') return;

        char.flags._is_birthday = false; // clear from last birthday
        char.ageMonths++;

        // Monthly HP regen
        const job = this.getJob(char.job);
        const { innerBonus } = Character.monthlyHPRegen(char, job);
        UI.renderCharacter(char, this.state.jobs);
        if (innerBonus > 0) UI.addLog(`【内功】内力护体，本月额外回复 ${innerBonus} 气血。`, 'info');

        // Check death by age
        if (char.ageMonths >= char.maxAgeMonths) {
            this.triggerNaturalDeath();
            return;
        }

        // Check new job unlocks
        const newJobs = Character.checkJobUnlocks(char, this.state.jobs);
        for (const j of newJobs) {
            UI.addLog(`⚔ 你已满足晋升【${j.name}】的条件！可在右侧面板切换职业。`, 'unlock');
        }

        // Birthday system: fires when ageMonths % 12 === 0; display shows 16岁0月 etc.
        const isBirthday = char.ageMonths > 180 && char.ageMonths % 12 === 0;
        if (isBirthday) {
            const ageYears = Character.getAgeYears(char);  // e.g. 16 at ageMonths=192

            if (ageYears >= 20) {
                // 20th birthday — final boss (5-year game, 15→20)
                if (!char.flags.boss_triggered) {
                    char.flags.boss_triggered = true;
                    const bossEvent = this.state.events.find(e => e.id === 'tianmo_appears');
                    if (bossEvent) { this.triggerEvent(bossEvent); return; }
                }
            } else {
                this.triggerBirthdayEvent(ageYears);
                char.flags._is_birthday = true;
            }
        }

        // autoHealInjury passive: clear injury automatically each month
        if (char.injured && (char.passives || []).some(p => p.autoHealInjury)) {
            char.injured = false;
            char.injuredMonths = 0;
            UI.addLog('【青心丹药】苹青的药力帮你迅速消去了伤势。', 'result');
        }

        // Injured state: forced rest, only 养伤 events allowed
        if (char.injured) {
            char.injuredMonths = Math.max(0, (char.injuredMonths || 1) - 1);
            Character.monthlyHPRegen(char, job); // extra regen during rest
            UI.renderCharacter(char, this.state.jobs);
            if (char.injuredMonths <= 0) {
                char.injured = false;
                UI.addLog('【痊愈】伤势已愈，你重新踏上武道之路。', 'result');
            }
            if (char.injured) {
                const pool = this.state.events.filter(e => e.type === '养伤');
                if (pool.length > 0) {
                    const weighted = [];
                    for (const ev of pool) for (let i = 0; i < (ev.weight || 1); i++) weighted.push(ev);
                    this.triggerEvent(weighted[Math.floor(Math.random() * weighted.length)]);
                    return;
                }
            }
            UI.renderAll(this.state);
            this.saveGame();
            return;
        }

        const eligible = this.selectEvents();
        if (eligible.length > 0) {
            this.triggerEvent(eligible[0]);
        } else {
            UI.renderAll(this.state);
            this.saveGame();
        }
    },

    selectEvents() {
        const { char, events } = this.state;
        const eligible = [];

        // 属性影响事件池权重
        const compBonus  = Math.floor(char.attributes.comprehension / 5);
        const luckBonus  = Math.floor(char.attributes.luck / 8);
        const strBonus   = Math.floor(char.attributes.strength / 6);
        const innerBonus = Math.floor(char.attributes.innerForce / 6);
        const repBonus   = Math.floor(char.attributes.reputation / 5);

        for (const event of events) {
            if (event.type === 'boss') continue;   // boss triggered separately
            if (event.type === '养伤') continue;   // only available during injury
            if (!this.checkConditions(event.conditions || {})) continue;

            let weight = event.weight;
            if (['奇遇', '机缘'].includes(event.type))  weight += compBonus;
            if (['奇遇', '机缘', '交友'].includes(event.type)) weight += Math.floor(luckBonus / 2);
            if (event.type === '遭遇战') weight = Math.max(1, weight - Math.floor(luckBonus / 2));
            // 力量高 → 更多磨练/遭遇战；内力高 → 更多奇遇/机缘；声望高 → 更多交友
            if (['磨练', '遭遇战'].includes(event.type)) weight += strBonus;
            if (['奇遇', '机缘'].includes(event.type))  weight += innerBonus;
            if (event.type === '交友') weight += repBonus;

            // Slightly reduce weight for recently seen events
            if (this.state.seenEvents.has(event.id)) weight = Math.max(1, Math.floor(weight * 0.3));

            for (let i = 0; i < weight; i++) eligible.push(event);
        }

        // Shuffle and pick one
        if (eligible.length === 0) return [];
        const picked = eligible[Math.floor(Math.random() * eligible.length)];
        this.state.seenEvents.add(picked.id);
        return [picked];
    },

    checkConditions(cond) {
        const { char } = this.state;
        if (!char) return false;
        const ageYears = Character.getAgeYears(char);

        if (cond.minAgeYears !== undefined && ageYears < cond.minAgeYears) return false;
        if (cond.maxAgeYears !== undefined && ageYears > cond.maxAgeYears) return false;

        if (cond.jobs && !cond.jobs.includes(char.job)) return false;
        if (cond.notJobs && cond.notJobs.includes(char.job)) return false;

        if (cond.minAttributes) {
            for (const attr in cond.minAttributes) {
                if ((char.attributes[attr] || 0) < cond.minAttributes[attr]) return false;
            }
        }
        if (cond.maxAttributes) {
            for (const attr in cond.maxAttributes) {
                if ((char.attributes[attr] || 0) > cond.maxAttributes[attr]) return false;
            }
        }

        // Flag conditions: { flagName: true/false }
        if (cond.flags) {
            for (const flag in cond.flags) {
                const required = cond.flags[flag];
                const actual = char.flags[flag] || false;
                if (required !== actual) return false;
            }
        }

        if (cond.npcAffinity) {
            if (!NPCSystem.checkNPCAffinity(char, cond.npcAffinity)) return false;
        }

        if (cond.minRebirth !== undefined && char.rebirthCount < cond.minRebirth) return false;

        return true;
    },

    triggerEvent(event) {
        const { char } = this.state;

        // Consume extra months for time-intensive events (monthCost > 1)
        const extraMonths = (event.monthCost || 1) - 1;
        if (extraMonths > 0) {
            const job = this.getJob(char.job);
            for (let i = 0; i < extraMonths; i++) {
                char.ageMonths++;
                Character.monthlyHPRegen(char, job);
                if (char.ageMonths >= char.maxAgeMonths) {
                    this.triggerNaturalDeath();
                    return;
                }
            }
            UI.renderCharacter(char, this.state.jobs);
            UI.addLog(`（此事耗时约${event.monthCost}个月）`, 'info');
        }

        // Compute locked state for every choice (locked = requirements not met)
        const allChoices = (event.choices || []).map(choice => {
            if (!choice.requirements) return { ...choice, locked: false };
            return { ...choice, locked: !this.checkConditions(choice.requirements) };
        });
        const availableChoices = allChoices.filter(c => !c.locked);

        // Show the event with ALL choices (locked ones rendered grayed-out)
        UI.showEvent(event, allChoices, this.state);

        if (availableChoices.length > 0) {
            this.state.pendingChoice = { event, choices: availableChoices };
            this.state.gamePhase = 'choosing';
            UI.updateControls(this.state);
        } else {
            // No choices — auto apply if autoEffects exist
            if (event.autoEffects) {
                this.applyEffects(event.autoEffects);
            }
            this.state.gamePhase = 'idle';
            UI.renderAll(this.state);
            this.saveGame();
        }
    },

    applyChoice(choiceIndex) {
        if (this.state.gamePhase !== 'choosing' || !this.state.pendingChoice) return;
        const { event, choices, bondInfo, chainStep } = this.state.pendingChoice;
        const choice = choices[choiceIndex];
        if (!choice) return;

        this.state.pendingChoice = null;
        this.state.gamePhase = 'idle';

        // Mark bond event complete before applying effects
        if (bondInfo) {
            const { npcId, level } = bondInfo;
            const char = this.state.char;
            char.bondEventsDone[`${npcId}_${level}`] = true;
            char.bondLevels[npcId] = Math.max(char.bondLevels[npcId] || 0, level);
            const npc = this.state.npcs.find(n => n.id === npcId);
            UI.addLog(`💞 与【${npc ? npc.name : npcId}】的羁绊加深！（第${level}章）`, 'unlock');

            // Check for max-bond passive unlock
            const npcBonds = this.state.bonds[npcId];
            const maxLevel = npcBonds ? npcBonds.length : 0;
            if (level >= maxLevel) {
                const bondChapter = npcBonds.find(b => b.level === level);
                if (bondChapter && bondChapter.passive) {
                    const passive = bondChapter.passive;
                    if (!char.passives) char.passives = [];
                    if (!char.passives.find(p => p.id === passive.id)) {
                        char.passives.push(passive);
                        UI.addLog(`✨ 解锁被动【${passive.name}】：${passive.desc}`, 'unlock');
                    }
                }
            }
        }

        const effects = choice.effects || {};

        // Log lucky trigger if attributes changed
        if (effects.attributes) {
            const { luckyTriggered, actualGains } = Character.applyAttributeChanges(this.state.char, effects.attributes);
            if (luckyTriggered) UI.addLog('✨ 幸运触发！属性收益翻倍！', 'unlock');
            const effectsCopy = Object.assign({}, effects);
            delete effectsCopy.attributes;
            this.applyEffects(effectsCopy);
            const gainsStr = this.formatAttrGains(actualGains);
            const gainsTag = gainsStr ? `　<span class="attr-gains">⬆ ${gainsStr}</span>` : '';
            const narrative = effects.narrative ? effects.narrative + gainsTag : (gainsTag || '');
            if (narrative) UI.addLog(narrative, 'result');
            // Complete chain step (non-combat)
            if (chainStep && !effects.combat) this.completeChainStep(chainStep.chainId, chainStep.stepIdx);
            UI.renderAll(this.state);
            this.saveGame();
            return;
        }

        // Combat event → start turn-based combat
        if (effects.combat) {
            const enemy = this.getEnemy(effects.combat);
            if (enemy) {
                const sideEffects = Object.assign({}, effects);
                delete sideEffects.combat;
                delete sideEffects.narrative;
                delete sideEffects.attributes;
                this.applyEffects(sideEffects);
                if (chainStep) this.state.pendingChainStep = chainStep;
                this.startCombat(enemy, effects.narrative || '');
                return;
            }
        }

        // Complete chain step (non-combat, no attribute effects)
        if (chainStep) this.completeChainStep(chainStep.chainId, chainStep.stepIdx);
        this.applyEffects(effects);
        if (effects.narrative) UI.addLog(effects.narrative, 'result');
        UI.renderAll(this.state);
        this.saveGame();
    },

    applyEffects(effects) {
        if (!effects) return;
        const { char } = this.state;
        if (effects.attributes) {
            const { luckyTriggered, actualGains } = Character.applyAttributeChanges(char, effects.attributes);
            if (luckyTriggered) UI.addLog('✨ 幸运触发！属性收益翻倍！', 'unlock');
            UI.addLog(`⬆ ${this.formatAttrGains(actualGains)}`, 'result');
        }
        if (effects.npcAffinity) {
            for (const npcId in effects.npcAffinity) {
                NPCSystem.changeAffinity(char, npcId, effects.npcAffinity[npcId]);
            }
        }
        if (effects.flags) {
            Object.assign(char.flags, effects.flags);
        }
        if (typeof effects.hp === 'number') {
            char.hp = Math.max(1, Math.min(char.hp + effects.hp, Character.getHPMax(char, this.getJob(char.job))));
        }
    },

    getAvailableVisits() {
        const { char, bonds, npcs } = this.state;
        if (!char || !bonds || !npcs) return [];
        const result = [];
        for (const npcId in bonds) {
            if (npcId === '_casualVisits') continue;
            if (!char.flags['met_' + npcId]) continue;
            const npc = npcs.find(n => n.id === npcId);
            if (!npc) continue;
            const npcBonds = bonds[npcId];
            const currentLevel = (char.bondLevels || {})[npcId] || 0;
            const bondEvent = Array.isArray(npcBonds) ? npcBonds.find(b => b.level === currentLevel + 1) : null;
            const affinity = NPCSystem.getAffinity(char, npcId);
            const bondReady = !!(bondEvent &&
                !((char.bondEventsDone || {})[`${npcId}_${bondEvent.level}`]) &&
                affinity >= bondEvent.minAffinity);
            result.push({ npcId, npc, affinity, bondReady, bondEvent });
        }
        return result;
    },

    visitNPC(npcId) {
        const { char } = this.state;
        if (!char || this.state.gamePhase !== 'idle') return;
        const npcBonds = this.state.bonds[npcId];
        if (!npcBonds) return;

        const npc = this.state.npcs.find(n => n.id === npcId);
        const currentLevel = char.bondLevels[npcId] || 0;
        const bondEvent = npcBonds.find(b => b.level === currentLevel + 1);
        const affinity = NPCSystem.getAffinity(char, npcId);
        const bondReady = !!(bondEvent &&
            !char.bondEventsDone[`${npcId}_${bondEvent.level}`] &&
            affinity >= bondEvent.minAffinity);

        // Check casual visit yearly limit BEFORE spending a month
        if (!bondReady) {
            if (!char.visitCounts) char.visitCounts = {};
            const ageYear = Character.getAgeYears(char);
            const vc = char.visitCounts[npcId] || { year: -1, count: 0 };
            if (vc.year !== ageYear) { vc.year = ageYear; vc.count = 0; }
            const MAX_CASUAL = 2;
            if (vc.count >= MAX_CASUAL) {
                UI.addLog(`今年已多次拜访【${npc ? npc.name : npcId}】，想来想去，时机还不对，且等明年再说。`, 'info');
                return;
            }
            vc.count++;
            char.visitCounts[npcId] = vc;
        }

        // Advance 1 month for the visit
        const job = this.getJob(char.job);
        char.ageMonths++;
        Character.monthlyHPRegen(char, job);
        if (char.ageMonths >= char.maxAgeMonths) {
            UI.renderCharacter(char, this.state.jobs);
            this.triggerNaturalDeath();
            return;
        }
        UI.renderCharacter(char, this.state.jobs);

        if (bondReady) {
            // Trigger full bond chapter event; compute locked choices first
            const inherited = char.inheritedBonds[npcId];
            const prefix = inherited && inherited >= bondEvent.level
                ? `「前世记忆」你隐约记得与${npc.name}曾有过这一段故事……\n\n`
                : '';
            const displayEvent = Object.assign({}, bondEvent, {
                text: prefix + bondEvent.text,
                title: `羁绊·${npc ? npc.name : npcId}·第${bondEvent.level}章`,
                type: '羁绊'
            });
            const allChoices = bondEvent.choices.map(c =>
                ({ ...c, locked: c.requirements ? !this.checkConditions(c.requirements) : false })
            );
            const availableChoices = allChoices.filter(c => !c.locked);
            this.state.pendingChoice = {
                event: displayEvent,
                choices: availableChoices,
                bondInfo: { npcId, level: bondEvent.level }
            };
            this.state.gamePhase = 'choosing';
            UI.showEvent(displayEvent, allChoices, this.state);
        } else {
            // Casual visit: small affinity boost
            NPCSystem.changeAffinity(char, npcId, 3);
            const newAffinity = NPCSystem.getAffinity(char, npcId);
            const needed = bondEvent ? bondEvent.minAffinity : null;
            const gap = needed !== null ? needed - newAffinity : null;
            const gapNote = gap > 0
                ? `好感 +3（当前 ${newAffinity}，距第${bondEvent.level}章还差 ${gap}）`
                : `好感 +3（当前 ${newAffinity}）`;

            // Pick from per-NPC affinity-tiered casual visit pool
            const pools = this.state.bonds._casualVisits;
            let visitText = null;
            if (pools && pools[npcId]) {
                const matching = pools[npcId].filter(t =>
                    (t.minAffinity === undefined || newAffinity >= t.minAffinity) &&
                    (t.maxAffinity === undefined || newAffinity < t.maxAffinity)
                );
                const tier = matching[Math.floor(Math.random() * matching.length)];
                if (tier && tier.texts && tier.texts.length > 0) {
                    visitText = tier.texts[Math.floor(Math.random() * tier.texts.length)];
                }
            }

            UI.addLog(visitText || `拜访了【${npc.name}】，闲聊了一会儿。`, 'result');
            UI.addLog(gapNote, 'info');
            UI.renderAll(this.state);
            this.saveGame();
        }
    },

    getAvailableChainSteps() {
        const { char, chains } = this.state;
        if (!char || !chains) return [];
        const available = [];
        for (const chain of chains) {
            const progress = char.chainProgress ? char.chainProgress[chain.id] : undefined;
            if (progress === 'done') continue;
            const stepIdx = (typeof progress === 'number') ? progress : 0;
            if (stepIdx >= chain.steps.length) continue;
            const step = chain.steps[stepIdx];
            if (this.checkConditions(step.unlockConditions || {})) {
                available.push({ chain, step, stepIdx });
            }
        }
        return available;
    },

    getAllPendingChainSteps() {
        const { char, chains } = this.state;
        if (!char || !chains) return [];
        const ATTR_CN = { strength: '力量', agility: '敏捷', constitution: '体质',
            innerForce: '内力', comprehension: '悟性', luck: '运气', reputation: '声望' };
        const FLAG_LABELS = {
            tianmo_sign1: '完成「路遇奇人」', tianmo_sign2: '完成「探查龙脊山」',
            met_mysterious_elder: '结识神秘老者', elder_past1: '完成「旧日画像」',
            elder_past2: '完成「故地重游」', chaos1: '完成「奇怪委托」',
            chaos2: '完成「追查幕后」',
        };
        const result = [];
        for (const chain of chains) {
            const progress = char.chainProgress ? char.chainProgress[chain.id] : undefined;
            if (progress === 'done') continue;
            const stepIdx = (typeof progress === 'number') ? progress : 0;
            if (stepIdx >= chain.steps.length) continue;
            const step = chain.steps[stepIdx];
            const conditionsMet = this.checkConditions(step.unlockConditions || {});
            const cond = step.unlockConditions || {};
            const lockedReasons = [];
            if (cond.minAgeYears !== undefined) {
                const age = Character.getAgeYears(char);
                if (age < cond.minAgeYears) lockedReasons.push(`需年满${cond.minAgeYears}岁（当前${age}岁）`);
            }
            if (cond.minAttributes) {
                for (const [attr, val] of Object.entries(cond.minAttributes)) {
                    const cur = (char.attributes || {})[attr] || 0;
                    if (cur < val) lockedReasons.push(`需${ATTR_CN[attr] || attr}达到${val}（当前${cur}）`);
                }
            }
            if (cond.flags) {
                for (const [flag, needed] of Object.entries(cond.flags)) {
                    if ((char.flags[flag] || false) !== needed)
                        lockedReasons.push(FLAG_LABELS[flag] || '需完成前置任务');
                }
            }
            if (cond.npcAffinity) {
                for (const [npcId, val] of Object.entries(cond.npcAffinity)) {
                    const cur = NPCSystem.getAffinity(char, npcId);
                    if (cur < val) {
                        const npc = this.state.npcs.find(n => n.id === npcId);
                        lockedReasons.push(`需与${npc ? npc.name : npcId}好感达到${val}（当前${cur}）`);
                    }
                }
            }
            let enemyInfo = null;
            for (const choice of step.choices || []) {
                if (choice.effects && choice.effects.combat) {
                    const enemy = this.getEnemy(choice.effects.combat);
                    if (enemy) {
                        const eff = Combat.getEffectiveStats(enemy, char);
                        enemyInfo = { name: enemy.name, attack: eff.attack, defense: eff.defense, hp: eff.hp };
                    }
                    break;
                }
            }
            result.push({ chain, step, stepIdx, conditionsMet, lockedReasons, enemyInfo });
        }
        return result;
    },

    triggerChainStep(chainId, stepIdx) {
        const { char } = this.state;
        if (!char || this.state.gamePhase !== 'idle') return;
        const chain = this.state.chains.find(c => c.id === chainId);
        if (!chain) return;
        const step = chain.steps[stepIdx];
        if (!step) return;

        // Advance 1 month
        const job = this.getJob(char.job);
        char.ageMonths++;
        Character.monthlyHPRegen(char, job);
        if (char.ageMonths >= char.maxAgeMonths) { this.triggerNaturalDeath(); return; }
        UI.renderCharacter(char, this.state.jobs);

        const displayEvent = {
            id: step.id,
            title: `【${chain.name}】${step.title}`,
            type: '线索',
            text: step.text
        };
        const allChoices = (step.choices || []).map(c => ({
            ...c, locked: c.requirements ? !this.checkConditions(c.requirements) : false
        }));
        const availableChoices = allChoices.filter(c => !c.locked);
        this.state.pendingChoice = {
            event: displayEvent,
            choices: availableChoices,
            chainStep: { chainId, stepIdx }
        };
        this.state.gamePhase = 'choosing';
        UI.showEvent(displayEvent, allChoices, this.state);
        UI.updateControls(this.state);
    },

    completeChainStep(chainId, stepIdx) {
        const { char } = this.state;
        const chain = this.state.chains.find(c => c.id === chainId);
        if (!chain) return;
        const step = chain.steps[stepIdx];
        // Apply onComplete flags
        if (step && step.onComplete && step.onComplete.flags) {
            Object.assign(char.flags, step.onComplete.flags);
        }
        const nextStep = stepIdx + 1;
        if (!char.chainProgress) char.chainProgress = {};
        if (nextStep >= chain.steps.length) {
            char.chainProgress[chainId] = 'done';
            this.completeChain(chain);
        } else {
            char.chainProgress[chainId] = nextStep;
            UI.addLog(`📜 【${chain.name}】进度更新——下一节「${chain.steps[nextStep].title}」可在【线索】中继续。`, 'unlock');
        }
    },

    completeChain(chain) {
        const { char } = this.state;
        const reward = chain.completionReward || {};
        UI.addLog(`✦ 事件系列【${chain.name}】全部完成！`, 'unlock');
        if (reward.narrative) UI.addLog(reward.narrative, 'result');
        if (reward.attributes) {
            Character.applyAttributeChanges(char, reward.attributes);
            UI.addLog(`⬆ ${this.formatAttrGains(reward.attributes)}`, 'result');
        }
        if (reward.flags) Object.assign(char.flags, reward.flags);
        if (reward.passives) {
            if (!char.passives) char.passives = [];
            for (const passive of reward.passives) {
                if (!char.passives.find(p => p.id === passive.id)) {
                    char.passives.push(passive);
                    UI.addLog(`✨ 解锁被动【${passive.name}】：${passive.desc}`, 'unlock');
                }
            }
        }
        UI.renderAll(this.state);
    },

    allBondsComplete(char) {
        const bonds = this.state.bonds;
        for (const npcId in bonds) {
            const maxLevel = bonds[npcId].length;
            if ((char.bondLevels[npcId] || 0) < maxLevel) return false;
        }
        return true;
    },

    startCombat(enemy, postNarrative) {
        const { char } = this.state;
        const job = this.getJob(char.job);
        const cs = Combat.initState(char, enemy, job);
        cs.postNarrative = postNarrative || '';
        if (enemy.isHiddenBoss && this.allBondsComplete(char)) {
            cs.allBondsBonus = true;
            UI.addLog('【羁绊之力】王铁、李云舒、神秘老者、凌雪……这一世结下的所有情谊，此刻化为无形之力，护持于你！', 'unlock');
        } else if (enemy.isHiddenBoss && !this.allBondsComplete(char)) {
            UI.addLog('【羁绊未满】你感到胸中力量空缺……或许，集齐所有羁绊才能撼动此敌。', 'info');
        }
        if (enemy.isFinalBoss || enemy.isHiddenBoss) cs.noFlee = true;
        this.state.combatState = cs;
        this.state.gamePhase = 'combat';
        UI.updateControls(this.state);
        UI.showCombatOverlay(this.state);
        this.saveGame();
    },

    handleCombatAction(action) {
        if (this.state.gamePhase !== 'combat' || !this.state.combatState || this.state.combatBusy) return;
        if (action === 'flee' && this.state.combatState.noFlee) return;
        this.state.combatBusy = true;
        const { char } = this.state;
        const job = this.getJob(char.job);
        const cs = this.state.combatState;

        UI.setCombatActionsEnabled(false);

        const { combatOver, result } = Combat.processTurn(action, cs, char, job);
        UI.updateCombatOverlay(this.state);

        if (combatOver) {
            setTimeout(() => {
                this.state.combatBusy = false;
                this.endCombat(result, cs);
            }, 900);
        } else {
            this.state.combatBusy = false;
            UI.setCombatActionsEnabled(true);
        }
    },

    // ── Quick combat (Monte Carlo instant resolution) ───────────────────────
    handleQuickCombat() {
        if (this.state.gamePhase !== 'combat' || !this.state.combatState || this.state.combatBusy) return;
        this.state.combatBusy = true;
        const { char } = this.state;
        const job  = this.getJob(char.job);
        const cs   = this.state.combatState;

        const sim  = Combat.runQuickCombat(char, cs.enemy, job, 100);
        const won  = Math.random() < sim.winRate;
        const pct  = Math.round(sim.winRate * 100);

        // Apply expected HP loss to actual char (with ±30% variance)
        if (won) {
            const variance = 0.3;
            const hpLost = Math.round(sim.avgHpLost * (1 - variance + Math.random() * variance * 2));
            Character.takeDamage(char, Math.min(hpLost, char.hp - 1));
        }

        // Patch cs summary stats for endCombat display
        cs.turn            = sim.avgTurns;
        cs.totalDmgDealt   = sim.avgDmgDealt;
        cs.totalDmgReceived = sim.avgDmgReceived;

        UI.addLog(`⚡ 快速战斗（胜率 ${pct}%）……`, 'system');
        this.state.combatBusy = false;
        this.endCombat(won ? 'won' : 'lost', cs);
    },

    // kept for endCombat compatibility
    stopCombatAuto() {},

    formatAttrGains(attrs) {
        if (!attrs) return '';
        const NAMES = {
            strength: '力量', agility: '敏捷', constitution: '体质',
            innerForce: '内力', comprehension: '悟性', luck: '运气', reputation: '声望'
        };
        return Object.entries(attrs)
            .filter(([, v]) => v !== 0)
            .map(([k, v]) => `${NAMES[k] || k}${v > 0 ? '+' : ''}${v}`)
            .join('  ');
    },

    endCombat(result, cs) {
        const { char } = this.state;
        const enemy = cs.enemy;
        this.stopCombatAuto();
        this.state.combatState = null;
        this.state.gamePhase = 'idle';
        try { localStorage.removeItem('wuxia_combat'); } catch(e) {}

        if (result === 'won') {
            UI.addLog(enemy.winNarrative, 'win');
            const rewards = enemy.winEffects || {};
            if (Object.keys(rewards).length > 0) this.applyEffects({ attributes: rewards });
            // Complete chain step on combat victory
            if (this.state.pendingChainStep) {
                const { chainId, stepIdx } = this.state.pendingChainStep;
                this.state.pendingChainStep = null;
                this.completeChainStep(chainId, stepIdx);
            }
            if (enemy.isHiddenBoss) {
                char.flags.hidden_boss_beaten = true;
                UI.hideCombatOverlay();
                this.triggerVictory(true);
                return;
            }
            if (enemy.isFinalBoss) { UI.hideCombatOverlay(); this.triggerVictory(false); return; }
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'won',
                rewards: this.formatAttrGains(rewards)
            });
            char.kills = (char.kills || 0) + 1;
            this.checkKillThreshold(char);

        } else if (result === 'lost') {
            UI.addLog(enemy.loseNarrative, 'lose');
            this.state.pendingChainStep = null; // chain step not completed on loss
            const loseRewards = enemy.loseEffects || {};
            if (Object.keys(loseRewards).length > 0) this.applyEffects({ attributes: loseRewards });
            UI.renderCharacter(char, this.state.jobs);
            if (enemy.isHiddenBoss) {
                UI.addLog('你击败了天魔，却败于那更深处的剑意。此生功亏一筑。下一世，再来。', 'system');
                UI.hideCombatOverlay();
                this.triggerDeath('hidden_boss');
                return;
            }
            if (enemy.isFinalBoss) {
                UI.hideCombatOverlay();
                this.triggerDeath('boss');
                return;
            }
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'lost',
                rewards: this.formatAttrGains(loseRewards)
            });
            char.hp = 1;
            char.injured = true;
            char.injuredMonths = 2;
            UI.addLog('【重伤】你身负重创，勉强撤退。需静养约两个月，方可恢复。', 'lose');
            UI.renderCharacter(char, this.state.jobs);

        } else if (result === 'fled') {
            this.state.pendingChainStep = null; // chain step not completed on flee
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'fled', rewards: ''
            });
            UI.addLog('你成功脱身，暂避其锋芒。', 'result');
        }

        if (cs.postNarrative) UI.addLog(cs.postNarrative, 'result');
        UI.showCombatReturnBtn(result, () => {
            UI.hideCombatOverlay();
            UI.renderAll(this.state);
            this.saveGame();
        });
    },

    promoteJob(jobId) {
        const { char } = this.state;
        if (!char) return;
        const newJob = this.getJob(jobId);
        if (!newJob) return;
        if (!char.unlockedJobs.includes(jobId)) {
            if (!Character.meetsJobRequirements(char, newJob)) {
                UI.addLog(`你尚未满足晋升【${newJob.name}】的条件。`, 'error');
                return;
            }
            char.unlockedJobs.push(jobId);
        }

        const oldJob = this.getJob(char.job);
        const oldBranch = oldJob ? oldJob.branch : null;
        const newBranch = newJob.branch;

        // If switching to a different branch, remove old branch skills
        if (oldBranch && oldBranch !== newBranch && oldBranch !== 'common') {
            const removedNames = char.learnedSkills
                .filter(s => s.branch === oldBranch)
                .map(s => s.name);
            char.learnedSkills = char.learnedSkills.filter(s => s.branch !== oldBranch);
            if (removedNames.length > 0) {
                UI.addLog(`分支变更，失去技能：${removedNames.join('、')}`, 'info');
            }
        }

        // Learn new job's skills (skip already learned)
        const newlyLearned = [];
        for (const skill of (newJob.skills || [])) {
            if (!char.learnedSkills.find(s => s.id === skill.id)) {
                char.learnedSkills.push(skill);
                newlyLearned.push(skill.name);
            }
        }

        char.job = jobId;
        // Recalculate HP max
        const newMax = Character.getHPMax(char, newJob);
        if (char.hp > newMax) char.hp = newMax;

        UI.addLog(`🌟 ${newJob.unlockText}`, 'unlock');
        if (newlyLearned.length > 0) {
            UI.addLog(`📖 学会新技能：${newlyLearned.join('、')}`, 'unlock');
        }
        UI.renderAll(this.state);
        this.saveGame();
    },

    triggerNaturalDeath() {
        const { char } = this.state;
        UI.addLog(`【${char.name}】走完了这一世，寿终正寝，享年${Character.getAgeYears(char)}岁。`, 'system');
        this.triggerDeath('age');
    },

    triggerDeath(cause) {
        const { char } = this.state;
        this.state.gamePhase = 'rebirth';
        this.stopAuto();

        const availableTalents = Rebirth.getAvailableTalents(char);
        const summary = Rebirth.getSummaryText(char, this.state.jobs, this.state.bonds, this.state.npcs);
        UI.showRebirthScreen(summary, availableTalents, cause);
    },

    triggerVictory(isTrueEnding) {
        const { char } = this.state;

        // Normal ending: check if hidden boss chain unlocks (requires 25th birthday jade_tablet event)
        if (!isTrueEnding && char.flags.jade_tablet_awakened && !char.flags.hidden_boss_triggered) {
            char.flags.hidden_boss_triggered = true;
            this.state.gamePhase = 'idle';
            UI.addLog('天魔倒下。江湖归于平静。', 'win');
            UI.addLog('你以为，一切终于结束了……', 'system');
            setTimeout(() => {
                const hiddenEvent = this.state.events.find(e => e.id === 'hidden_boss_appears');
                if (hiddenEvent) this.triggerEvent(hiddenEvent);
            }, 2000);
            return;
        }

        this.state.gamePhase = 'victory';
        this.stopAuto();
        UI.showVictoryScreen(char, isTrueEnding || false);
    },

    KILL_THRESHOLDS: [
        { kills: 5,  flag: 'kill5',  attrs: { agility: 1 },
          msg: '【初历战阵】你已斩落五名对手。身体在一次次对决中悄然蜕变，步伐越来越快。' },
        { kills: 10, flag: 'kill10', attrs: { strength: 1 },
          msg: '【百战苦修】十场胜绩，每一刀都磨砺了你的筋骨。力量在积累中慢慢渗出。' },
        { kills: 20, flag: 'kill20', attrs: { reputation: 2, comprehension: 1 },
          msg: '【杀伐决断】二十场战斗——江湖人开始以不同的眼神看你。你在战斗中悟出了某种东西。' },
        { kills: 30, flag: 'kill30', attrs: { strength: 1, innerForce: 1 },
          msg: '【战名远播】三十场胜绩。你的名字在江湖中开始流传，真气也在无数次生死搏杀中渐渐凝实。' }
    ],

    checkKillThreshold(char) {
        for (const t of this.KILL_THRESHOLDS) {
            if (char.kills === t.kills && !char.flags[t.flag]) {
                char.flags[t.flag] = true;
                UI.addLog(t.msg, 'unlock');
                if (t.attrs) this.applyEffects({ attributes: t.attrs });
            }
        }
    },

    triggerBirthdayEvent(age) {
        const { char } = this.state;
        const mName = this.BIRTH_MONTH_NAMES[(char.birthMonth - 1) || 0];
        const remaining = 20 - age;
        let msg, attrs = null;

        if (age === 16) {
            msg = `【生辰】${mName}，你已${age}岁。初入江湖一年，天地广阔，前途未知。`;
        } else if (age === 17) {
            msg = `【生辰】${mName}，${age}岁。少年老成，已能独当一面。`;
            attrs = { comprehension: 1 };
        } else if (age === 18) {
            msg = `【生辰】${mName}，年满18岁。弱冠之年，江湖人人目，可建功立业了。`;
            attrs = { reputation: 1, strength: 1 };
        } else if (age === 19) {
            if (char.flags.elder_revelation && !char.flags.jade_tablet_awakened) {
                char.flags.jade_tablet_awakened = true;
                msg = `【生辰·异变】${mName}，十九岁。

那枚老者留下的玉牌，忽然变得灼热。

你握住它，感受到其中封印着某种东西——一道锋锐的意志，在漫长的沉眠后，终于感知到了你的存在。

「……还不够。」那意志似乎在说，「但你已经能让我有所感应了。等你走完这一世。」

玉牌重归平静，但你知道：有什么事情，已经开始了。`;
                attrs = { comprehension: 1 };
            } else {
                msg = `【生辰】${mName}，${age}岁。最后一年——天魔之约，如期将至。`;
            }
        } else {
            msg = `【生辰】${mName}，${age}岁。天魔之约还有 ${remaining} 年。`;
        }

        UI.addLog(msg, 'system');
        if (attrs) {
            Character.applyAttributeChanges(char, attrs);
            UI.renderCharacter(char, this.state.jobs);
        }
        UI.renderAll(this.state);
        this.saveGame();
    },

    // Ensure old saves have required fields
    migrateChar(char) {
        if (!char) return char;
        if (!char.bondLevels)      char.bondLevels = {};
        if (!char.bondEventsDone)  char.bondEventsDone = {};
        if (!char.inheritedBonds)  char.inheritedBonds = {};
        if (!char.learnedSkills)   char.learnedSkills = [];
        if (!char.birthMonth)      char.birthMonth = 1;
        if (char.kills === undefined) char.kills = 0;
        if (char.injured === undefined) char.injured = false;
        if (char.injuredMonths === undefined) char.injuredMonths = 0;
        if (!char.chainProgress) char.chainProgress = {};
        if (char.maxAgeMonths > 246) char.maxAgeMonths = 246; // clamp to 5-year game (15→20)
        // Re-derive jade_tablet_awakened for saves past the 19th birthday
        if (!char.flags.jade_tablet_awakened && char.flags.elder_revelation &&
            Character.getAgeYears(char) > 19) {
            char.flags.jade_tablet_awakened = true;
        }
        return char;
    },

    executeRebirth(chosenTalentIds) {
        const { char, npcs } = this.state;
        const newChar = Rebirth.execute(char, chosenTalentIds, npcs);
        newChar.birthMonth = char.birthMonth; // same fate, same birthday
        Character.applyBirthMonthBonus(newChar);
        const job = this.getJob(newChar.job);
        newChar.hp = Character.getHPMax(newChar, job);
        this.migrateChar(newChar);
        this.state.char = newChar;
        this.state.gamePhase = 'idle';
        this.state.seenEvents = new Set();
        UI.clearLog();
        UI.renderAll(this.state);
        const mName = this.BIRTH_MONTH_NAMES[newChar.birthMonth - 1];
        UI.addLog(`✨ 轮回第 ${newChar.rebirthCount} 世。【${newChar.name}】再度降生。和上一世一样，生于${mName}。天魔之约，依然在候。`, 'system');
        this.saveGame();
    },

    toggleAuto() {
        if (this.state.autoAdvance) {
            this.stopAuto();
        } else {
            this.startAuto();
        }
    },

    startAuto() {
        if (this.state.autoAdvance) return;
        this.state.autoAdvance = true;
        UI.setAutoButton(true);
        this.state.autoTimer = setInterval(() => {
            if (this.state.gamePhase === 'idle') {
                this.advanceMonth();
            } else if (this.state.gamePhase !== 'choosing') {
                this.stopAuto();
            }
        }, 800);
    },

    stopAuto() {
        this.state.autoAdvance = false;
        UI.setAutoButton(false);
        if (this.state.autoTimer) {
            clearInterval(this.state.autoTimer);
            this.state.autoTimer = null;
        }
    },

    saveGame() {
        const { char } = this.state;
        if (!char) return;
        try {
            localStorage.setItem('wuxia_save', JSON.stringify(char));
            localStorage.setItem('wuxia_log', JSON.stringify(UI.getLogBuffer()));
            if (this.state.gamePhase === 'combat' && this.state.combatState) {
                localStorage.setItem('wuxia_combat', JSON.stringify({
                    cs: this.state.combatState,
                    pendingChainStep: this.state.pendingChainStep || null
                }));
            } else {
                localStorage.removeItem('wuxia_combat');
            }
        } catch(e) {}
    },

    loadGame() {
        try {
            const saved = localStorage.getItem('wuxia_save');
            if (saved) return this.migrateChar(JSON.parse(saved));
        } catch(e) {}
        return null;
    },

    deleteSave() {
        localStorage.removeItem('wuxia_save');
    }
};

if (typeof module !== 'undefined') module.exports = { Engine };
