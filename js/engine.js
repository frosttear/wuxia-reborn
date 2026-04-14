// engine.js - Game loop and event management

const Engine = {
    state: {
        char: null,
        jobs: [],
        npcs: [],
        events: [],
        enemies: [],
        pendingChoice: null,  // event waiting for player input
        gamePhase: 'idle',    // idle | choosing | game_over | rebirth | victory
        autoAdvance: false,
        autoTimer: null,
        seenEvents: new Set() // track seen events this life to avoid repetition
    },

    async init() {
        const [jobs, npcs, events, enemies] = await Promise.all([
            fetch('data/jobs.json').then(r => r.json()),
            fetch('data/npcs.json').then(r => r.json()),
            fetch('data/events.json').then(r => r.json()),
            fetch('data/enemies.json').then(r => r.json())
        ]);
        this.state.jobs = jobs;
        this.state.npcs = npcs;
        this.state.events = events;
        this.state.enemies = enemies;
    },

    startNewGame(name, inheritedAttributes, legacyTalents) {
        const char = Character.create(name, inheritedAttributes || {}, legacyTalents || []);
        NPCSystem.initRelationships(char, this.state.npcs);
        const job = this.getJob(char.job);
        char.hp = Character.getHPMax(char, job);
        this.state.char = char;
        this.state.gamePhase = 'idle';
        this.state.seenEvents = new Set();
        this.saveGame();
        UI.renderAll(this.state);
        UI.addLog(`【${char.name}】的传奇，从此开始。`, 'system');
        UI.addLog(`年龄：${Character.getAgeYears(char)}岁。一介无名，踏入江湖。`, 'system');
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

        // Check boss trigger (only once, when at hero+ and age > 40)
        if (!char.flags.boss_triggered && Character.getAgeYears(char) >= 40 &&
            (char.job === 'hero' || char.job === 'sword_saint')) {
            char.flags.boss_triggered = true;
            const bossEvent = this.state.events.find(e => e.id === 'tianmo_appears');
            if (bossEvent) {
                this.triggerEvent(bossEvent);
                return;
            }
        }

        // Select and trigger events
        const eligible = this.selectEvents();
        if (eligible.length > 0) {
            this.triggerEvent(eligible[0]);
        } else {
            // No event this month, just update UI
            UI.renderAll(this.state);
            this.saveGame();
        }
    },

    selectEvents() {
        const { char, events } = this.state;
        const eligible = [];

        for (const event of events) {
            if (event.type === 'boss') continue; // boss triggered separately
            if (!this.checkConditions(event.conditions || {})) continue;

            // Slightly reduce weight for recently seen events
            let weight = event.weight;
            if (this.state.seenEvents.has(event.id)) weight = Math.floor(weight * 0.3);

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
        const { event, choices } = this.state.pendingChoice;
        const choice = choices[choiceIndex];
        if (!choice) return;

        this.state.pendingChoice = null;
        this.state.gamePhase = 'idle';

        const effects = choice.effects || {};

        // Combat event
        if (effects.combat) {
            const enemy = this.getEnemy(effects.combat);
            if (enemy) {
                this.resolveCombat(enemy, effects.narrative || '');
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

    resolveCombat(enemy, preNarrative) {
        const { char } = this.state;
        const job = this.getJob(char.job);
        const result = Combat.resolve(char, enemy, job);

        const combatLine = Combat.getSummaryLine(char, enemy, job);
        UI.addLog(`⚔ ${combatLine}`, 'combat-info');
        UI.addLog(result.narrative, result.won ? 'win' : 'lose');

        // Apply win effects
        if (result.won && result.winEffects) {
            this.applyEffects({ attributes: result.winEffects });
        }

        // Check for final boss win
        if (result.won && enemy.isFinalBoss) {
            this.triggerVictory();
            return;
        }

        // Check death
        if (result.died || (enemy.isFinalBoss && !result.won)) {
            UI.renderCharacter(char, this.state.jobs);
            this.triggerDeath(enemy.isFinalBoss ? 'boss' : 'combat');
            return;
        }

        UI.addLog(`本月结束后，你损失了 ${result.hpLost} 点血量。剩余血量：${char.hp}`, 'info');
        UI.renderAll(this.state);
        this.saveGame();
    },

    promoteJob(jobId) {
        const { char } = this.state;
        if (!char) return;
        const job = this.getJob(jobId);
        if (!job) return;
        if (!char.unlockedJobs.includes(jobId)) {
            if (!Character.meetsJobRequirements(char, job)) {
                UI.addLog(`你尚未满足晋升【${job.name}】的条件。`, 'error');
                return;
            }
            char.unlockedJobs.push(jobId);
        }
        const oldJob = char.job;
        char.job = jobId;
        // Recalculate HP max and ensure current HP is valid
        const newJob = this.getJob(jobId);
        const newMax = Character.getHPMax(char, newJob);
        if (char.hp > newMax) char.hp = newMax;
        UI.addLog(`🌟 ${job.unlockText}`, 'unlock');
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

    triggerVictory() {
        const { char } = this.state;
        this.state.gamePhase = 'victory';
        this.stopAuto();
        UI.showVictoryScreen(char);
    },

    executeRebirth(chosenTalentIds) {
        const { char, npcs } = this.state;
        const newChar = Rebirth.execute(char, chosenTalentIds, npcs);
        const job = this.getJob(newChar.job);
        newChar.hp = Character.getHPMax(newChar, job);
        this.state.char = newChar;
        this.state.gamePhase = 'idle';
        this.state.seenEvents = new Set();
        UI.clearLog();
        UI.renderAll(this.state);
        UI.addLog(`✨ 轮回第 ${newChar.rebirthCount} 世。【${newChar.name}】再度降生，带着前世的记忆重走江湖。`, 'system');
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
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return null;
    },

    deleteSave() {
        localStorage.removeItem('wuxia_save');
    }
};
