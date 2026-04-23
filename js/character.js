// character.js - Character state and attribute management

const BIRTH_MONTH_BONUSES = [
    { attr: 'luck',          amount: 2, label: '开年纳福',  tagline: '运气+2' },
    { attr: 'comprehension', amount: 2, label: '春雨润智',  tagline: '悟性+2' },
    { attr: 'agility',       amount: 2, label: '桃月轻灵',  tagline: '敏捷+2' },
    { attr: 'constitution',  amount: 2, label: '槐夏强壮',  tagline: '体质+2' },
    { attr: 'strength',      amount: 2, label: '烈日锻骨',  tagline: '力量+2' },
    { attr: 'innerForce',    amount: 2, label: '荷月蓄元',  tagline: '内力+2' },
    { attr: 'luck',          amount: 2, label: '七夕天缘',  tagline: '运气+2' },
    { attr: 'comprehension', amount: 2, label: '桂月明志',  tagline: '悟性+2' },
    { attr: 'agility',       amount: 2, label: '菊月清爽',  tagline: '敏捷+2' },
    { attr: 'constitution',  amount: 2, label: '良月厚积',  tagline: '体质+2' },
    { attr: 'innerForce',    amount: 2, label: '寒凝真气',  tagline: '内力+2' },
    { attr: 'strength',      amount: 2, label: '苦寒百炼',  tagline: '力量+2' },
];

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
            ageMonths: 180,       // start at 15 years old (displays as 15岁0月)
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
            eventLog: [],
            passives: [],         // [{ id, name, desc, ... }] unlocked this life
            visitCounts: {},      // { npcId: { year, count } } casual visit limiter
            chainProgress: {},    // { chainId: stepIdx | 'done' }
            peakCombatStats: { atk: 0, def: 0, hp: 0 }
        };
    },

    applyBirthMonthBonus(char) {
        const bonus = BIRTH_MONTH_BONUSES[(char.birthMonth - 1) % 12];
        if (!bonus) return;
        char.attributes[bonus.attr] = (char.attributes[bonus.attr] || 0) + bonus.amount;
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
        const subtotal = base + jobBonus;
        const longevityBonus = char.legacyTalents && char.legacyTalents.includes('longevity_art')
            ? Math.floor(subtotal * 0.15)
            : char.legacyTalents && char.legacyTalents.includes('tough_body')
            ? Math.floor(subtotal * 0.10) : 0;
        let total = subtotal + longevityBonus;
        if ((char.legacyTalents || []).includes('iron_constitution')) {
            total = Math.round(total * 1.15);
        }
        return total;
    },

    getAttackPower(char, job) {
        const base = Math.floor(char.attributes.strength);
        const jobBase = job ? job.baseAttack : 3;
        // Sum fixed bonuses from all learned skills
        const skills = char.learnedSkills || [];
        const skillBonus = skills.reduce((s, sk) => s + (sk.bonuses && sk.bonuses.attack || 0), 0);
        // 侠义之心: reputation scaling (learned skill special)
        const heroBonus = skills.some(sk => sk.special === 'reputation_scaling')
            ? Math.floor(char.attributes.reputation / 10) * 1.5 : 0;
        // 以气御剑: innerForce scaling (learned skill special)
        const saintBonus = skills.some(sk => sk.special === 'innerforce_scaling')
            ? Math.floor(char.attributes.innerForce / 10) * 2.5 : 0;
        // Talent bonus
        const talentBonus = char.legacyTalents.includes('sword_heart') ? Math.floor(base * 0.1)
            : char.legacyTalents.includes('sword_sense') ? Math.floor(base * 0.07) : 0;
        // Passive bonus (e.g. 寒霜剑气)
        const passiveBonus = (char.passives || []).reduce((s, p) => s + (p.combatAtkBonus || 0), 0);
        // lowHpAtkBonus: active when HP ≤ 25% of max (e.g. 三十年铁骨)
        const job_ = null; // avoid circular; hpMax computed inline
        const hpMax = 80 + (char.attributes.constitution || 0) * 3 + (char.job !== 'rookie' ? 0 : 0);
        const lowHpBonus = (char.hp <= Math.floor(hpMax * 0.25))
            ? (char.passives || []).reduce((s, p) => s + (p.lowHpAtkBonus || 0), 0)
            : 0;
        return base + jobBase + skillBonus + heroBonus + saintBonus + talentBonus + passiveBonus + lowHpBonus;
    },

    getDefensePower(char, job) {
        const base = Math.floor(char.attributes.constitution * 0.4 + char.attributes.agility * 0.6);
        const jobBase = job ? job.baseDefense : 2;
        const skills = char.learnedSkills || [];
        const skillBonus = skills.reduce((s, sk) => s + (sk.bonuses && sk.bonuses.defense || 0), 0);
        return base + jobBase + skillBonus;
    },

    // 运气+内力：会心率（属性双倍触发），上限35%
    getLuckTriggerChance(char) {
        const luckPart = char.attributes.luck / 120;
        return Math.min(0.35, luckPart);
    },

    // 运气+敏捷：战斗闪避概率，上限25%
    getLuckDodgeChance(char) {
        const luckPart    = char.attributes.luck / 120;
        const agilityPart = char.attributes.agility / 250;
        return Math.min(0.25, luckPart + agilityPart);
    },

    // 内力·气盾：每次受击扁平减伤 = floor(innerForce / 8)，独立于防御力
    // + 被动减伤（如凌霜剑骨 combatDmgReduce）
    getQiShield(char) {
        const base = Math.floor((char.attributes.innerForce || 0) / 8);
        const talentBonus = (char.legacyTalents || []).includes('qi_mastery') ? 2
            : (char.legacyTalents || []).includes('qi_flow') ? 1 : 0;
        const passiveReduce = (char.passives || []).reduce((s, p) => s + (p.combatDmgReduce || 0), 0);
        return base + talentBonus + passiveReduce;
    },

    // 内力·战斗加成：相对敌方内力的优势幅度，上限~40%
    // enemyInnerForce 省略时取0（用于UI显示潜力上限）
    getSkillAmplify(char, enemyInnerForce) {
        const pIF = char.attributes.innerForce || 0;
        const eIF = enemyInnerForce || 0;
        const diff = pIF - eIF;
        const base = Math.max(0, diff / (pIF + eIF + 10) * 0.40);
        const talentBonus = (char.legacyTalents || []).includes('qi_mastery') ? 0.08
            : (char.legacyTalents || []).includes('qi_flow') ? 0.04 : 0;
        return base + talentBonus;
    },

    applyAttributeChanges(char, changes) {
        const luckChance = this.getLuckTriggerChance(char);
        const isLucky = Math.random() < luckChance;
        let luckyTriggered = false;
        const actualGains = {};

        for (const attr in changes) {
            if (!(attr in char.attributes)) continue;
            let amount = changes[attr];
            if (amount > 0) {
                // 运气幸运触发：双倍
                if (isLucky) { amount *= 2; luckyTriggered = true; }
            }
            char.attributes[attr] = Math.max(0, char.attributes[attr] + amount);
            actualGains[attr] = amount;
        }

        // Talent: 慧根 boosts innerForce/comprehension gains by 15%
        if (char.legacyTalents.includes('spiritual_root')) {
            const bonus = ['innerForce', 'comprehension'];
            for (const attr of bonus) {
                if (changes[attr] && changes[attr] > 0) {
                    const extra = Math.floor(changes[attr] * 0.15);
                    char.attributes[attr] += extra;
                    actualGains[attr] = (actualGains[attr] || 0) + extra;
                }
            }
        } else if (char.legacyTalents.includes('minor_root')) {
            const bonus = ['innerForce', 'comprehension'];
            for (const attr of bonus) {
                if (changes[attr] && changes[attr] > 0) {
                    const extra = Math.floor(changes[attr] * 0.10);
                    char.attributes[attr] += extra;
                    actualGains[attr] = (actualGains[attr] || 0) + extra;
                }
            }
        }
        // Talent: 剑心 boosts strength/agility gains by 15%
        if (char.legacyTalents.includes('sword_heart')) {
            const bonus = ['strength', 'agility'];
            for (const attr of bonus) {
                if (changes[attr] && changes[attr] > 0) {
                    const extra = Math.floor(changes[attr] * 0.15);
                    char.attributes[attr] += extra;
                    actualGains[attr] = (actualGains[attr] || 0) + extra;
                }
            }
        } else if (char.legacyTalents.includes('sword_sense')) {
            const bonus = ['strength', 'agility'];
            for (const attr of bonus) {
                if (changes[attr] && changes[attr] > 0) {
                    const extra = Math.floor(changes[attr] * 0.10);
                    char.attributes[attr] += extra;
                    actualGains[attr] = (actualGains[attr] || 0) + extra;
                }
            }
        }
        // Talent: 气运之子 boosts luck gains by 15%
        if (char.legacyTalents.includes('fortune_child')) {
            if (changes.luck && changes.luck > 0) {
                const extra = Math.floor(changes.luck * 0.15);
                char.attributes.luck += extra;
                actualGains.luck = (actualGains.luck || 0) + extra;
            }
        } else if (char.legacyTalents.includes('lucky_star')) {
            if (changes.luck && changes.luck > 0) {
                const extra = Math.floor(changes.luck * 0.10);
                char.attributes.luck += extra;
                actualGains.luck = (actualGains.luck || 0) + extra;
            }
        }
        // Talent: 触类旁通 boosts comprehension gains by 20%
        if (char.legacyTalents.includes('swift_learner')) {
            if (changes.comprehension && changes.comprehension > 0) {
                const extra = Math.floor(changes.comprehension * 0.20);
                char.attributes.comprehension += extra;
                actualGains.comprehension = (actualGains.comprehension || 0) + extra;
            }
        } else if (char.legacyTalents.includes('quick_wit')) {
            if (changes.comprehension && changes.comprehension > 0) {
                const extra = Math.floor(changes.comprehension * 0.12);
                char.attributes.comprehension += extra;
                actualGains.comprehension = (actualGains.comprehension || 0) + extra;
            }
        }
        // Talent: 王者之气 boosts reputation gains by 25%
        if (char.legacyTalents.includes('kings_aura')) {
            if (changes.reputation && changes.reputation > 0) {
                const extra = Math.floor(changes.reputation * 0.25);
                char.attributes.reputation += extra;
                actualGains.reputation = (actualGains.reputation || 0) + extra;
            }
        }
        // Passives: attrGrowthBonus scales specific attrs (e.g. 云舒剑意, 玄真根基)
        for (const p of (char.passives || [])) {
            if (!p.attrGrowthBonus) continue;
            for (const [attr, rate] of Object.entries(p.attrGrowthBonus)) {
                if (changes[attr] && changes[attr] > 0) {
                    const extra = Math.floor(changes[attr] * rate);
                    char.attributes[attr] += extra;
                    actualGains[attr] = (actualGains[attr] || 0) + extra;
                }
            }
        }

        return { luckyTriggered, actualGains };
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
        const hpMax = this.getHPMax(char, job);
        // Base: 15% of max HP
        const basePct = 0.15;
        // Constitution: +0.5% per point (e.g. 20 con = +10%)
        const conPct = (char.attributes.constitution || 0) * 0.005;
        // Inner force: +0.5% per point
        const innerPct = (char.attributes.innerForce || 0) * 0.005;
        const passiveBonus = (char.passives || []).reduce((s, p) => s + (p.hpRegenBonus || 0), 0);
        const missingPct = (char.passives || []).reduce((max, p) => Math.max(max, p.hpRegenPctMissing || 0), 0);
        const missingBonus = Math.floor((hpMax - char.hp) * missingPct);
        const conBonus = Math.floor(hpMax * conPct);
        const innerBonus = Math.floor(hpMax * innerPct);
        const total = Math.floor(hpMax * basePct) + conBonus + innerBonus + passiveBonus + missingBonus;
        const hpBefore = char.hp;
        this.healHP(char, total, job);
        const actualHealed = char.hp - hpBefore;
        return { total, actualHealed, innerBonus, conBonus };
    }
};

if (typeof module !== 'undefined') module.exports = { Character, BIRTH_MONTH_BONUSES };
