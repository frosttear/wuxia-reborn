// rebirth.js - Reincarnation system

const TALENTS = [
    // --- 低阶天赋 ---
    {
        id: 'sword_sense',
        name: '剑心初悟',
        desc: '力量与敏捷获取效率+10%',
        condition: (char) => char.attributes.strength >= 12 || char.attributes.agility >= 12,
        upgradedBy: 'sword_heart'
    },
    {
        id: 'minor_root',
        name: '灵犀',
        desc: '内力与悟性获取效率+10%',
        condition: (char) => char.attributes.innerForce >= 15 || char.attributes.comprehension >= 15,
        upgradedBy: 'spiritual_root'
    },
    {
        id: 'lucky_star',
        name: '幸运儿',
        desc: '开局运气+3，运气获取效率+10%',
        condition: (char) => char.attributes.luck >= 10,
        upgradedBy: 'fortune_child'
    },
    {
        id: 'tough_body',
        name: '强身术',
        desc: '最大气血+10%',
        condition: (char) => char.attributes.constitution >= 15,
        upgradedBy: 'longevity_art'
    },
    {
        id: 'qi_flow',
        name: '吐纳术',
        desc: '气盾减伤额外+1，技能增幅额外+5%',
        condition: (char) => char.attributes.innerForce >= 20,
        upgradedBy: 'qi_mastery'
    },
    {
        id: 'hard_bone',
        name: '硬骨头',
        desc: '受伤休养时间-1个月',
        condition: (char) => char.attributes.constitution >= 15 && (char.kills || 0) >= 1,
        upgradedBy: 'iron_will'
    },
    {
        id: 'quick_wit',
        name: '一点灵光',
        desc: '悟性获取效率+12%',
        condition: (char) => char.attributes.comprehension >= 20,
        upgradedBy: 'swift_learner'
    },
    // --- 高阶天赋 ---
    {
        id: 'sword_heart',
        name: '剑心',
        desc: '力量与敏捷获取效率+15%',
        condition: (char) => char.attributes.strength >= 20 || char.attributes.agility >= 20,
        upgrades: 'sword_sense'
    },
    {
        id: 'spiritual_root',
        name: '慧根',
        desc: '内力与悟性获取效率+15%',
        condition: (char) => char.attributes.innerForce >= 30 || char.attributes.comprehension >= 30,
        upgrades: 'minor_root'
    },
    {
        id: 'battle_novice',
        name: '初经战阵',
        desc: '每场战斗开始时即有1点气力',
        condition: (char) => (char.kills || 0) >= 5,
        upgradedBy: 'battle_veteran'
    },
    {
        id: 'battle_veteran',
        name: '沙场老手',
        desc: '每场战斗开始时即有2点气力',
        condition: (char) => (char.kills || 0) >= 10,
        upgrades: 'battle_novice',
        upgradedBy: 'battle_hardened'
    },
    {
        id: 'battle_hardened',
        name: '百战余生',
        desc: '百战磨练，每场战斗开始时即有3点气力',
        condition: (char) => (char.kills || 0) >= 15,
        upgrades: 'battle_veteran'
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
        condition: (char) => char.attributes.reputation >= 20,
        upgradedBy: 'kings_aura'
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
        condition: (char) => char.attributes.luck >= 20,
        upgrades: 'lucky_star'
    },
    {
        id: 'longevity_art',
        name: '长生诀',
        desc: '最大气血+15%',
        condition: (char) => char.attributes.constitution >= 30,
        upgrades: 'tough_body'
    },
    {
        id: 'qi_mastery',
        name: '真气贯体',
        desc: '气盾减伤额外+2，技能增幅额外+10%',
        condition: (char) => char.attributes.innerForce >= 35,
        upgrades: 'qi_flow'
    },
    {
        id: 'iron_will',
        name: '铁骨铮铮',
        desc: '受伤休养时间减半（2月→1月）',
        condition: (char) => char.attributes.constitution >= 25 && (char.kills || 0) >= 3,
        upgrades: 'hard_bone'
    },
    {
        id: 'worldline_echo',
        name: '既视感',
        desc: '世界线回溯后，前世羁绊好感大幅提升，无需从零积累即可触发后续章节',
        condition: (char) => char.rebirthCount >= 3
    },
    {
        id: 'swift_learner',
        name: '触类旁通',
        desc: '悟性获取效率+20%',
        condition: (char) => char.attributes.comprehension >= 35,
        upgrades: 'quick_wit'
    },
    {
        id: 'kings_aura',
        name: '王者之气',
        desc: '声望获取+25%，初始声望+5',
        condition: (char) => char.attributes.reputation >= 30,
        upgrades: 'inherited_name'
    },
    {
        id: 'iron_constitution',
        name: '金刚体魄',
        desc: '前世体质达巅峰，最大气血额外+15%',
        condition: (char) => char.attributes.constitution >= 20,
    },
    {
        id: 'wind_step',
        name: '疾风步法',
        desc: '前世身法精熟，战斗逃跑成功率+20%',
        condition: (char) => char.attributes.agility >= 22,
    },
    {
        id: 'time_master',
        name: '时间管理大师',
        desc: '深谙时机，羁绊时刻无需耗费岁月——与知己相逢，不必以月份为代价',
        condition: (char) => {
            const metCount = Object.keys(char.flags || {}).filter(k => k.startsWith('met_')).length;
            return metCount >= 6 || (char.rebirthCount || 0) >= 2;
        },
    },
];

