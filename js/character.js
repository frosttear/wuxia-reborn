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
            maxAgeMonths: 960,    // die at 80
            alive: true,
            attributes: attrs,
            hp: 0,                // set after creation
            job: 'nobody',
            unlockedJobs: ['nobody'],
            legacyTalents: legacyTalents || [],
            relationships: {},    // { npcId: { affinity, metAt } }
            flags: {},            // story flags
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
        const skillBonus = job ? (job.skillBonuses && job.skillBonuses.attack || 0) : 0;
        // 侠义之心: reputation bonus for hero
        const heroBonus = (job && job.id === 'hero') ? Math.floor(char.attributes.reputation * 0.5) : 0;
        // 以气御剑: innerForce bonus for sword_saint
        const saintBonus = (job && job.id === 'sword_saint') ? Math.floor(char.attributes.innerForce / 10) * 3 : 0;
        // Talent bonus
        const talentBonus = char.legacyTalents.includes('sword_heart') ? Math.floor(base * 0.1) : 0;
        return base + jobBase + skillBonus + heroBonus + saintBonus + talentBonus;
    },

    getDefensePower(char, job) {
        const base = Math.floor(char.attributes.constitution * 1.5 + char.attributes.agility * 0.5);
        const jobBase = job ? job.baseDefense : 2;
        const skillBonus = job ? (job.skillBonuses && job.skillBonuses.defense || 0) : 0;
        return base + jobBase + skillBonus;
    },

    applyAttributeChanges(char, changes) {
        for (const attr in changes) {
            if (attr in char.attributes) {
                char.attributes[attr] = Math.max(0, char.attributes[attr] + changes[attr]);
            }
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
