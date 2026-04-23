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
        pendingBondStep: null,  // { npcId, level, stepIdx, steps } — next bond step after combat win
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

    // Returns true if it handled a birthday/boss event (caller should return immediately).
    _checkBirthdayAndBoss() {
        const { char } = this.state;
        const isBirthday = char.ageMonths > 180 && char.ageMonths % 12 === 0;
        if (!isBirthday) return false;
        const ageYears = Character.getAgeYears(char);
        if (ageYears >= 20) {
            if (!char.flags.boss_triggered) {
                char.flags.boss_triggered = true;
                const bossEvent = this.state.events.find(e => e.id === 'tianmo_appears');
                if (bossEvent) { this.triggerEvent(bossEvent); return true; }
            }
        } else {
            this.triggerBirthdayEvent(ageYears);
            char.flags._is_birthday = true;
        }
        return false;
    },

    getJob(jobId) {
        return this.state.jobs.find(j => j.id === jobId) || null;
    },

    getEnemy(enemyId) {
        return this.state.enemies.find(e => e.id === enemyId) || null;
    },

    advanceMonth() {
        if (typeof GameAudio !== 'undefined') GameAudio.playBGM('explore');
        const { char } = this.state;
        if (!char || this.state.gamePhase !== 'idle') return;

        // Safeguard: age past 20y1m still in exploration = boss never fired or rebirth broke.
        // Re-fire every click until rebirth resets ageMonths below 241.
        if (char.ageMonths >= 241) {
            const bossEvent = this.state.events.find(e => e.id === 'tianmo_appears');
            if (bossEvent) {
                this.triggerEvent(bossEvent);
            } else {
                // Events array corrupted — skip boss fight, force rebirth directly
                this.triggerDeath('天魔降临，命运终结——');
            }
            return;
        }

        char.flags._is_birthday = false; // clear from last birthday
        char.ageMonths++;

        // Monthly HP regen
        const job = this.getJob(char.job);
        const { actualHealed, innerBonus, conBonus } = Character.monthlyHPRegen(char, job);
        UI.renderCharacter(char, this.state.jobs);
        if (actualHealed > 0) {
            const baseHealed = actualHealed - innerBonus - conBonus;
            let msg = `回复 ${actualHealed} 气血`;
            if (innerBonus > 0 || conBonus > 0) {
                const details = [];
                details.push(`基础${baseHealed}`);
                if (innerBonus > 0) details.push(`内力加成+${innerBonus}`);
                if (conBonus > 0) details.push(`体质加成+${conBonus}`);
                msg += `（${details.join('，')}）`;
            }
            UI.addLog(`【内功】内力护体，本月${msg}。`, 'info');
        }

        // Check new job unlocks — auto-promote to highest unlocked job
        this._checkAndAutoPromote();

        // Birthday system: fires when ageMonths % 12 === 0
        if (this._checkBirthdayAndBoss()) return;

        // autoHealInjury passive: clear injury automatically each month
        if (char.injured && (char.passives || []).some(p => p.autoHealInjury)) {
            char.injured = false;
            char.injuredMonths = 0;
            UI.addLog('【青心丹药】苏青的药力帮你迅速消去了伤势。', 'result');
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
        // On birthday months, force a birthday-specific event if available
        if (char.flags._is_birthday && eligible.length > 0) {
            const birthdayEvents = this.state.events.filter(e =>
                e.conditions && e.conditions.flags && e.conditions.flags._is_birthday &&
                this.checkConditions(e.conditions)
            );
            if (birthdayEvents.length > 0) {
                const picked = birthdayEvents[Math.floor(Math.random() * birthdayEvents.length)];
                this.triggerEvent(picked);
                return;
            }
        }
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
            if (event.type === '奇遇' && (char.legacyTalents || []).includes('serendipity')) {
                weight = Math.round(weight * 1.25);
            }
            if (['奇遇', '机缘'].includes(event.type))  weight += compBonus;
            if (['奇遇', '机缘', '交友'].includes(event.type)) weight += Math.floor(luckBonus / 2);
            if (event.type === '遭遇战') weight = Math.max(1, weight - Math.floor(luckBonus / 2));
            // 力量高 → 更多磨练/遭遇战；内力高 → 更多奇遇/机缘；声望高 → 更多交友
            if (['磨练', '遭遇战'].includes(event.type)) weight += strBonus;
            if (['奇遇', '机缘'].includes(event.type))  weight += innerBonus;
            if (event.type === '交友') weight += repBonus;

            // Multi-rebirth: boost unmet-NPC events so players encounter them sooner
            const rebirthCount = char.rebirthCount || 0;
            if (rebirthCount > 0) {
                const condFlags = (event.conditions || {}).flags || {};
                const isUnmetNPC = Object.keys(condFlags).some(k => k.startsWith('met_') && condFlags[k] === false);
                if (isUnmetNPC) weight += rebirthCount * 4;
            }

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
        if (cond.rebirthCount !== undefined && char.rebirthCount < cond.rebirthCount) return false;
        if (cond.minLegacyTalents !== undefined && (char.legacyTalents || []).length < cond.minLegacyTalents) return false;

        // Bond level conditions: { npcId: minLevel }
        if (cond.bondLevels) {
            for (const npcId in cond.bondLevels) {
                if ((char.bondLevels[npcId] || 0) < cond.bondLevels[npcId]) return false;
            }
        }

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
                if (this._checkBirthdayAndBoss()) return;
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

        const _illustrationMap = {
            ancient_grotto: 'ancient-grotto',
            winter_seclusion: 'winter-seclusion',
            temple_offering: 'temple-visit',
            past_life_dream: 'past-life-dream',
            rainy_road: 'journey-dawn',
            old_swordsman: 'journey-dawn',
            deja_vu_road: 'past-life-dream',
            elder_true_form_appears: 'mysterious-elder-ending',
            meet_wang_tie:    'wang-tie-meet',
            meet_li_yunshu:   'li-yunshu-meet',
            meet_yan_chixing: 'yan-chixing-meet',
            meet_su_qing:     'su-qing-meet',
            meet_lingxue:     'ling-xue-meet',
        };
        if (_illustrationMap[event.id]) UI.addIllustration(_illustrationMap[event.id]);

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
            this._checkAndAutoPromote();
            UI.renderAll(this.state);
            this.saveGame();
        }
    },

    _showBondStep(npcId, steps, stepIdx, level, prefix) {
        const step = steps[stepIdx];
        const npc = this.state.npcs.find(n => n.id === npcId);
        const isLast = stepIdx === steps.length - 1;
        const chapterNote = steps.length > 1 ? `（${stepIdx + 1}/${steps.length}）` : '';
        const displayEvent = {
            title: `羁绊·${npc ? npc.name : npcId}·第${level}章${chapterNote}`,
            text: (prefix || '') + step.text,
            type: '羁绊'
        };
        const allChoices = (step.choices || []).map(c =>
            ({ ...c, locked: c.requirements ? !this.checkConditions(c.requirements) : false })
        );
        // Past-life memory: if this bond was completed in a previous life, inject a special choice
        // that grants all non-combat options' bonuses combined
        const char = this.state.char;
        if ((char.inheritedBonds || {})[npcId] >= level) {
            const nonCombatChoices = (step.choices || []).filter(c => !(c.effects && c.effects.combat));
            if (nonCombatChoices.length > 0) {
                const merged = { attributes: {}, npcAffinity: {}, flags: {} };
                for (const c of nonCombatChoices) {
                    const ef = c.effects || {};
                    for (const [k, v] of Object.entries(ef.attributes || {})) merged.attributes[k] = (merged.attributes[k] || 0) + v;
                    for (const [k, v] of Object.entries(ef.npcAffinity || {})) merged.npcAffinity[k] = (merged.npcAffinity[k] || 0) + v;
                    Object.assign(merged.flags, ef.flags || {});
                }
                const npcName = npc ? npc.name : npcId;
                allChoices.unshift({
                    id: 'memory_echo',
                    text: `【前世记忆】这一切，你曾经历过……前世的记忆如画卷展开，所有可能的选择都浮现心间。`,
                    memoryEcho: true,
                    locked: false,
                    effects: {
                        ...merged,
                        narrative: `前世与${npcName}共同走过这一刻的每一种可能，此刻化为心底深处的领悟。记忆中的每一个选择，都成为了这一世的馈赠。`
                    }
                });
            }
        }
        const availableChoices = allChoices.filter(c => !c.locked);
        this.state.pendingChoice = {
            event: displayEvent,
            choices: availableChoices,
            bondStep: { npcId, level, stepIdx, steps },
            bondInfo: isLast ? { npcId, level } : null
        };
        this.state.gamePhase = 'choosing';
        UI.showEvent(displayEvent, allChoices, this.state);
    },

    applyChoice(choiceIndex) {
        if (this.state.gamePhase !== 'choosing' || !this.state.pendingChoice) return;
        const { event, choices, bondInfo, bondStep, chainStep } = this.state.pendingChoice;
        const choice = choices[choiceIndex];
        if (!choice) return;

        this.state.pendingChoice = null;
        this.state.gamePhase = 'idle';

        UI.addLog(`▷ ${choice.text}`, 'choice');

        // Mark bond event complete — but defer if this choice leads to combat
        // (bond completion runs after victory; on loss the bond stays unlocked for retry)
        if (bondInfo && !(choice.effects && choice.effects.combat)) {
            this._completeBond(bondInfo);
        }

        const effects = choice.effects || {};

        const isNonFinalStep = bondStep && bondStep.stepIdx < bondStep.steps.length - 1;

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
            if (chainStep && !effects.combat) this.completeChainStep(chainStep.chainId, chainStep.stepIdx);
            if (!effects.combat && isNonFinalStep) {
                this._showBondStep(bondStep.npcId, bondStep.steps, bondStep.stepIdx + 1, bondStep.level, '');
                return;
            }
            this._checkAndAutoPromote();
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
                if (isNonFinalStep) {
                    this.state.pendingBondStep = {
                        npcId: bondStep.npcId, level: bondStep.level,
                        stepIdx: bondStep.stepIdx + 1, steps: bondStep.steps,
                        bondInfo: null
                    };
                } else if (bondInfo) {
                    // Last bond step: defer completion to after combat victory
                    this.state.pendingBondStep = {
                        npcId: bondStep.npcId, level: bondStep.level,
                        stepIdx: null, steps: bondStep.steps,
                        bondInfo: bondInfo
                    };
                }
                // Show narrative BEFORE combat starts (not after)
                if (effects.narrative) UI.addLog(effects.narrative, 'result');
                this.startCombat(enemy, '');
                return;
            }
        }

        // Complete chain step (non-combat, no attribute effects)
        if (chainStep) this.completeChainStep(chainStep.chainId, chainStep.stepIdx);
        this.applyEffects(effects);
        if (effects.narrative) UI.addLog(effects.narrative, 'result');
        if (isNonFinalStep) {
            this._showBondStep(bondStep.npcId, bondStep.steps, bondStep.stepIdx + 1, bondStep.level, '');
            return;
        }
        this._checkAndAutoPromote();
        UI.renderAll(this.state);
        this.saveGame();
    },

    _completeBond({ npcId, level }) {
        if (typeof GameAudio !== 'undefined') GameAudio.playSFX('bond');
        const char = this.state.char;
        char.bondEventsDone[`${npcId}_${level}`] = true;
        if (char.bondRetryStep) delete char.bondRetryStep[`${npcId}_${level}`];
        char.bondLevels[npcId] = Math.max(char.bondLevels[npcId] || 0, level);
        const npc = this.state.npcs.find(n => n.id === npcId);
        UI.addLog(`💞 与【${npc ? npc.name : npcId}】的羁绊加深！（第${level}章）`, 'unlock');
        const npcBonds = this.state.bonds[npcId];
        const maxLevel = npcBonds ? npcBonds.length : 0;
        if (level < maxLevel) {
            UI.addIllustration(npcId.replace(/_/g, '-') + '-bond-' + level);
        }
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
            UI.addIllustration(npcId.replace(/_/g, '-') + '-ending');
        }
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
        if (this._checkBirthdayAndBoss()) return;
        UI.renderCharacter(char, this.state.jobs);

        if (bondReady) {
            const inherited = char.inheritedBonds[npcId];
            const prefix = inherited && inherited >= bondEvent.level
                ? `「世界线记忆」你隐约记得，在另一条时间线上与${npc.name}曾有过这一段故事……\n\n`
                : '';
            if (bondEvent.steps && bondEvent.steps.length > 0) {
                const retryKey = `${npcId}_${bondEvent.level}`;
                const startStep = (char.bondRetryStep && char.bondRetryStep[retryKey] != null)
                    ? char.bondRetryStep[retryKey] : 0;
                this._showBondStep(npcId, bondEvent.steps, startStep, bondEvent.level, startStep > 0 ? '' : prefix);
            } else {
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
            }
        } else {
            // Casual visit: affinity boost — bigger if NPC is remembered from a past life
            const inheritedLevel = (char.inheritedBonds || {})[npcId] || 0;
            const hasDeepBonds = (char.legacyTalents || []).includes('deep_bonds');
            const affinityGain = inheritedLevel >= 1 ? (hasDeepBonds ? 16 : 8) : 5;
            NPCSystem.changeAffinity(char, npcId, affinityGain);
            const newAffinity = NPCSystem.getAffinity(char, npcId);
            const needed = bondEvent ? bondEvent.minAffinity : null;
            const gap = needed !== null ? needed - newAffinity : null;
            const memoryTag = inheritedLevel >= 1 ? (hasDeepBonds ? '【情深意重】' : '【世界线记忆】') : '';
            const gapNote = gap > 0
                ? `${memoryTag}好感 +${affinityGain}（当前 ${newAffinity}，距第${bondEvent.level}章还差 ${gap}）`
                : `${memoryTag}好感 +${affinityGain}（当前 ${newAffinity}）`;

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

            UI.addVisitAgeHeader(char);
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
            chaos1: '完成「奇怪委托」', chaos2: '完成「追查幕后」',
            sword_tomb_found: '完成「古剑冢」', sword_master_met: '完成「寻访剑师」',
            sword_trial_passed: '完成「剑道试炼」',
            hero_relief: '完成「义救灾民」', hero_tyrant_defeated: '完成「除暴安良」',
            wang_dying_wish: '王铁遗愿（羁绊Lv5）', zhao_traced: '完成「追踪赵霸天」',
            li_old_case_found: '完成「旧案浮现」', li_mother_avenged: '完成「赤崖之战」',
            su_secret_known: '完成「师父的秘密」', su_formula_decided: '完成「药方的归宿」',
            lx_assassin1_done: '完成「追杀令」', lx_assassin2_done: '完成「破阵」',
            elder_trace_found: '完成「微尘之踪」', elder_daughter_found: '完成「清风镇」',
            yan_mountain_visited: '完成「山上的名字」', yan_mountain_cleared: '完成「矿贼清剿」',
            shard_wang_tie: '完成「铁哥的旧事」', shard_yan_chixing: '完成「独行剑客的记账」',
            shard_su_qing: '完成「药师的检验」', shard_li_yunshu: '完成「焚书之记」',
            shard_ling_xue: '完成「天魔的指令」', truth_assembled: '完成「轮回的设计者」',
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
            if (cond.jobs && !cond.jobs.includes(char.job)) {
                const jobNames = cond.jobs.map(jid => {
                    const j = this.getJob(jid);
                    return j ? j.name : jid;
                });
                lockedReasons.push(`需职业：${jobNames.join('或')}`);
            }
            if (cond.bondLevels) {
                for (const [npcId, lvReq] of Object.entries(cond.bondLevels)) {
                    const cur = (char.bondLevels || {})[npcId] || 0;
                    if (cur < lvReq) {
                        const npc = this.state.npcs.find(n => n.id === npcId);
                        lockedReasons.push(`需与${npc ? npc.name : npcId}羁绊达到第${lvReq}章（当前第${cur}章）`);
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
        if (this._checkBirthdayAndBoss()) return;
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
        if (chain.id === 'wuxiang_sword') UI.addIllustration('wuxiang-unlock');
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

    // ── Test combat (no consequences) ────────────────────────────────────────
    startTestCombat(enemyId) {
        if (this.state.gamePhase === 'combat') return;
        const enemy = this.getEnemy(enemyId);
        if (!enemy) return;
        // Clear any stale combat data before starting fresh
        try { localStorage.removeItem('wuxia_combat'); } catch(e) {}
        this.state.combatState = null;

        const { char } = this.state;
        // Snapshot char state to restore after combat
        this.state._testCombatSnapshot = {
            hp: char.hp,
            attributes: JSON.parse(JSON.stringify(char.attributes)),
            flags: JSON.parse(JSON.stringify(char.flags || {})),
        };
        this.state._isTestCombat = true;
        this.startCombat(enemy, '');
        UI.addLog('【⚔ 战斗模拟】结果不影响角色状态。', 'system');
    },

    startCombat(enemy, postNarrative) {
        // Clear any stale combat data before starting fresh
        try { localStorage.removeItem('wuxia_combat'); } catch(e) {}
        this.state.combatState = null;

        const { char } = this.state;
        // Dynamic scaling for 诸世最强之影: based on peak stats across all past lives
        if (enemy.id === 'shadow_strongest') {
            const peak = char.peakCombatStats || { atk: 0, def: 0, hp: 0 };
            enemy = {
                ...enemy,
                attack:  Math.max(enemy.attack,  Math.round((peak.atk || 50) * 1.8)),
                defense: Math.max(enemy.defense, Math.round((peak.def || 30) * 1.7)),
                hp:      Math.max(enemy.hp,      Math.round((peak.hp  || 500) * 1.4)),
            };
        }
        const job = this.getJob(char.job);
        const cs = Combat.initState(char, enemy, job);
        cs.postNarrative = postNarrative || '';
        if ((enemy.isHiddenBoss || enemy.isTrueFinalBoss) && this.allBondsComplete(char)) {
            cs.allBondsBonus = true;
            UI.addLog('【羁绊之力】王铁、李云舒、神秘老者、燕赤行、苏青、凌雪……这一世结下的所有情谊，此刻化为无形之力，护持于你！', 'unlock');
        } else if (enemy.isHiddenBoss && !this.allBondsComplete(char)) {
            UI.addLog('【羁绊未满】你感到胸中力量空缺……或许，集齐所有羁绊才能撼动此敌。', 'info');
        }
        if (enemy.isFinalBoss || enemy.isHiddenBoss || enemy.isTrueFinalBoss) cs.noFlee = true;
        if (enemy.isTrueFinalBoss && (char.passives || []).some(p => p.rebirthPower)) {
            const MARK_FLAGS = ['mark_warrior_power', 'mark_hermit_power', 'mark_wuxiang_power', 'mark_rebirth_power', 'mark_afterstory_power'];
            const markCount = MARK_FLAGS.filter(m => (char.flags || {})[m]).length;
            if (markCount > 0) {
                cs.rebirthPowerBonus = { atk: markCount * 25, def: markCount * 20 };
                cs.playerHP  = Math.min(cs.playerHP  + markCount * 300, cs.playerMaxHP + markCount * 300);
                cs.playerMaxHP += markCount * 300;
                UI.addLog(`【轮回之力】${markCount}枚印记共鸣——诸世之我，共赴一战！攻击+${markCount * 25}，防御+${markCount * 20}，气血+${markCount * 300}！`, 'unlock');
            }
        }
        this.state.combatState = cs;
        this.state.gamePhase = 'combat';
        UI.updateControls(this.state);
        UI.showCombatOverlay(this.state);
        if (typeof GameAudio !== 'undefined') GameAudio.playBGM('combat');
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

        const _sfxMap = { strike: 'strike', defend: 'block', parry: 'block', focus: 'block', flee: 'strike' };
        if (typeof GameAudio !== 'undefined') GameAudio.playSFX(_sfxMap[action] || 'strike');
        const { combatOver, result } = Combat.processTurn(action, cs, char, job);
        UI.updateCombatOverlay(this.state);
        if (typeof GameAudio !== 'undefined') GameAudio.playSFX('hit');

        if (combatOver) {
            setTimeout(() => {
                this.state.combatBusy = false;
                this.endCombat(result, cs);
            }, 900);
        } else {
            this.state.combatBusy = false;
            UI.setCombatActionsEnabled(true);
            this.saveGame(); // persist current combat state for resume on refresh
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

        // Run one real simulation for display (log entries + final HP)
        const disp = Combat._simulateOnce(char, cs.enemy, job);
        cs.log = [
            { turn: 0, text: `<span style="color:#888;font-style:italic">⚡ 快速战斗（预计胜率 ${pct}%，约 ${sim.avgTurns} 回合）</span>` },
            ...disp.log
        ];
        cs.enemyHp = won ? 0 : Math.max(1, disp.enemyHpFinal);

        // Apply expected HP loss to actual char (with ±30% variance)
        if (won) {
            const variance = 0.3;
            const hpLost = Math.round(sim.avgHpLost * (1 - variance + Math.random() * variance * 2));
            Character.takeDamage(char, Math.min(hpLost, char.hp - 1));
        } else {
            char.hp = 0;
        }

        // Patch cs summary stats for endCombat display
        cs.turn             = sim.avgTurns;
        cs.totalDmgDealt    = sim.avgDmgDealt;
        cs.totalDmgReceived = sim.avgDmgReceived;

        // Render the full combat log in the overlay before ending
        const logEl = document.getElementById('combatLog');
        if (logEl) {
            logEl.innerHTML = cs.log.map(e => {
                const badge = e.turn === 0
                    ? `<span class="combat-turn-badge combat-turn-open">⚔ 开战</span>`
                    : `<span class="combat-turn-badge">第${e.turn}回合</span>`;
                return `<div class="combat-log-entry">${badge}${e.text}</div>`;
            }).join('');
            logEl.scrollTop = logEl.scrollHeight;
        }

        // Update HP bars to reflect final state
        UI.updateCombatOverlay(this.state);
        UI.renderCharacter(char, this.state.jobs);

        this.state.combatBusy = false;
        this.endCombat(won ? 'won' : 'lost', cs);
    },

    // kept for endCombat compatibility
    stopCombatAuto() {},

    // Check and auto-promote to newly unlocked jobs (called after combat/chain completion)
    _checkAndAutoPromote() {
        const { char } = this.state;
        const newJobs = Character.checkJobUnlocks(char, this.state.jobs);
        if (newJobs.length > 0) {
            const best = newJobs[newJobs.length - 1];
            this.promoteJob(best.id);
        }
    },

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
        if (typeof GameAudio !== 'undefined') GameAudio.playBGM('explore');
        try { localStorage.removeItem('wuxia_combat'); } catch(e) {}

        // ── Test combat: restore snapshot, skip all consequences ─────────
        if (this.state._isTestCombat) {
            const snap = this.state._testCombatSnapshot;
            if (snap) {
                char.hp = snap.hp;
                Object.assign(char.attributes, snap.attributes);
                char.flags = snap.flags;
            }
            this.state._isTestCombat = false;
            this.state._testCombatSnapshot = null;
            const resultText = result === 'won' ? '胜利' : result === 'fled' ? '逃跑' : '落败';
            UI.addLog(`【⚔ 模拟结束】结果：${resultText}（${cs.turn}回合）。角色状态已恢复。`, 'system');
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: result === 'won' ? 'won' : 'lost',
                rewards: '（战斗模拟，无奖励）'
            });
            UI.showCombatReturnBtn(result, () => {
                UI.hideCombatOverlay();
                UI.renderAll(this.state);
            });
            return;
        }

        // Capture pendingBondStep here (outer scope) so the return-button closure can access it
        const postBondStep = this.state.pendingBondStep;
        if (postBondStep) this.state.pendingBondStep = null;

        if (result === 'won') {
            const rewards = enemy.winEffects || {};

            // Chain combat: if enemy has chainCombat, immediately fight next enemy
            if (enemy.chainCombat) {
                const nextEnemy = this.getEnemy(enemy.chainCombat);
                if (nextEnemy) {
                    const narrative = enemy.chainCombatNarrative || '';
                    UI.addLog(enemy.winNarrative, 'win');
                    if (Object.keys(rewards).length > 0) this.applyEffects({ attributes: rewards });
                    UI.addCombatSummary({
                        turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                        dmgReceived: cs.totalDmgReceived, result: 'won',
                        rewards: this.formatAttrGains(rewards)
                    });
                    char.kills = (char.kills || 0) + 1;
                    this.checkKillThreshold(char);
                    UI.showCombatReturnBtn('won', () => {
                        UI.hideCombatOverlay();
                        // Carry over current HP (no heal between fights)
                        this.startCombat(nextEnemy, cs.postNarrative || '');
                        if (narrative) UI.addLog(narrative, 'system');
                    });
                    return;
                }
            }

            if (enemy.isTrueFinalBoss) {
                char.flags.true_final_boss_beaten = true;
                UI.addLog(enemy.winNarrative, 'win');
                UI.addIllustration('journey-dawn');
                UI.showCombatReturnBtn('won', () => {
                    UI.hideCombatOverlay();
                    this.triggerTrueVictory();
                });
                return;
            }
            if (enemy.isHiddenBoss) {
                char.flags.hidden_boss_beaten = true;
                UI.addLog(enemy.winNarrative, 'win');
                UI.addIllustration('sword-soul-win');
                UI.showCombatReturnBtn('won', () => {
                    UI.hideCombatOverlay();
                    this.triggerVictory(true);
                });
                return;
            }
            if (enemy.isFinalBoss) {
                UI.addLog(enemy.winNarrative, 'win');
                UI.addIllustration('tianmo-win');
                UI.showCombatReturnBtn('won', () => {
                    UI.hideCombatOverlay();
                    this.triggerVictory(false);
                });
                return;
            }
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'won',
                rewards: this.formatAttrGains(rewards)
            });
            // Show win narrative and rewards AFTER combat summary
            UI.addLog(enemy.winNarrative, 'win');
            if (Object.keys(rewards).length > 0) this.applyEffects({ attributes: rewards });
            if (enemy.winFlags) Object.assign(char.flags, enemy.winFlags);
            // Complete chain step on combat victory
            if (this.state.pendingChainStep) {
                const { chainId, stepIdx } = this.state.pendingChainStep;
                this.state.pendingChainStep = null;
                this.completeChainStep(chainId, stepIdx);
            }
            // Deferred bond completion: last-step bond combats complete only on victory
            if (postBondStep && postBondStep.bondInfo) {
                this._completeBond(postBondStep.bondInfo);
            }
            char.kills = (char.kills || 0) + 1;
            this.checkKillThreshold(char);
            // Check for job unlocks after combat (flags may have changed)
            this._checkAndAutoPromote();

        } else if (result === 'lost') {
            UI.addLog(enemy.loseNarrative, 'lose');
            this.state.pendingChainStep = null; // chain step not completed on loss
            const loseRewards = enemy.loseEffects || {};
            if (Object.keys(loseRewards).length > 0) this.applyEffects({ attributes: loseRewards });
            UI.renderCharacter(char, this.state.jobs);
            if (enemy.isTrueFinalBoss) {
                UI.addLog(enemy.loseNarrative, 'lose');
                char.flags.lost_to_final_boss = true;
                if (!char.flags.zhushi_chain_done) {
                    UI.addLog('【提示】击败那个老者需要更强的力量。下一轮回，在【任务】面板中寻找「诸世之我」——以所有世界线上的自己，来对抗他。', 'info');
                }
                UI.addIllustration('sword-soul-lose');
                UI.showCombatReturnBtn('lost', () => {
                    UI.hideCombatOverlay();
                    this.triggerDeath('true_final_boss');
                });
                return;
            }
            if (enemy.isHiddenBoss) {
                UI.addIllustration('sword-soul-lose');
                UI.addLog('你击败了天魔，却败于那更深处的剑意。此生功亏一筑。', 'system');
                if (!this.allBondsComplete(char)) {
                    UI.addLog('【提示】剑魂的弱点是"不懂人心"——走遍江湖，与王铁、李云舒、神秘老者、燕赤行、苏青、凌雪六人结下真正的羁绊，或可找到突破之法。', 'info');
                }
                UI.showCombatReturnBtn('lost', () => {
                    UI.hideCombatOverlay();
                    this.triggerDeath('hidden_boss');
                });
                return;
            }
            if (enemy.isFinalBoss) {
                UI.addIllustration('tianmo-lose');
                UI.showCombatReturnBtn('lost', () => {
                    UI.hideCombatOverlay();
                    this.triggerDeath('boss');
                });
                return;
            }
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'lost',
                rewards: this.formatAttrGains(loseRewards)
            });
            char.hp = 1;
            char.injured = true;
            const hasIronBones = (char.passives || []).some(p => p.injuryHalfDuration);
            const hasIronWill  = (char.legacyTalents || []).includes('iron_will');
            const hasHardBone  = (char.legacyTalents || []).includes('hard_bone');
            char.injuredMonths = hasIronBones ? 2 : hasIronWill ? 2 : hasHardBone ? 3 : 4;
            const injuryMsg = hasIronBones
                ? '【重伤】你身负重创，但铁骨镖魂撑着你——估计两个月便可复原。'
                : hasIronWill
                ? '【重伤】你身负重创，但凭借跨世界线磨练的意志，恢复速度比常人快上一倍。'
                : hasHardBone
                ? '【重伤】你身负重创，但骨头够硬，三个月应可复原。'
                : '【重伤】你身负重创，勉强撤退。需静养三至四个月，方可恢复。';
            UI.addLog(injuryMsg, 'lose');
            // Bond combat lost: bond stays incomplete — player can retry next visit
            if (postBondStep) {
                const npc = this.state.npcs.find(n => n.id === postBondStep.npcId);
                const npcName = npc ? npc.name : '对方';
                UI.addLog(`【羁绊】时机未到，这一战败了。养好伤，磨砺技艺，再来与${npcName}一决高下。`, 'info');
                // Remember which step the combat was on so retry resumes here
                const combatStepIdx = postBondStep.stepIdx !== null
                    ? postBondStep.stepIdx - 1
                    : postBondStep.steps.length - 1;
                if (!this.state.char.bondRetryStep) this.state.char.bondRetryStep = {};
                this.state.char.bondRetryStep[`${postBondStep.npcId}_${postBondStep.level}`] = combatStepIdx;
            }

            this._checkAndAutoPromote();
            UI.renderCharacter(char, this.state.jobs);

        } else if (result === 'fled') {
            this.state.pendingChainStep = null; // chain step not completed on flee
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'fled', rewards: ''
            });
            UI.addLog('你成功脱身，暂避其锋芒。', 'result');
            this._checkAndAutoPromote();
        }

        if (cs.postNarrative) UI.addLog(cs.postNarrative, 'result');
        UI.showCombatReturnBtn(result, () => {
            UI.hideCombatOverlay();
            if (result === 'won' && postBondStep && postBondStep.stepIdx !== null) {
                this._showBondStep(postBondStep.npcId, postBondStep.steps, postBondStep.stepIdx, postBondStep.level, '');
            } else {
                UI.renderAll(this.state);
                this.saveGame();
            }
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

        if (typeof GameAudio !== 'undefined') GameAudio.playSFX('levelup');
        UI.addLog(`🌟 ${newJob.unlockText}`, 'unlock');
        if (newlyLearned.length > 0) {
            UI.addLog(`📖 学会新技能：${newlyLearned.join('、')}`, 'unlock');
        }
        UI.renderAll(this.state);
        this.saveGame();
    },

    triggerDeath(cause) {
        if (typeof GameAudio !== 'undefined') GameAudio.stopBGM();
        if (typeof GameAudio !== 'undefined') GameAudio.playSFX('death');
        const { char } = this.state;
        // Mark hermit run: lived with no deep bonds (all bond levels < 3)
        const maxBondLevel = Math.max(0, ...Object.values(char.bondLevels || {}).map(Number));
        if (maxBondLevel < 3) char.flags.mark_hermit = true;
        // Update peak combat stats for this life
        const _deathJob = this.getJob(char.job);
        const _lifeAtk = Character.getAttackPower(char, _deathJob);
        const _lifeDef = Character.getDefensePower(char, _deathJob);
        const _lifeHp  = Character.getHPMax(char, _deathJob);
        const _prev = char.peakCombatStats || { atk: 0, def: 0, hp: 0 };
        char.peakCombatStats = {
            atk: Math.max(_prev.atk, _lifeAtk),
            def: Math.max(_prev.def, _lifeDef),
            hp:  Math.max(_prev.hp,  _lifeHp)
        };
        this.state.gamePhase = 'rebirth';
        this.stopAuto();
        this.saveGame(); // persist rebirth state so it survives page refresh

        const availableTalents = Rebirth.getAvailableTalents(char);
        const summary = Rebirth.getSummaryText(char, this.state.jobs, this.state.bonds, this.state.npcs);
        UI.showRebirthScreen(summary, availableTalents, cause);
    },

    triggerFinalBossNow() {
        const { char } = this.state;
        if (!char || this.state.gamePhase !== 'idle') return;
        if (!char.flags.zhushi_chain_done) return;
        char.ageMonths = Math.max(char.ageMonths, 240);
        char.flags.boss_triggered = true;
        const bossEvent = this.state.events.find(e => e.id === 'tianmo_appears');
        if (bossEvent) {
            UI.addLog('【诸世共鸣】你感到所有世界线的意志汇聚于一处，时间已不重要——决战，此刻开始。', 'unlock');
            this.triggerEvent(bossEvent);
        }
    },

    triggerVictory(isTrueEnding) {
        const { char } = this.state;

        if (isTrueEnding) {
            // If player chose to confront the elder, trigger true final boss after 剑魂
            if (char.flags.elder_true_form_ready && !char.flags.elder_true_form_triggered) {
                char.flags.elder_true_form_triggered = true;
                this.state.gamePhase = 'idle';
                UI.updateControls(this.state);
                UI.addLog('剑意化为飞灰，玉牌归于沉寂。', 'win');
                UI.addLog('你以为，一切终于结束了……', 'system');
                setTimeout(() => {
                    this.state.gamePhase = 'idle';
                    const elderEvent = this.state.events.find(e => e.id === 'elder_true_form_appears');
                    if (elderEvent) this.triggerEvent(elderEvent);
                }, 2500);
                return;
            }
            // Normal hidden boss true ending
            this.state.gamePhase = 'victory';
            this.stopAuto();
            UI.showVictoryScreen(char, this.state.jobs, this.state.bonds, this.state.npcs);
            return;
        }

        // Defeated 天魔 — always trigger hidden boss (剑魂)
        if (!char.flags.hidden_boss_triggered) {
            char.flags.hidden_boss_triggered = true;
            this.state.gamePhase = 'victory';   // block player actions during transition
            UI.updateControls(this.state);
            UI.addLog('天魔轰然倒下。江湖归于平静，风也停了。', 'win');
            UI.addLog('你以为，一切终于结束了……', 'system');
            setTimeout(() => {
                this.state.gamePhase = 'idle';  // restore before triggering event
                const hiddenEvent = this.state.events.find(e => e.id === 'hidden_boss_appears');
                if (hiddenEvent) this.triggerEvent(hiddenEvent);
            }, 2000);
            return;
        }

        // No hidden boss chain: 天下太平 → darkness returns years later → force rebirth
        this.state.gamePhase = 'victory';   // block all player actions during narrative
        this.stopAuto();
        this.saveGame(); // persist victory state so it survives page refresh
        UI.addLog('────────────────────', 'system');
        UI.addLog('天魔轰然倒下。一阵大风吹散了极天的乌云，天地之间，光重新射入。', 'win');
        UI.addLog('消息传遍四方，百姓称颂英雄，士子赋诗立传。江湖中，那些映日笼罩于天魔阴影下的人们，纷纷抗起了头。', 'system');
        UI.addLog('你站在城楼上，望着这片难得的宁静，觉得这一世，或许算是圆满了。', 'system');
        UI.updateControls(this.state);
        setTimeout(() => {
            UI.addLog('────────────────────', 'system');
            UI.addLog('然而，平静之下，暗流未息。', 'system');
            UI.addLog('五年后。', 'system');
            UI.addLog('天魔的骸骨深处，一股更古老的恶意悬然苏醒。它在无人察觉之时，情然在人间落地生根。', 'system');
            UI.addLog('荔毒蝓延，山河变色。此次，你的躯体已衰，无力回天……', 'lose');
            UI.addLog('「回溯吧。」驱使世界运行的意志似乎在说，「在另一条世界线上，等你再强一些。」', 'system');
            setTimeout(() => {
                this.triggerDeath('boss_aftermath');
            }, 3500);
        }, 3500);
    },

    triggerTrueVictory() {
        this.state.gamePhase = 'victory';
        this.stopAuto();
        const { char } = this.state;
        UI.addLog('────────────────────', 'system');
        UI.addLog('那双掌握轮回九百年的手，就此散为微尘。', 'win');
        UI.addLog('双鱼玉佩的碎片化为光点，在风中渐渐消散——那条无形的锁链，就此断裂。', 'system');
        UI.addLog('你第一次感到，这个世界上没有任何人在注视你、等待你、安排你。', 'system');
        UI.addLog('只有你自己，和这片天地。', 'system');
        UI.addLog('这一世，是你的。', 'win');
        UI.showVictoryScreen(char, this.state.jobs, this.state.bonds, this.state.npcs);
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
            attrs = { strength: 2 };
        } else if (age === 17) {
            msg = `【生辰】${mName}，${age}岁。少年老成，已能独当一面。`;
            attrs = { comprehension: 2 };
        } else if (age === 18) {
            msg = `【生辰】${mName}，年满18岁。弱冠之年，江湖人人目，可建功立业了。`;
            attrs = { reputation: 2, strength: 2 };
        } else if (age === 19) {
            if (char.flags.elder_revelation && !char.flags.jade_tablet_awakened) {
                char.flags.jade_tablet_awakened = true;
                msg = `【生辰·异变】${mName}，十九岁。

那枚沈玄清交给你的玉牌，忽然变得灼热。裂纹中泛起微弱的白光，像是有什么东西在里面苏醒。

你握住它，感受到其中封印着的那道剑意——千年前的上古剑修留下的最后执念。它在漫长的沉眠后，终于感知到了你的存在。

「……还不够。」那意志似乎在说。它的声音不像人的声音，更像是剑刃划过虚空时发出的鸣响。「但你已经能让我有所感应了。等你走完这一世。」

你想起沈玄清的话——剑魂唯一的弱点，是它不懂人心。

玉牌重归平静，但你知道：真正的最终之战，不是天魔——是这枚玉牌里沉睡了千年的东西。`;
                attrs = { comprehension: 2, strength: 2, reputation: 2, agility: 2 };
            } else {
                msg = `【生辰】${mName}，${age}岁。最后一年——天魔之约，如期将至。`;
                attrs = { comprehension: 2, strength: 2, reputation: 2, agility: 2 };
            }
        } else {
            msg = `【生辰】${mName}，${age}岁。天魔之约还有 ${remaining} 年。`;
        }

        UI.addVisitAgeHeader(char);
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
        if (!char.legacyTalents)   char.legacyTalents = [];
        if (!char.passives)        char.passives = [];
        if (!char.birthMonth)      char.birthMonth = 1;
        if (char.kills === undefined) char.kills = 0;
        if (char.injured === undefined) char.injured = false;
        if (char.injuredMonths === undefined) char.injuredMonths = 0;
        if (!char.chainProgress) char.chainProgress = {};
        if (!char.bondRetryStep) char.bondRetryStep = {};
        if (!char.unlockedIllustrations) char.unlockedIllustrations = [];
        // Retroactive illustration unlock for saves predating gallery (v0.21.0)
        if (char.unlockedIllustrations.length === 0) {
            const f = char.flags || {};
            const bl = char.bondLevels || {};
            const push = id => { if (!char.unlockedIllustrations.includes(id)) char.unlockedIllustrations.push(id); };
            for (const npcId of ['wang_tie', 'li_yunshu', 'yan_chixing', 'su_qing', 'ling_xue']) {
                const h = npcId.replace(/_/g, '-');
                const lvl = bl[npcId] || 0;
                if (f['met_' + npcId]) push(h + '-meet');
                if (lvl >= 1) push(h + '-bond-1');
                if (lvl >= 2) push(h + '-bond-2');
                if (lvl >= 3) push(h + '-ending');
            }
            if ((char.rebirthCount || 0) > 0) push('rebirth');
            if (f.elder_true_form_seen || f.zhushi_chain_done) push('mysterious-elder-ending');
        }
        // Re-derive jade_tablet_awakened for saves past the 19th birthday
        if (!char.flags.jade_tablet_awakened && char.flags.elder_revelation &&
            Character.getAgeYears(char) > 19) {
            char.flags.jade_tablet_awakened = true;
        }
        // Migrate old battle_hardened (was ≥5 kills) to new 3-tier system
        if (char.legacyTalents && char.legacyTalents.includes('battle_hardened')) {
            const kills = char.kills || 0;
            if (kills < 15) {
                char.legacyTalents = char.legacyTalents.filter(t => t !== 'battle_hardened');
                if (kills >= 10) char.legacyTalents.push('battle_veteran');
                else char.legacyTalents.push('battle_novice');
            }
        }
        return char;
    },

    executeRebirth(chosenTalentIds) {
        try {
            const { char, npcs } = this.state;
            const newChar = Rebirth.execute(char, chosenTalentIds, npcs);
            newChar.birthMonth = char.birthMonth;
            Character.applyBirthMonthBonus(newChar);
            const job = this.getJob(newChar.job);
            newChar.hp = Character.getHPMax(newChar, job);
            this.migrateChar(newChar);
            this.state.char = newChar;
            this.state.gamePhase = 'idle';
            this.state.seenEvents = new Set();
            if (typeof GameAudio !== 'undefined') GameAudio.playBGM('explore');
            UI.clearLog();
            if (typeof GameAudio !== 'undefined') GameAudio.playSFX('rebirth');
            UI.renderAll(this.state);
            const mName = this.BIRTH_MONTH_NAMES[newChar.birthMonth - 1];
            UI.addLog(`✨ ${newChar.rebirthCount + 1}周目。【${newChar.name}】再度降生。和上一世一样，生于${mName}。天魔之约，依然在候。`, 'system');
            // Don't persist the rebirth intro logs — they're ephemeral transition entries.
            // Clear the buffer so wuxia_log starts clean for the new life.
            UI.logBuffer = [];
            this.saveGame();
        } catch(err) {
            console.error('executeRebirth failed:', err);
            UI.addLog('【系统错误】轮回失败，请刷新页面重试。', 'system');
        }
    },

    toggleAuto() {},
    startAuto() {},
    stopAuto() {
        this.state.autoAdvance = false;
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
            // Persist gamePhase so victory/rebirth states survive refresh
            localStorage.setItem('wuxia_phase', this.state.gamePhase || 'idle');
            if (this.state.gamePhase === 'combat' && this.state.combatState) {
                localStorage.setItem('wuxia_combat', JSON.stringify({
                    cs: this.state.combatState,
                    pendingChainStep: this.state.pendingChainStep || null,
                    isTestCombat: this.state._isTestCombat || false,
                    testCombatSnapshot: this.state._testCombatSnapshot || null
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
        localStorage.removeItem('wuxia_phase');
        localStorage.removeItem('wuxia_combat');
        localStorage.removeItem('wuxia_log');
    },

    exportSave() {
        const { char } = this.state;
        if (!char) { alert('没有存档可以导出'); return; }
        this.saveGame();
        const payload = {
            v: '0.9.7',
            char: JSON.parse(localStorage.getItem('wuxia_save')),
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        navigator.clipboard.writeText(encoded).then(() => {
            UI.addLog('📤 存档已复制到剪贴板。可粘贴保存，或发送给他人。', 'system');
        }).catch(() => {
            // Fallback: show in a prompt for manual copy
            prompt('复制以下存档码：', encoded);
        });
    },

    importSave() {
        const code = prompt('粘贴存档码：');
        if (!code || !code.trim()) return;
        try {
            const json = decodeURIComponent(escape(atob(code.trim())));
            const data = JSON.parse(json);
            if (!data.char || !data.char.name) { alert('无效的存档码'); return; }
            if (!confirm(`确定导入存档？当前进度将被覆盖。\n角色：${data.char.name}（${(data.char.rebirthCount || 0) + 1}周目）`)) return;
            // Set in-memory state BEFORE reload so beforeunload→saveGame writes correct phase
            this.state.char = data.char;
            this.state.gamePhase = 'idle';
            this.state.combatState = null;
            localStorage.setItem('wuxia_save', JSON.stringify(data.char));
            if (data.log) localStorage.setItem('wuxia_log', JSON.stringify(data.log));
            localStorage.removeItem('wuxia_combat');
            localStorage.setItem('wuxia_phase', 'idle');
            location.reload();
        } catch (err) {
            alert('存档码无效：' + err.message);
        }
    }
};

if (typeof module !== 'undefined') module.exports = { Engine };
