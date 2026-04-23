#!/usr/bin/env node
// Generates test save codes for various progression stages.
// Run: node scripts/gen_test_saves.js
// Each code can be pasted into the game's 📥 导入 dialog.

const ALL_NPCS = ['wang_tie','li_yunshu','mysterious_elder','yan_chixing','ling_xue','su_qing'];

function metFlags(npcs = ALL_NPCS) {
    const f = {};
    for (const id of npcs) f[`met_${id}`] = true;
    return f;
}

function bondsMax(npcs = ALL_NPCS, level = 5) {
    const bl = {}, rel = {};
    for (const id of npcs) {
        bl[id] = level;
        rel[id] = { affinity: 95 + Math.floor(Math.random() * 5), metAt: 180 };
    }
    return { bondLevels: bl, relationships: rel };
}

function encodeChar(char) {
    const payload = { v: '0.9.7', char };
    return Buffer.from(encodeURIComponent(JSON.stringify(payload))).toString('base64');
}

const saves = [
    // ─────────────────────────────────────────────────────────────────────
    // Save A: 首败沈玄清 · 新轮回起点
    // 第2周目开局，刚失去沈玄清之战，任务面板应显示「诸世之我」Step 1
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'A: 首败沈玄清 · 诸世之我任务解锁',
        note: '第2周目刚开始，「诸世之我」Step 1「轮回回声」应出现在任务面板',
        char: {
            name: '独孤宸', ageMonths: 183, birthMonth: 6, alive: true,
            job: 'swordsman', unlockedJobs: ['nobody','wanderer','swordsman'],
            rebirthCount: 1, kills: 8,
            attributes: { strength: 30, agility: 26, constitution: 22, innerForce: 18, comprehension: 20, luck: 14, reputation: 16 },
            hp: 485, legacyTalents: ['sword_heart', 'battle_veteran', 'lucky_star'],
            learnedSkills: [],
            passives: [],
            chainProgress: {},
            flags: {
                ...metFlags(),
                lost_to_final_boss: true,
                boss_triggered: true, hidden_boss_beaten: true,
                elder_true_form_ready: true, elder_true_form_triggered: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
            bondEventsDone: {}, visitCounts: {}, eventLog: [],
        }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Save B: 印记猎人 · 链进行中（Step 4 轮回之魂）
    // 已收集武者印记 + 无相印记，正在进行轮回之魂步骤
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'B: 印记猎人 · 任务链 Step 4 轮回之魂',
        note: '第3周目17岁，已有武者+无相印记，Step 4「轮回之魂」等待触发（需rebirthCount≥3，此存档可测试跳过分支）',
        char: {
            name: '独孤宸', ageMonths: 204, birthMonth: 6, alive: true,
            job: 'hero', unlockedJobs: ['nobody','wanderer','swordsman','hero'],
            rebirthCount: 2, kills: 14,
            attributes: { strength: 40, agility: 34, constitution: 28, innerForce: 26, comprehension: 28, luck: 18, reputation: 24 },
            hp: 640,
            legacyTalents: ['sword_heart', 'qi_flow', 'battle_veteran_2', 'lucky_star', 'destiny_mark'],
            learnedSkills: [],
            passives: [
                { id: 'wuxiang_intent', name: '无相剑意', desc: '敌方意图在你眼中无所遁形', perfectIntentRead: true }
            ],
            chainProgress: { zhushi_zhi_wo: 4 },  // step index 4 = 轮回之魂 (0-indexed)
            flags: {
                ...metFlags(),
                lost_to_final_boss: true,
                boss_triggered: true, hidden_boss_beaten: true,
                elder_true_form_ready: true, elder_true_form_triggered: true,
                wuxiang_sword_mastered: true, wuxiang_six_understood: true, wuxiang_echo_felt: true, wuxiang_mastered: true,
                mark_warrior_power: true,
                mark_wuxiang_power: true,
                zhushi_echo_felt: true, zhushi_2_done: true, zhushi_3_done: true, zhushi_4_done: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
            bondEventsDone: {}, visitCounts: {}, eventLog: [],
        }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Save C: 万事俱备 · 全印记 · 轮回之力
    // 第4周目，5枚印记全收，任务链已完成，准备最终决战
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'C: 万事俱备 · 全5枚印记 · 挑战沈玄清',
        note: '第4周目18.5岁，轮回之力+全印记(攻+125/防+100/血+1500)，可直接推进到20岁测试最终战斗',
        char: {
            name: '独孤宸', ageMonths: 222, birthMonth: 6, alive: true,
            job: 'sword_saint', unlockedJobs: ['nobody','wanderer','swordsman','hero','sword_saint'],
            rebirthCount: 3, kills: 22,
            attributes: { strength: 55, agility: 46, constitution: 38, innerForce: 36, comprehension: 38, luck: 22, reputation: 32 },
            hp: 890,
            legacyTalents: ['sword_heart', 'qi_mastery', 'battle_veteran_2', 'lucky_star', 'destiny_mark', 'worldline_echo', 'iron_constitution'],
            learnedSkills: [],
            passives: [
                { id: 'wuxiang_intent', name: '无相剑意', desc: '敌方意图在你眼中无所遁形', perfectIntentRead: true },
                { id: 'rebirth_power', name: '轮回之力', desc: '诸世之我的意志共鸣——以所有的自己，对抗设计者', rebirthPower: true }
            ],
            chainProgress: { zhushi_zhi_wo: 'done' },
            flags: {
                ...metFlags(),
                lost_to_final_boss: true,
                boss_triggered: true, hidden_boss_beaten: true,
                elder_true_form_ready: true, elder_true_form_triggered: true,
                wuxiang_sword_mastered: true, wuxiang_six_understood: true, wuxiang_echo_felt: true, wuxiang_mastered: true,
                li_afterstory_done: true, li_old_case_found: true, li_mother_avenged: true,
                mark_hermit: true,
                mark_warrior_power: true, mark_hermit_power: true,
                mark_wuxiang_power: true, mark_rebirth_power: true, mark_afterstory_power: true,
                zhushi_echo_felt: true, zhushi_2_done: true, zhushi_3_done: true,
                zhushi_4_done: true, zhushi_5_done: true, zhushi_6_done: true, zhushi_chain_done: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
            bondEventsDone: {}, visitCounts: {}, eventLog: [],
        }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Save D: 无相剑意 · 挑战剑魂
    // 第2周目19岁，全羁绊满级+无相剑意，准备击败剑魂测试
    // ─────────────────────────────────────────────────────────────────────
    {
        label: 'D: 无相剑意 · 挑战剑魂',
        note: '第2周目19岁，全羁绊满级+无相剑意+羁绊加成，测试剑魂战斗体验',
        char: {
            name: '独孤宸', ageMonths: 228, birthMonth: 6, alive: true,
            job: 'hero', unlockedJobs: ['nobody','wanderer','swordsman','hero'],
            rebirthCount: 1, kills: 12,
            attributes: { strength: 44, agility: 36, constitution: 30, innerForce: 28, comprehension: 30, luck: 18, reputation: 26 },
            hp: 680,
            legacyTalents: ['sword_heart', 'qi_flow', 'battle_veteran', 'lucky_star'],
            learnedSkills: [],
            passives: [
                { id: 'wuxiang_intent', name: '无相剑意', desc: '敌方意图在你眼中无所遁形', perfectIntentRead: true }
            ],
            chainProgress: { wuxiang_sword: 'done' },
            flags: {
                ...metFlags(),
                boss_triggered: true,
                wuxiang_sword_mastered: true, wuxiang_six_understood: true, wuxiang_echo_felt: true, wuxiang_mastered: true,
                jade_tablet_awakened: true,
            },
            ...bondsMax(),
            inheritedBonds: { wang_tie:5, li_yunshu:5, mysterious_elder:5, yan_chixing:5, ling_xue:5, su_qing:5 },
            bondEventsDone: {}, visitCounts: {}, eventLog: [],
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
