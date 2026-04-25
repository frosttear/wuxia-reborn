#!/usr/bin/env node
// Generates test save codes for various progression stages.
// Run: node scripts/gen_test_saves.js
// Each code can be pasted into the game's 📥 导入 dialog.

const ALL_NPCS = ['wang_tie', 'li_yunshu', 'mysterious_elder', 'yan_chixing', 'ling_xue', 'su_qing'];

// Set met_ AND meet_scene_ flags for each NPC
function metFlags(npcs = ALL_NPCS) {
    const f = {};
    for (const id of npcs) {
        f[`met_${id}`] = true;
        f[`meet_scene_${id}`] = true;
    }
    return f;
}

// bondLevels, relationships, and bondEventsDone for all NPCs at given level
function bondsMax(npcs = ALL_NPCS, level = 5) {
    const bl = {}, rel = {}, bed = {};
    for (const id of npcs) {
        bl[id] = level;
        rel[id] = { affinity: 95 + Math.floor(Math.random() * 5), metAt: 180 };
        for (let l = 1; l <= level; l++) bed[`${id}_${l}`] = true;
    }
    return { bondLevels: bl, relationships: rel, bondEventsDone: bed };
}

// Fields that every save must have (v0.22+)
function baseFields(overrides = {}) {
    return {
        birthMonth: 6,
        alive: true,
        injured: false,
        injuredMonths: 0,
        learnedSkills: [],
        passives: [],
        visitCounts: {},
        eventLog: [],
        bondRetryStep: {},
        peakCombatStats: { atk: 0, def: 0, hp: 0 },
        unlockedIllustrations: [],
        lifetimeBondLevels: {},
        lifetimeChainsDone: [],
        ...overrides,
    };
}