const INHERIT_BASE_RATE = 0.10; // 10% base attribute inheritance

const Rebirth = {
    // Calculate which talents are available this rebirth
    getAvailableTalents(char) {
        const eligible = TALENTS.filter(t => {
            if (!t.condition(char)) return false;
            if (char.legacyTalents.includes(t.id)) return false;
            // Hide base talent if player already has its upgrade
            if (t.upgradedBy) {
                const upgrader = TALENTS.find(u => u.id === t.upgradedBy);
                if (upgrader && char.legacyTalents.includes(upgrader.id)) return false;
            }
            return true;
        });
        // Hide lower-tier talent if higher-tier is also available this rebirth
        return eligible.filter(t => {
            if (!t.upgradedBy) return true;
            // If the upgrade talent is also in the eligible list, hide this one
            return !eligible.some(u => u.id === t.upgradedBy);
        });
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
        } else if (char.legacyTalents.includes('lucky_star')) {
            inherited.luck = (inherited.luck || 0) + 3;
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
        let newTalents = [...char.legacyTalents, ...chosenTalentIds];

        // Handle talent upgrades: if a new talent upgrades an old one, replace it
        for (const id of chosenTalentIds) {
            const talent = TALENTS.find(t => t.id === id);
            if (talent && talent.upgrades && newTalents.includes(talent.upgrades)) {
                newTalents = newTalents.filter(t => t !== talent.upgrades);
            }
        }

        const newChar = Character.create(char.name, inheritedAttrs, newTalents);
        newChar.rebirthCount = char.rebirthCount + 1;

        // Persist critical meta-flags that must survive rebirth
        const PERSIST_FLAGS = [
            'lost_to_final_boss', 'fought_final_boss', 'zhushi_chain_done', 'truth_assembled', 'mark_hermit',
            'mark_warrior_power', 'mark_wuxiang_power',
            'mark_rebirth_power', 'mark_afterstory_power', 'mark_hermit_power',
            'wuxiang_sword_mastered',
            'elder_true_form_seen',  // unlocks NPC elevated path choices in subsequent lives
            'elder_sp5_done',        // 神秘老者·升华线第五章
            // Branch completion flags — passive activates if flag inherited AND bond level met in current life
            'su_qing_mission_path',  // 苏青·济世线 → 天魔HP-20%
            'li_yunshu_family_path', // 李云舒·家族压力线 → 天魔防御-25
            'yan_sp4_done',          // 燕赤行·特殊羁绊第四章
            'yan_sp5_done',          // 燕赤行·特殊羁绊第五章
            'lx_sp4_done',           // 凌雪·特殊羁绊第四章
        ];
        for (const f of PERSIST_FLAGS) {
            if (char.flags[f]) newChar.flags[f] = char.flags[f];
        }
        // Re-grant rebirth_power passive if chain was completed in a previous life
        if (char.flags.zhushi_chain_done) {
            if (!newChar.passives) newChar.passives = [];
            newChar.passives.push({
                id: 'rebirth_power', name: '轮回之力',
                desc: '诸世之我的意志共鸣——以所有的自己，对抗设计者',
                rebirthPower: true
            });
        }
        // Re-grant 无相剑意 passive if mastered in a previous life
        if (char.flags.wuxiang_sword_mastered) {
            if (!newChar.passives) newChar.passives = [];
            newChar.passives.push({
                id: 'wuxiang_intent', name: '无相剑意',
                desc: '走遍江湖、读懂六颗心之后自然涌现——敌方意图在你眼中无所遁形',
                perfectIntentRead: true
            });
        }

        // Carry peak combat stats forward
        newChar.peakCombatStats = { ...(char.peakCombatStats || { atk: 0, def: 0, hp: 0 }) };

        // Gallery unlocks persist across all lives
        newChar.unlockedIllustrations = [...(char.unlockedIllustrations || [])];

        // Lifetime replay: merge current life's progress into the accumulated record
        const mergedBonds = { ...(char.lifetimeBondLevels || {}) };
        for (const [id, lvl] of Object.entries(char.bondLevels || {})) {
            mergedBonds[id] = Math.max(mergedBonds[id] || 0, Number(lvl) || 0);
        }
        newChar.lifetimeBondLevels = mergedBonds;
        // Merge per-life bond variant records into lifetime accumulator
        const mergedVariants = { ...(char.lifetimeBondVariants || {}) };
        for (const [key, variant] of Object.entries(char.bondVariantsDone || {})) {
            mergedVariants[`${key}_${variant}`] = true;
        }
        newChar.lifetimeBondVariants = mergedVariants;
        const mergedChains = [...new Set([
            ...(char.lifetimeChainsDone || []),
            ...Object.entries(char.chainProgress || {}).filter(([, v]) => v === 'done').map(([k]) => k)
        ])];
        newChar.lifetimeChainsDone = mergedChains;

        // Inherit bond levels and variants (世界线记忆)
        newChar.inheritedBonds = Object.assign({}, char.bondLevels);
        newChar.inheritedBondVariants = Object.assign({}, char.bondVariantsDone || {});

        NPCSystem.initRelationships(newChar, allNpcs);

        // Auto-meet all NPCs that had bonds in previous life
        for (const npcId in newChar.inheritedBonds) {
            if (newChar.inheritedBonds[npcId] > 0) {
                newChar.flags['met_' + npcId] = true;
            }
        }

        // NPC affinity is NOT inherited — NPCs don't remember previous lives.
        // The 前世记忆 bond choice gives bonuses instead when replaying bond events.

        // 既视感: boost affinity only — player still plays all chapters so flag
        // choices (e.g. li_yunshu_family_path) can trigger special bond lines
        if (newChar.legacyTalents.includes('worldline_echo')) {
            for (const npcId in newChar.inheritedBonds) {
                if (newChar.inheritedBonds[npcId] > 0) {
                    const targetAffinity = 70; // enough to skip casual-visit grind
                    const current = (newChar.relationships[npcId] || {}).affinity || 0;
                    if (current < targetAffinity) {
                        NPCSystem.applyAffinityChanges(newChar, { [npcId]: targetAffinity - current });
                    }
                }
            }
        }

        return newChar;
    },

    // Get a summary text for the rebirth screen
    getSummaryText(char, jobs, bonds, npcs) {
        const jobData = jobs && jobs.find(j => j.id === char.job);
        const jobName = jobData ? jobData.name : char.job;
        const lines = [
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
                    const total = bonds[npcId] ? Math.max(...bonds[npcId].map(b => b.level)) : '?';
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
