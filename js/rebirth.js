// rebirth.js - Reincarnation system

const TALENTS = [
    {
        id: 'sword_heart',
        name: '剑心',
        desc: '力量与敏捷获取效率+15%',
        condition: (char) => char.unlockedJobs.includes('swordsman') || char.unlockedJobs.includes('hero') || char.unlockedJobs.includes('sword_saint')
    },
    {
        id: 'spiritual_root',
        name: '慧根',
        desc: '内力与悟性获取效率+15%',
        condition: (char) => char.attributes.innerForce >= 30 || char.attributes.comprehension >= 30
    },
    {
        id: 'battle_hardened',
        name: '百战余生',
        desc: '百战磨练，每场战斗开始时即有3点气力（不需蓄势）',
        condition: (char) => (char.kills || 0) >= 5
    },
    {
        id: 'deep_bonds',
        name: '情深意重',
        desc: '前世羁绊记忆传承，拜访记得的NPC时好感加成加倍',
        condition: (char) => Object.values(char.bondLevels || {}).some(lv => lv >= 3)
    },
    {
        id: 'inherited_name',
        name: '传世之名',
        desc: '前世声望尚存，初始声望+8',
        condition: (char) => char.attributes.reputation >= 20
    },
    {
        id: 'destiny_mark',
        name: '宿命之力',
        desc: '属性继承比例额外+5%',
        condition: (char) => char.rebirthCount >= 2
    },
    {
        id: 'fortune_child',
        name: '气运之子',
        desc: '开局运气+5，运气获取效率+15%',
        condition: (char) => char.attributes.luck >= 20
    },
    {
        id: 'longevity_art',
        name: '长生诀',
        desc: '最大气血+15%',
        condition: (char) => char.attributes.constitution >= 30
    },
    {
        id: 'qi_mastery',
        name: '真气贯体',
        desc: '气盾减伤额外+2，技能增幅额外+10%',
        condition: (char) => char.attributes.innerForce >= 35
    },
    {
        id: 'iron_will',
        name: '铁骨铮铮',
        desc: '受伤休养时间减半（2月→1月）',
        condition: (char) => char.attributes.constitution >= 25 && (char.kills || 0) >= 3
    },
    {
        id: 'worldline_echo',
        name: '既视感',
        desc: '世界线回溯后，初始好感额外+10（所有已结识NPC）',
        condition: (char) => char.rebirthCount >= 3
    },
    {
        id: 'swift_learner',
        name: '触类旁通',
        desc: '悟性获取效率+20%',
        condition: (char) => char.attributes.comprehension >= 35
    },
    {
        id: 'kings_aura',
        name: '王者之气',
        desc: '声望获取效率+25%，初始声望+5',
        condition: (char) => char.attributes.reputation >= 30
    }
];

const INHERIT_BASE_RATE = 0.10; // 10% base attribute inheritance

const Rebirth = {
    // Calculate which talents are available this rebirth
    getAvailableTalents(char) {
        return TALENTS.filter(t => t.condition(char) && !char.legacyTalents.includes(t.id));
    },

    // Calculate inherited attributes for next life
    calculateInheritedAttributes(char) {
        const rate = INHERIT_BASE_RATE + (char.legacyTalents.includes('destiny_mark') ? 0.05 : 0);
        const inherited = {};
        for (const attr in char.attributes) {
            inherited[attr] = Math.floor(char.attributes[attr] * rate);
        }
        // Bonus from fortune_child talent
        if (char.legacyTalents.includes('fortune_child')) {
            inherited.luck = (inherited.luck || 0) + 5;
        }
        // Bonus from inherited_name talent
        if (char.legacyTalents.includes('inherited_name')) {
            inherited.reputation = (inherited.reputation || 0) + 8;
        }
        // Bonus from kings_aura talent
        if (char.legacyTalents.includes('kings_aura')) {
            inherited.reputation = (inherited.reputation || 0) + 5;
        }
        return inherited;
    },

    // Bond level → starting affinity bonus for next life
    BOND_AFFINITY_BONUS: { 1: 15, 2: 30, 3: 50, 4: 65, 5: 75 },

    // Execute rebirth: returns new character with inherited bonuses
    execute(char, chosenTalentIds, allNpcs) {
        const inheritedAttrs = this.calculateInheritedAttributes(char);
        const newTalents = [...char.legacyTalents, ...chosenTalentIds];

        const newChar = Character.create(char.name, inheritedAttrs, newTalents);
        newChar.rebirthCount = char.rebirthCount + 1;

        // Inherit bond levels (世界线记忆)
        newChar.inheritedBonds = Object.assign({}, char.bondLevels);

        NPCSystem.initRelationships(newChar, allNpcs);

        // Apply starting affinity bonuses from inherited bonds
        for (const npcId in newChar.inheritedBonds) {
            const level = newChar.inheritedBonds[npcId];
            const bonus = this.BOND_AFFINITY_BONUS[level] || 0;
            const echoBonus = newChar.legacyTalents.includes('worldline_echo') ? 10 : 0;
            if (bonus + echoBonus > 0) {
                NPCSystem.applyAffinityChanges(newChar, { [npcId]: bonus + echoBonus });
            }
        }

        return newChar;
    },

    // Get a summary text for the rebirth screen
    getSummaryText(char, jobs, bonds, npcs) {
        const years = Character.getAgeYears(char);
        const jobData = jobs && jobs.find(j => j.id === char.job);
        const jobName = jobData ? jobData.name : char.job;
        const lines = [
            `你在这条世界线上活了 ${years} 岁，走完了这一世的旅程。`,
            `最终职业：${jobName}`,
            `力量 ${char.attributes.strength} | 敏捷 ${char.attributes.agility} | 体质 ${char.attributes.constitution}`,
            `内力 ${char.attributes.innerForce} | 悟性 ${char.attributes.comprehension} | 声望 ${char.attributes.reputation}`
        ];

        // Bonds summary
        const bondLines = [];
        if (bonds && npcs) {
            for (const npcId in char.bondLevels) {
                const level = char.bondLevels[npcId];
                if (level > 0) {
                    const npc = npcs.find(n => n.id === npcId);
                    const npcName = npc ? npc.name : npcId;
                    const total = bonds[npcId] ? bonds[npcId].length : '?';
                    bondLines.push(`  ${npcName}（第 ${level}/${total} 章）`);
                }
            }
        }
        if (bondLines.length > 0) {
            lines.push('');
            lines.push('羁绊：');
            lines.push(...bondLines);
        }

        return lines.join('\n');
    }
};

if (typeof module !== 'undefined') module.exports = { Rebirth, TALENTS };