// Match game's btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
// For ASCII JSON (JSON.stringify escapes Unicode to \uXXXX), Buffer utf8 = identity.
function encodeChar(char) {
    const payload = { v: '0.9.7', char };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

const ALL_BOND_IDS = ALL_NPCS.map(id => id.replace(/_/g, '-'));

const saves = [
    // ─────────────────────────────────────────────────────────────────────
    // Save A: 首败沈玄清 · 新轮回起点
    // 第2周目开局，刚失去沈玄清之战，任务面板应显示「诸世之我」Step 1
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'A: 首败沈玄清 · 诸世之我任务解锁',
        note: '第2周目刚开始，「诸世之我」Step 0「轮回回声」应出现在任务面板',
        char: {
            ...baseFields({
                peakCombatStats: { atk: 28, def: 18, hp: 485 },
                lifetimeBondLevels: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
                lifetimeChainsDone: ['wang_revenge', 'hero_path', 'wuxiang_sword'],
                unlockedIllustrations: [
                    ...ALL_BOND_IDS.flatMap(k => [`${k}-meet`,`${k}-bond-1`,`${k}-bond-2`,`${k}-bond-3`,`${k}-bond-4`,`${k}-ending`]),
                    'rebirth', 'wuxiang-unlock', 'portrait-tianmo',
                    'tianmo-and-jianhun', 'portrait-jianhun', 'tianmo-win',
                ],
            }),
            name: '独孤宸', ageMonths: 183,
            job: 'swordsman', unlockedJobs: ['nobody','wanderer','swordsman'],
            rebirthCount: 1, kills: 8,
            attributes: { strength:30, agility:26, constitution:22, innerForce:18, comprehension:20, luck:14, reputation:16 },
            hp: 485,
            legacyTalents: ['sword_heart', 'battle_veteran', 'lucky_star'],
            chainProgress: { zhushi_zhi_wo: 0 },
            flags: {
                ...metFlags(),
                lost_to_final_boss: true,
                boss_triggered: true,
                hidden_boss_triggered: true,
                hidden_boss_beaten: true,
                wuxiang_sword_mastered: true, wuxiang_echo_felt: true,
                wuxiang_six_understood: true, wuxiang_mastered: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
        }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Save B: 印记猎人 · 链进行中（Step 4 轮回之魂）
    // 第3周目17岁，已收集武者+无相印记，zhushi chain at step 4
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'B: 印记猎人 · 任务链 Step 4 轮回之魂',
        note: '第3周目17岁，武者+无相印记已得，「诸世之我」Step 4「轮回之魂」等待触发',
        char: {
            ...baseFields({
                peakCombatStats: { atk: 38, def: 24, hp: 640 },
                lifetimeBondLevels: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
                lifetimeChainsDone: ['wang_revenge', 'hero_path', 'wuxiang_sword', 'li_yunshu_afterstory'],
                unlockedIllustrations: [
                    ...ALL_BOND_IDS.flatMap(k => [`${k}-meet`,`${k}-bond-1`,`${k}-bond-2`,`${k}-bond-3`,`${k}-bond-4`,`${k}-ending`]),
                    'li-yunshu-afterstory', 'rebirth', 'wuxiang-unlock', 'portrait-tianmo',
                    'tianmo-and-jianhun', 'portrait-jianhun', 'tianmo-win',
                ],
                passives: [
                    { id: 'wuxiang_intent', name: '无相剑意', desc: '敌方意图在你眼中无所遁形', perfectIntentRead: true }
                ],
            }),
            name: '独孤宸', ageMonths: 204,
            job: 'hero', unlockedJobs: ['nobody','wanderer','swordsman','hero'],
            rebirthCount: 2, kills: 14,
            attributes: { strength:40, agility:34, constitution:28, innerForce:26, comprehension:28, luck:18, reputation:24 },
            hp: 640,
            legacyTalents: ['sword_heart', 'qi_flow', 'battle_hardened', 'lucky_star', 'destiny_mark'],
            chainProgress: { zhushi_zhi_wo: 4 },
            flags: {
                ...metFlags(),
                lost_to_final_boss: true,
                boss_triggered: true,
                hidden_boss_triggered: true,
                hidden_boss_beaten: true,
                wuxiang_sword_mastered: true, wuxiang_echo_felt: true,
                wuxiang_six_understood: true, wuxiang_mastered: true,
                mark_warrior_power: true,
                mark_wuxiang_power: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
        }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Save C: 万事俱备 · 全印记 · 轮回之力
    // 第4周目，5枚印记全收，任务链已完成，准备最终决战
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'C: 万事俱备 · 全5枚印记 · 挑战沈玄清',
        note: '第4周目18.5岁，轮回之力+全印记，可直接推进到20岁测试最终战斗',
        char: {
            ...baseFields({
                peakCombatStats: { atk: 52, def: 34, hp: 890 },
                lifetimeBondLevels: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
                lifetimeChainsDone: [
                    'wang_revenge', 'hero_path', 'wuxiang_sword',
                    'li_yunshu_afterstory', 'su_qing_afterstory', 'lingxue_afterstory',
                    'elder_afterstory', 'yan_afterstory', 'truth_shards',
                ],
                unlockedIllustrations: [
                    ...ALL_BOND_IDS.flatMap(k => [
                        `${k}-meet`,`${k}-bond-1`,`${k}-bond-2`,`${k}-bond-3`,`${k}-bond-4`,`${k}-ending`,
                        `${k}-afterstory`,`${k}-afterstory-ending`,
                    ]),
                    'rebirth', 'wuxiang-unlock', 'elder-true-form', 'portrait-tianmo',
                    'tianmo-and-jianhun', 'portrait-jianhun', 'tianmo-win', 'tianmo-lose',
                ],
                passives: [
                    { id: 'wuxiang_intent', name: '无相剑意', desc: '敌方意图在你眼中无所遁形', perfectIntentRead: true },
                    { id: 'rebirth_power',  name: '轮回之力', desc: '诸世之我的意志共鸣——以所有的自己，对抗设计者', rebirthPower: true }
                ],
            }),
            name: '独孤宸', ageMonths: 222,
            job: 'sword_saint', unlockedJobs: ['nobody','wanderer','swordsman','hero','sword_saint'],
            rebirthCount: 3, kills: 22,
            attributes: { strength:55, agility:46, constitution:38, innerForce:36, comprehension:38, luck:22, reputation:32 },
            hp: 890,
            legacyTalents: ['sword_heart', 'qi_mastery', 'battle_hardened', 'lucky_star', 'destiny_mark', 'worldline_echo', 'iron_constitution'],
            chainProgress: { zhushi_zhi_wo: 'done' },
            flags: {
                ...metFlags(),
                lost_to_final_boss: true,
                boss_triggered: true,
                hidden_boss_triggered: true,
                hidden_boss_beaten: true,
                elder_true_form_seen: true,
                wuxiang_sword_mastered: true, wuxiang_echo_felt: true,
                wuxiang_six_understood: true, wuxiang_mastered: true,
                li_afterstory_done: true,
                su_afterstory_done: true,
                lx_afterstory_done: true,
                elder_afterstory_done: true,
                yan_afterstory_done: true,
                mark_hermit: true,
                mark_warrior_power: true, mark_hermit_power: true,
                mark_wuxiang_power: true, mark_rebirth_power: true, mark_afterstory_power: true,
                zhushi_chain_done: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
        }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Save D: 无相剑意 · 挑战剑魂
    // 第2周目19岁，全羁绊满级+无相剑意，准备击败剑魂测试
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'D: 无相剑意 · 挑战剑魂',
        note: '第2周目19岁，全羁绊满级+无相剑意，测试剑魂战斗 + 胜/负插画解锁',
        char: {
            ...baseFields({
                peakCombatStats: { atk: 42, def: 26, hp: 680 },
                lifetimeBondLevels: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
                lifetimeChainsDone: ['wang_revenge', 'hero_path', 'wuxiang_sword'],
                unlockedIllustrations: [
                    ...ALL_BOND_IDS.flatMap(k => [`${k}-meet`,`${k}-bond-1`,`${k}-bond-2`,`${k}-bond-3`,`${k}-bond-4`,`${k}-ending`]),
                    'rebirth', 'wuxiang-unlock', 'portrait-tianmo',
                ],
                passives: [
                    { id: 'wuxiang_intent', name: '无相剑意', desc: '敌方意图在你眼中无所遁形', perfectIntentRead: true }
                ],
            }),
            name: '独孤宸', ageMonths: 228,
            job: 'hero', unlockedJobs: ['nobody','wanderer','swordsman','hero'],
            rebirthCount: 1, kills: 12,
            attributes: { strength:44, agility:36, constitution:30, innerForce:28, comprehension:30, luck:18, reputation:26 },
            hp: 680,
            legacyTalents: ['sword_heart', 'qi_flow', 'battle_veteran', 'lucky_star'],
            chainProgress: { wuxiang_sword: 'done' },
            flags: {
                ...metFlags(),
                boss_triggered: true,
                jade_tablet_awakened: true,
                wuxiang_sword_mastered: true, wuxiang_echo_felt: true,
                wuxiang_six_understood: true, wuxiang_mastered: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
        }
    },
];

console.log('=== 轮回江湖 · 测试存档生成器 ===\n');
for (const { label, note, char } of saves) {
    console.log(`【${label}】`);
    console.log(`  说明：${note}`);
    console.log(`  存档码：`);
    console.log(`  ${encodeChar(char)}`);
    console.log();
}
