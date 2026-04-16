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
        condition: (char) => char.attributes.innerForce >= 20 || char.attributes.comprehension >= 20
    },
    {
        id: 'longevity_secret',
        name: '长生诀',
        desc: '最大血量+50，寿命延长5年',
        condition: (char) => Character.getAgeYears(char) >= 38
    },
    {
        id: 'destiny_mark',
        name: '宿命之力',
        desc: '属性继承比例额外+5%',
        condition: (char) => char.rebirthCount >= 2
    },
    {
        id: 'jianghu_wisdom',
        name: '江湖阅历',
        desc: '声望初始值+5，运气+2',
        condition: (char) => char.attributes.reputation >= 15
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
        // Bonus from jianghu_wisdom talent
        if (char.legacyTalents.includes('jianghu_wisdom')) {
            inherited.reputation = (inherited.reputation || 0) + 5;
            inherited.luck = (inherited.luck || 0) + 2;
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

        // Extend lifespan if longevity talent
        if (newTalents.includes('longevity_secret')) {
            newChar.maxAgeMonths += 60; // +5 years
        }

        // Inherit bond levels (穿越记忆)
        newChar.inheritedBonds = Object.assign({}, char.bondLevels);

        NPCSystem.initRelationships(newChar, allNpcs);

        // Apply starting affinity bonuses from inherited bonds
        for (const npcId in newChar.inheritedBonds) {
            const level = newChar.inheritedBonds[npcId];
            const bonus = this.BOND_AFFINITY_BONUS[level] || 0;
            if (bonus > 0) {
                NPCSystem.applyAffinityChanges(newChar, { [npcId]: bonus });
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
            `你活了 ${years} 岁，走完了这一世的旅程。`,
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
