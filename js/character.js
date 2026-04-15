// character.js - Character state and attribute management

const Character = {
    // Create a new character
    create(name, inheritedAttributes, legacyTalents) {
        const base = {
            strength: 5, agility: 5, constitution: 5,
            innerForce: 3, comprehension: 5, luck: 5, reputation: 0
        };
        const attrs = {};
        for (const k in base) {
            attrs[k] = base[k] + (inheritedAttributes[k] || 0);
        }
        return {
            name: name,
            ageMonths: 192,       // start at 16 years old
            maxAgeMonths: 390,    // safety cap; final boss triggers at 360 (age 30)
            birthMonth: 1,        // 1-12, chosen at character creation
            alive: true,
            attributes: attrs,
            hp: 0,                // set after creation
            job: 'nobody',
            unlockedJobs: ['nobody'],
            learnedSkills: [],    // [{ id, name, desc, branch, bonuses, special? }]
            legacyTalents: legacyTalents || [],
            relationships: {},    // { npcId: { affinity, metAt } }
            bondLevels: {},       // { npcId: maxLevelCompleted }
            bondEventsDone: {},   // { "npcId_level": true } — reset each life
            inheritedBonds: {},   // { npcId: bondLevel } — carried across rebirths
            flags: {},            // story flags
            kills: 0,             // cumulative combat wins (hidden stat)
            rebirthCount: 0,
            eventLog: []
        };
    },

    getAgeYears(char) {
        return Math.floor(char.ageMonths / 12);
    },

    getAgeMonthsRemainder(char) {
        return char.ageMonths % 12;
    },

    getHPMax(char, job) {
        const base = char.attributes.constitution * 20;
        const jobBonus = job ? job.hpBonus : 0;
        const talentBonus = char.legacyTalents.includes('longevity_secret') ? 50 : 0;
        return base + jobBonus + talentBonus;
    },

    getAttackPower(char, job) {
        const base = char.attributes.strength * 2;
        const jobBase = job ? job.baseAttack : 3;
        // Sum fixed bonuses from all learned skills
        const skills = char.learnedSkills || [];
        const skillBonus = skills.reduce((s, sk) => s + (sk.bonuses && sk.bonuses.attack || 0), 0);
        // 侠义之心: reputation scaling (learned skill special)
        const heroBonus = skills.some(sk => sk.special === 'reputation_scaling')
            ? Math.floor(char.attributes.reputation / 10) : 0;
        // 以气御剑: innerForce scaling (learned skill special)
        const saintBonus = skills.some(sk => sk.special === 'innerforce_scaling')
            ? Math.floor(char.attributes.innerForce / 10) * 3 : 0;
        // Talent bonus
        const talentBonus = char.legacyTalents.includes('sword_heart') ? Math.floor(base * 0.1) : 0;
        return base + jobBase + skillBonus + heroBonus + saintBonus + talentBonus;
    },

    getDefensePower(char, job) {
        const base = Math.floor(char.attributes.constitution * 1.5 + char.attributes.agility * 0.5);
        const jobBase = job ? job.baseDefense : 2;
        const skills = char.learnedSkills || [];
        const skillBonus = skills.reduce((s, sk) => s + (sk.bonuses && sk.bonuses.defense || 0), 0);
        return base + jobBase + skillBonus;
    },

    // 悟性：每10点提升5%属性学习效率
    getComprehensionRate(char) {
        return Math.floor(char.attributes.comprehension / 10) * 0.05;
    },

    // 运气：每20点有5%概率触发双倍收益
    getLuckTriggerChance(char) {
        return Math.min(0.5, char.attributes.luck / 200);
    },

    // 运气：战斗闪避概率（每20点减伤5%，上限30%）
    getLuckDodgeChance(char) {
        return Math.min(0.30, char.attributes.luck / 200);
    },

    applyAttributeChanges(char, changes) {
        const compRate = this.getComprehensionRate(char);
        const luckChance = this.getLuckTriggerChance(char);
        const isLucky = Math.random() < luckChance;
        let luckyTriggered = false;

        for (const attr in changes) {
            if (!(attr in char.attributes)) continue;
            let amount = changes[attr];
            if (amount > 0) {
                // 悟性加成
                amount = Math.round(amount * (1 + compRate));
                // 运气幸运触发：双倍
                if (isLucky) { amount *= 2; luckyTriggered = true; }
            }
            char.attributes[attr] = Math.max(0, char.attributes[attr] + amount);
        }

        // Talent: 慧根 boosts innerForce/comprehension gains by 15%
        if (char.legacyTalents.includes('spiritual_root')) {
            const bonus = ['innerForce', 'comprehension'];
            for (const attr of bonus) {
                if (changes[attr] && changes[attr] > 0) {
                    char.attributes[attr] += Math.floor(changes[attr] * 0.15);
                }
            }
        }
        // Talent: 剑心 boosts strength/agility gains by 15%
        if (char.legacyTalents.includes('sword_heart')) {
            const bonus = ['strength', 'agility'];
            for (const attr of bonus) {
                if (changes[attr] && changes[attr] > 0) {
                    char.attributes[attr] += Math.floor(changes[attr] * 0.15);
                }
            }
        }

        return luckyTriggered;
    },

    healHP(char, amount, job) {
        const max = this.getHPMax(char, job);
        char.hp = Math.min(max, char.hp + amount);
    },

    takeDamage(char, amount) {
        char.hp = Math.max(0, char.hp - amount);
        return char.hp <= 0;
    },

    checkJobUnlocks(char, jobs) {
        const newlyUnlocked = [];
        for (const job of jobs) {
            if (char.unlockedJobs.includes(job.id)) continue;
            if (this.meetsJobRequirements(char, job)) {
                char.unlockedJobs.push(job.id);
                newlyUnlocked.push(job);
            }
        }
        return newlyUnlocked;
    },

    meetsJobRequirements(char, job) {
        const reqs = job.requirements || {};
        for (const attr in reqs) {
            if ((char.attributes[attr] || 0) < reqs[attr]) return false;
        }
        const reqFlags = job.requiredFlags || {};
        for (const flag in reqFlags) {
            if ((char.flags[flag] || false) !== reqFlags[flag]) return false;
        }
        return true;
    },

    promoteJob(char, jobId) {
        if (char.unlockedJobs.includes(jobId)) {
            char.job = jobId;
            return true;
        }
        return false;
    },

    monthlyHPRegen(char, job) {
        this.healHP(char, 10, job);
    }
};
