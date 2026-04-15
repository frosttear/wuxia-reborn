// engine.js - Game loop and event management

const Engine = {
    state: {
        char: null,
        jobs: [],
        npcs: [],
        events: [],
        enemies: [],
        bonds: {},            // loaded from bonds.json
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
        const [jobs, npcs, events, enemies, bonds] = await Promise.all([
            fetch('data/jobs.json').then(r => r.json()),
            fetch('data/npcs.json').then(r => r.json()),
            fetch('data/events.json').then(r => r.json()),
            fetch('data/enemies.json').then(r => r.json()),
            fetch('data/bonds.json').then(r => r.json())
        ]);
        this.state.jobs = jobs;
        this.state.npcs = npcs;
        this.state.events = events;
        this.state.enemies = enemies;
        this.state.bonds = bonds;
    },

    BIRTH_MONTH_NAMES: ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'],

    startNewGame(name, birthMonth, inheritedAttributes, legacyTalents) {
        const char = Character.create(name, inheritedAttributes || {}, legacyTalents || []);
        char.birthMonth = birthMonth || 1;
        NPCSystem.initRelationships(char, this.state.npcs);
        const job = this.getJob(char.job);
        char.hp = Character.getHPMax(char, job);
        this.state.char = char;
        this.state.gamePhase = 'idle';
        this.state.seenEvents = new Set();
        this.saveGame();
        UI.renderAll(this.state);
        const mName = this.BIRTH_MONTH_NAMES[char.birthMonth - 1];
        UI.addLog(`【${char.name}】的传奇，从此开始。`, 'system');
        UI.addLog(`生于${mName}，年集16岁，踏入江湖。三十岁生辰日，天魔如约而至。`, 'system');
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

        char.ageMonths++;

        // Monthly HP regen
        const job = this.getJob(char.job);
        Character.monthlyHPRegen(char, job);
        UI.renderCharacter(char, this.state.jobs);

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

        // Birthday system: fires every 12 months starting from ageMonths=204 (17th birthday)
        const isBirthday = char.ageMonths > 192 && char.ageMonths % 12 === 0;
        if (isBirthday) {
            const ageYears = Character.getAgeYears(char);

            if (ageYears >= 30) {
                // 30th birthday — final boss, no job requirement
                if (!char.flags.boss_triggered) {
                    char.flags.boss_triggered = true;
                    const bossEvent = this.state.events.find(e => e.id === 'tianmo_appears');
                    if (bossEvent) { this.triggerEvent(bossEvent); return; }
                }
            } else {
                this.triggerBirthdayEvent(ageYears);
                return;
            }
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
            if (char.injured && char.ageMonths % 3 === 0) {
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

        // Events fire every 3 months; off-months just advance time quietly
        if (char.ageMonths % 3 !== 0) {
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

        // 悟性提升奇遇/机缘权重；运气降低遭遇战、提升正面事件权重
        const compBonus  = Math.floor(char.attributes.comprehension / 5);
        const luckBonus  = Math.floor(char.attributes.luck / 8);

        for (const event of events) {
            if (event.type === 'boss') continue; // boss triggered separately
            if (!this.checkConditions(event.conditions || {})) continue;

            let weight = event.weight;
            if (['奇遇', '机缘'].includes(event.type))  weight += compBonus;
            if (['奇遇', '机缘', '交友'].includes(event.type)) weight += Math.floor(luckBonus / 2);
            if (event.type === '遭遇战') weight = Math.max(1, weight - Math.floor(luckBonus / 2));

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

        // Filter available choices (some have requirements)
        const availableChoices = (event.choices || []).filter(choice => {
            if (!choice.requirements) return true;
            return this.checkConditions(choice.requirements);
        });

        // Show the event
        UI.showEvent(event, availableChoices, this.state);

        if (availableChoices.length === 1 && !availableChoices[0].requirements) {
            // Single-choice or no meaningful decision — auto-resolve after brief display
            this.state.pendingChoice = { event, choices: availableChoices };
            this.state.gamePhase = 'choosing';
        } else if (availableChoices.length > 0) {
            this.state.pendingChoice = { event, choices: availableChoices };
            this.state.gamePhase = 'choosing';
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
        const { event, choices, bondInfo } = this.state.pendingChoice;
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
        }

        const effects = choice.effects || {};

        // Log lucky trigger if attributes changed
        if (effects.attributes) {
            const lucky = Character.applyAttributeChanges(this.state.char, effects.attributes);
            if (lucky) UI.addLog('✨ 幸运触发！属性收益翻倍！', 'unlock');
            const effectsCopy = Object.assign({}, effects);
            delete effectsCopy.attributes;
            this.applyEffects(effectsCopy);
            if (effects.narrative) UI.addLog(effects.narrative, 'result');
            UI.renderAll(this.state);
            this.saveGame();
            return;
        }

        // Combat event → start turn-based combat
        // Apply non-combat side-effects first (npcAffinity, flags, hp)
        if (effects.combat) {
            const enemy = this.getEnemy(effects.combat);
            if (enemy) {
                const sideEffects = Object.assign({}, effects);
                delete sideEffects.combat;
                delete sideEffects.narrative;
                delete sideEffects.attributes; // already handled above
                this.applyEffects(sideEffects);
                this.startCombat(enemy, effects.narrative || '');
                return;
            }
        }

        this.applyEffects(effects);

        if (effects.narrative) {
            UI.addLog(effects.narrative, 'result');
        }

        UI.renderAll(this.state);
        this.saveGame();
    },

    applyEffects(effects) {
        const { char } = this.state;
        if (!effects) return;

        if (effects.attributes) {
            Character.applyAttributeChanges(char, effects.attributes);
        }

        if (effects.hp) {
            const job = this.getJob(char.job);
            if (effects.hp > 0) {
                Character.healHP(char, effects.hp, job);
            } else {
                Character.takeDamage(char, -effects.hp);
            }
        }

        if (effects.flags) {
            for (const flag in effects.flags) {
                char.flags[flag] = effects.flags[flag];
            }
        }

        if (effects.npcAffinity) {
            NPCSystem.applyAffinityChanges(char, effects.npcAffinity);
        }
    },

    // Return list of NPCs the player can currently visit for a bond event
    getAvailableVisits() {
        const { char, bonds, npcs } = this.state;
        if (!char || !bonds) return [];
        const available = [];
        for (const npcId in bonds) {
            const npc = npcs.find(n => n.id === npcId);
            if (!npc) continue;
            const npcBonds = bonds[npcId];
            const currentLevel = char.bondLevels[npcId] || 0;
            const nextEvent = npcBonds.find(b => b.level === currentLevel + 1);
            if (!nextEvent) continue;
            if (char.bondEventsDone[`${npcId}_${nextEvent.level}`]) continue;
            const affinity = NPCSystem.getAffinity(char, npcId);
            if (affinity < nextEvent.minAffinity) continue;
            available.push({ npcId, npc, bondEvent: nextEvent, affinity, currentLevel });
        }
        return available;
    },

    visitNPC(npcId) {
        const { char } = this.state;
        if (!char || this.state.gamePhase !== 'idle') return;
        const npcBonds = this.state.bonds[npcId];
        if (!npcBonds) return;
        const currentLevel = char.bondLevels[npcId] || 0;
        const bondEvent = npcBonds.find(b => b.level === currentLevel + 1);
        if (!bondEvent) return;

        // Advance months (visit costs 3 months — travel + time spent)
        const job = this.getJob(char.job);
        for (let i = 0; i < 3; i++) {
            char.ageMonths++;
            Character.monthlyHPRegen(char, job);
            if (char.ageMonths >= char.maxAgeMonths) {
                UI.renderCharacter(char, this.state.jobs);
                this.triggerNaturalDeath();
                return;
            }
        }
        UI.renderCharacter(char, this.state.jobs);

        const npc = this.state.npcs.find(n => n.id === npcId);
        const inherited = char.inheritedBonds[npcId];
        const prefix = inherited && inherited >= bondEvent.level
            ? `【前世记忆】你隐约记得与${npc.name}曾有过这一段故事……\n\n`
            : '';
        const displayEvent = Object.assign({}, bondEvent, {
            text: prefix + bondEvent.text,
            title: `羁绊·${npc ? npc.name : npcId}·第${bondEvent.level}章`
        });

        this.state.pendingChoice = {
            event: displayEvent,
            choices: bondEvent.choices,
            bondInfo: { npcId, level: bondEvent.level }
        };
        this.state.gamePhase = 'choosing';
        UI.showEvent(displayEvent, bondEvent.choices, this.state);
    },

    startCombat(enemy, postNarrative) {
        const { char } = this.state;
        const job = this.getJob(char.job);
        const cs = Combat.initState(char, enemy, job);
        cs.postNarrative = postNarrative || '';
        this.state.combatState = cs;
        this.state.gamePhase = 'combat';
        UI.showCombatOverlay(this.state);
    },

    handleCombatAction(action) {
        if (this.state.gamePhase !== 'combat' || !this.state.combatState || this.state.combatBusy) return;
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

    toggleCombatAuto() {
        if (this.state.combatAutoActive) {
            this.stopCombatAuto();
        } else {
            this.startCombatAuto();
        }
    },

    startCombatAuto() {
        if (this.state.combatAutoActive) return;
        this.state.combatAutoActive = true;
        UI.setCombatAutoButton(true);
        this.state.combatAutoTimer = setInterval(() => {
            if (this.state.gamePhase === 'combat') {
                this.handleCombatAction('attack');
            } else {
                this.stopCombatAuto();
            }
        }, 1200);
    },

    stopCombatAuto() {
        this.state.combatAutoActive = false;
        UI.setCombatAutoButton(false);
        if (this.state.combatAutoTimer) {
            clearInterval(this.state.combatAutoTimer);
            this.state.combatAutoTimer = null;
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
        UI.hideCombatOverlay();
        this.state.combatState = null;
        this.state.gamePhase = 'idle';

        if (result === 'won') {
            UI.addLog(enemy.winNarrative, 'win');
            const rewards = enemy.winEffects || {};
            if (Object.keys(rewards).length > 0) this.applyEffects({ attributes: rewards });
            if (enemy.isHiddenBoss) {
                char.flags.hidden_boss_beaten = true;
                this.triggerVictory(true);
                return;
            }
            if (enemy.isFinalBoss) { this.triggerVictory(false); return; }
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'won',
                rewards: this.formatAttrGains(rewards)
            });
            char.kills = (char.kills || 0) + 1;
            this.checkKillThreshold(char);

        } else if (result === 'lost') {
            UI.addLog(enemy.loseNarrative, 'lose');
            const loseRewards = enemy.loseEffects || {};
            if (Object.keys(loseRewards).length > 0) this.applyEffects({ attributes: loseRewards });
            UI.renderCharacter(char, this.state.jobs);
            if (enemy.isHiddenBoss) {
                UI.addLog('你击败了天魔，却败于那更深处的剑意。此生功亏一筑。下一世，再来。', 'system');
                this.triggerDeath('hidden_boss');
                return;
            }
            if (enemy.isFinalBoss) {
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
            char.injuredMonths = 6;
            UI.addLog('【重伤】你身负重创，勉强撤退。未来数月须静养调息，方可恢复。', 'lose');
            UI.renderCharacter(char, this.state.jobs);
            UI.renderAll(this.state);
            this.saveGame();
            return;

        } else if (result === 'fled') {
            UI.addCombatSummary({
                turns: cs.turn, dmgDealt: cs.totalDmgDealt,
                dmgReceived: cs.totalDmgReceived, result: 'fled', rewards: ''
            });
            UI.addLog('你成功脱身，暂避其锋芒。', 'result');
        }

        if (cs.postNarrative) UI.addLog(cs.postNarrative, 'result');
        UI.renderAll(this.state);
        this.saveGame();
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
        const summary = Rebirth.getSummaryText(char);
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
        const remaining = 30 - age;
        let msg, attrs = null;

        if (age === 17) {
            msg = `【生辰】${mName}，你已${age}岁。初入江湖一年，天地广阔，前途未知。`;
        } else if (age === 18) {
            msg = `【生辰】${mName}，年满18岁。在江湖中，这个年纪已能独当一面。`;
            attrs = { comprehension: 1 };
        } else if (age === 20) {
            msg = `【生辰】${mName}，弱冠之年。二十岁，正是建功立业的好时候。`;
            attrs = { reputation: 1, strength: 1 };
        } else if (age === 24) {
            msg = `【生辰】${mName}，${age}岁。天魔之约，还有六年。时间，越来越少了。`;
        } else if (age === 25) {
            if (char.flags.elder_revelation && !char.flags.jade_tablet_awakened) {
                char.flags.jade_tablet_awakened = true;
                msg = `【生辰·异变】${mName}，二十五岁。

那枚老者留下的玉牌，忽然变得灼热。

你握住它，感受到其中封印着某种东西——一道锋锐的意志，在漫长的沉眠后，终于感知到了你的存在。

「……还不够。」那意志似乎在说，「但你已经能让我有所感应了。等你走完这一世。」

玉牌重归平静，但你知道：有什么事情，已经开始了。`;
                attrs = { comprehension: 1 };
            } else {
                msg = `【生辰】${mName}，${age}岁。天魔之约还有五年。`;
            }
        } else if (age === 27) {
            msg = `【生辰】${mName}，${age}岁。还有三年。江湖中走过的路，足够你面对天魔了吗？`;
        } else if (age === 29) {
            msg = `【生辰】${mName}，${age}岁。最后一年。天魔，明年生辰，如期而至。`;
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
        // Re-derive jade_tablet_awakened for saves that went through 25th birthday before this flag existed
        if (!char.flags.jade_tablet_awakened && char.flags.elder_revelation &&
            Character.getAgeYears(char) > 25) {
            char.flags.jade_tablet_awakened = true;
        }
        return char;
    },

    executeRebirth(chosenTalentIds) {
        const { char, npcs } = this.state;
        const newChar = Rebirth.execute(char, chosenTalentIds, npcs);
        newChar.birthMonth = char.birthMonth; // same fate, same birthday
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
