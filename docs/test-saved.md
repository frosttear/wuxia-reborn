# 测试存档 (Test Saves)

Paste into browser DevTools console to load any save, then refresh:

```js
localStorage.setItem('wuxia_save', JSON.stringify(SAVE_OBJECT_BELOW));
localStorage.removeItem('wuxia_log');
localStorage.removeItem('wuxia_phase');
localStorage.removeItem('wuxia_combat');
location.reload();
```

---

## 1. 新游 — 15岁刚开始 (Fresh start)

Tests: character creation, tutorial flow, NPC discovery.

```json
{
  "name": "测试",
  "ageMonths": 180,
  "birthMonth": 3,
  "alive": true,
  "attributes": {
    "strength": 7, "agility": 7, "constitution": 5,
    "innerForce": 3, "comprehension": 5, "luck": 5, "reputation": 0
  },
  "hp": 100,
  "job": "nobody",
  "unlockedJobs": ["nobody"],
  "learnedSkills": [],
  "legacyTalents": [],
  "relationships": {},
  "bondLevels": {},
  "bondEventsDone": {},
  "inheritedBonds": {},
  "flags": {},
  "kills": 0,
  "rebirthCount": 0,
  "injured": false,
  "injuredMonths": 0,
  "eventLog": [],
  "passives": [],
  "visitCounts": {},
  "chainProgress": {},
  "peakCombatStats": { "atk": 0, "def": 0, "hp": 0 },
  "lifetimeBondLevels": {},
  "lifetimeChainsDone": [],
  "unlockedIllustrations": []
}
```

---

## 2. 中期存档 — 17岁游侠 (Mid-game swordsman)

Tests: job upgrade UI, NPC affinity display, bond-1 availability, casual visit limiter.

```json
{
  "name": "测试",
  "ageMonths": 210,
  "birthMonth": 6,
  "alive": true,
  "attributes": {
    "strength": 14, "agility": 13, "constitution": 12,
    "innerForce": 10, "comprehension": 11, "luck": 8, "reputation": 6
  },
  "hp": 240,
  "job": "wanderer",
  "unlockedJobs": ["nobody", "wanderer"],
  "learnedSkills": [
    { "id": "iron_fist", "name": "铁拳", "desc": "攻击+2", "branch": "strength", "bonuses": { "attack": 2 } }
  ],
  "legacyTalents": [],
  "relationships": {
    "wang_tie":   { "affinity": 45, "metAt": 181 },
    "li_yunshu":  { "affinity": 30, "metAt": 185 }
  },
  "bondLevels": {
    "wang_tie":  1,
    "li_yunshu": 0
  },
  "bondEventsDone": { "wang_tie_1": true },
  "inheritedBonds": {},
  "flags": {
    "met_wang_tie": true,
    "meet_scene_wang_tie": true,
    "met_li_yunshu": true,
    "meet_scene_li_yunshu": true,
    "jianghu_chaos_started": true
  },
  "kills": 3,
  "rebirthCount": 0,
  "injured": false,
  "injuredMonths": 0,
  "eventLog": [],
  "passives": [],
  "visitCounts": {},
  "chainProgress": { "jianghu_chaos": 1 },
  "peakCombatStats": { "atk": 12, "def": 8, "hp": 240 },
  "lifetimeBondLevels": {},
  "lifetimeChainsDone": [],
  "unlockedIllustrations": ["wang-tie-meet", "wang-tie-bond-1", "li-yunshu-meet"]
}
```

---

## 3. 天魔前夕 — 19岁剑侠，所有羁绊 (Pre-boss, all bonds)

Tests: 天魔触发 at age-20, 剧情回想 replay list (all 5 NPCs × levels), afterstory chains, 传说瞬间 tab, rebirth screen talent selection.

```json
{
  "name": "测试",
  "ageMonths": 234,
  "birthMonth": 6,
  "alive": true,
  "attributes": {
    "strength": 28, "agility": 22, "constitution": 20,
    "innerForce": 22, "comprehension": 24, "luck": 18, "reputation": 28
  },
  "hp": 400,
  "job": "hero",
  "unlockedJobs": ["nobody", "wanderer", "swordsman", "hero"],
  "learnedSkills": [
    { "id": "iron_fist",  "name": "铁拳",   "desc": "攻击+2", "branch": "strength",  "bonuses": { "attack": 2 } },
    { "id": "iron_guard", "name": "铁甲功",  "desc": "防御+2", "branch": "constitution", "bonuses": { "defense": 2 } },
    { "id": "swift_step", "name": "轻功步法", "desc": "敏捷+1", "branch": "agility",    "bonuses": { "attack": 1 } }
  ],
  "legacyTalents": [],
  "relationships": {
    "wang_tie":        { "affinity": 95, "metAt": 181 },
    "li_yunshu":       { "affinity": 90, "metAt": 182 },
    "mysterious_elder":{ "affinity": 85, "metAt": 190 },
    "yan_chixing":     { "affinity": 88, "metAt": 188 },
    "su_qing":         { "affinity": 80, "metAt": 192 },
    "ling_xue":        { "affinity": 75, "metAt": 200 }
  },
  "bondLevels": {
    "wang_tie": 5,
    "li_yunshu": 5,
    "mysterious_elder": 4,
    "yan_chixing": 4,
    "su_qing": 3,
    "ling_xue": 2
  },
  "bondEventsDone": {
    "wang_tie_1": true, "wang_tie_2": true, "wang_tie_3": true, "wang_tie_4": true, "wang_tie_5": true,
    "li_yunshu_1": true, "li_yunshu_2": true, "li_yunshu_3": true, "li_yunshu_4": true, "li_yunshu_5": true,
    "mysterious_elder_1": true, "mysterious_elder_2": true, "mysterious_elder_3": true, "mysterious_elder_4": true,
    "yan_chixing_1": true, "yan_chixing_2": true, "yan_chixing_3": true, "yan_chixing_4": true,
    "su_qing_1": true, "su_qing_2": true, "su_qing_3": true,
    "ling_xue_1": true, "ling_xue_2": true
  },
  "inheritedBonds": {},
  "flags": {
    "met_wang_tie": true,        "meet_scene_wang_tie": true,
    "met_li_yunshu": true,       "meet_scene_li_yunshu": true,
    "met_mysterious_elder": true,"meet_scene_mysterious_elder": true,
    "met_yan_chixing": true,     "meet_scene_yan_chixing": true,
    "met_su_qing": true,         "meet_scene_su_qing": true,
    "met_ling_xue": true,        "meet_scene_ling_xue": true,
    "elder_revelation": true,
    "jade_tablet_awakened": true
  },
  "kills": 12,
  "rebirthCount": 0,
  "injured": false,
  "injuredMonths": 0,
  "eventLog": [],
  "passives": [],
  "visitCounts": {},
  "chainProgress": {
    "wang_revenge": "done",
    "hero_path": "done",
    "tianmo_harbinger": 2
  },
  "peakCombatStats": { "atk": 28, "def": 18, "hp": 400 },
  "lifetimeBondLevels": {},
  "lifetimeChainsDone": [],
  "unlockedIllustrations": [
    "wang-tie-meet", "wang-tie-bond-1", "wang-tie-bond-2", "wang-tie-bond-3", "wang-tie-bond-4", "wang-tie-ending",
    "wang-tie-afterstory", "wang-tie-afterstory-ending",
    "li-yunshu-meet", "li-yunshu-bond-1", "li-yunshu-bond-2", "li-yunshu-bond-3", "li-yunshu-bond-4", "li-yunshu-ending",
    "yan-chixing-meet", "yan-chixing-bond-1", "yan-chixing-bond-2", "yan-chixing-bond-3", "yan-chixing-bond-4",
    "su-qing-meet", "su-qing-bond-1", "su-qing-bond-2", "su-qing-bond-3",
    "ling-xue-meet", "ling-xue-bond-1", "ling-xue-bond-2",
    "mysterious-elder-meet", "mysterious-elder-bond-1", "mysterious-elder-bond-2", "mysterious-elder-bond-3", "mysterious-elder-bond-4",
    "rebirth"
  ]
}
```

---

## 4. 二周目 — 轮回后，带天赋 (Second life with legacy talents)

Tests: `legacyTalents` applied, `inheritedBonds` triggering meet events on first visit, `lifetimeBondLevels` showing in 剧情回想, 世界线记忆 prefix on bond events, `worldline_echo` talent skipping to bond-3.

```json
{
  "name": "测试",
  "ageMonths": 180,
  "birthMonth": 6,
  "alive": true,
  "attributes": {
    "strength": 7, "agility": 7, "constitution": 7,
    "innerForce": 5, "comprehension": 6, "luck": 8, "reputation": 2
  },
  "hp": 140,
  "job": "nobody",
  "unlockedJobs": ["nobody"],
  "learnedSkills": [],
  "legacyTalents": ["lucky_star", "battle_novice", "deep_bonds", "inherited_name", "worldline_echo"],
  "relationships": {},
  "bondLevels": {},
  "bondEventsDone": {},
  "inheritedBonds": {
    "wang_tie": 5,
    "li_yunshu": 4,
    "mysterious_elder": 3,
    "yan_chixing": 2
  },
  "flags": {
    "met_wang_tie": true,
    "met_li_yunshu": true,
    "met_mysterious_elder": true,
    "met_yan_chixing": true
  },
  "kills": 0,
  "rebirthCount": 1,
  "injured": false,
  "injuredMonths": 0,
  "eventLog": [],
  "passives": [],
  "visitCounts": {},
  "chainProgress": {},
  "peakCombatStats": { "atk": 20, "def": 12, "hp": 300 },
  "lifetimeBondLevels": {
    "wang_tie": 5,
    "li_yunshu": 4,
    "mysterious_elder": 3,
    "yan_chixing": 2
  },
  "lifetimeChainsDone": ["wang_revenge", "hero_path"],
  "unlockedIllustrations": [
    "wang-tie-meet", "wang-tie-bond-1", "wang-tie-bond-2", "wang-tie-bond-3", "wang-tie-bond-4", "wang-tie-ending",
    "wang-tie-afterstory", "wang-tie-afterstory-ending",
    "li-yunshu-meet", "li-yunshu-bond-1", "li-yunshu-bond-2", "li-yunshu-bond-3", "li-yunshu-bond-4",
    "yan-chixing-meet", "yan-chixing-bond-1", "yan-chixing-bond-2",
    "mysterious-elder-meet", "mysterious-elder-bond-1", "mysterious-elder-bond-2", "mysterious-elder-bond-3",
    "rebirth"
  ]
}
```

---

## 5. 图鉴全开 — 所有插画 (Full gallery unlock)

Tests: all gallery tabs, lightbox carousel, 剧情回想 for all NPCs and chains, portrait display.

```json
{
  "name": "测试",
  "ageMonths": 240,
  "birthMonth": 1,
  "alive": true,
  "attributes": {
    "strength": 38, "agility": 28, "constitution": 32,
    "innerForce": 30, "comprehension": 30, "luck": 22, "reputation": 35
  },
  "hp": 640,
  "job": "sword_saint",
  "unlockedJobs": ["nobody", "wanderer", "swordsman", "hero", "sword_saint"],
  "learnedSkills": [],
  "legacyTalents": ["sword_heart", "spiritual_root", "battle_veteran", "fortune_child", "kings_aura"],
  "relationships": {
    "wang_tie":        { "affinity": 100, "metAt": 181 },
    "li_yunshu":       { "affinity": 100, "metAt": 181 },
    "mysterious_elder":{ "affinity": 100, "metAt": 181 },
    "yan_chixing":     { "affinity": 100, "metAt": 181 },
    "su_qing":         { "affinity": 100, "metAt": 181 },
    "ling_xue":        { "affinity": 100, "metAt": 181 }
  },
  "bondLevels": {
    "wang_tie": 5, "li_yunshu": 5, "mysterious_elder": 5,
    "yan_chixing": 5, "su_qing": 5, "ling_xue": 5
  },
  "bondEventsDone": {
    "wang_tie_1": true, "wang_tie_2": true, "wang_tie_3": true, "wang_tie_4": true, "wang_tie_5": true,
    "li_yunshu_1": true, "li_yunshu_2": true, "li_yunshu_3": true, "li_yunshu_4": true, "li_yunshu_5": true,
    "mysterious_elder_1": true, "mysterious_elder_2": true, "mysterious_elder_3": true, "mysterious_elder_4": true, "mysterious_elder_5": true,
    "yan_chixing_1": true, "yan_chixing_2": true, "yan_chixing_3": true, "yan_chixing_4": true, "yan_chixing_5": true,
    "su_qing_1": true, "su_qing_2": true, "su_qing_3": true, "su_qing_4": true, "su_qing_5": true,
    "ling_xue_1": true, "ling_xue_2": true, "ling_xue_3": true, "ling_xue_4": true, "ling_xue_5": true
  },
  "inheritedBonds": {},
  "flags": {
    "met_wang_tie": true,        "meet_scene_wang_tie": true,
    "met_li_yunshu": true,       "meet_scene_li_yunshu": true,
    "met_mysterious_elder": true,"meet_scene_mysterious_elder": true,
    "met_yan_chixing": true,     "meet_scene_yan_chixing": true,
    "met_su_qing": true,         "meet_scene_su_qing": true,
    "met_ling_xue": true,        "meet_scene_ling_xue": true,
    "boss_triggered": true,
    "hidden_boss_triggered": true,
    "boss_lost": true,
    "elder_true_form_seen": true,
    "zhushi_chain_done": true,
    "elder_revelation": true,
    "jade_tablet_awakened": true,
    "li_afterstory_done": true,
    "su_afterstory_done": true,
    "lx_afterstory_done": true,
    "elder_afterstory_done": true,
    "yan_afterstory_done": true
  },
  "kills": 18,
  "rebirthCount": 2,
  "injured": false,
  "injuredMonths": 0,
  "eventLog": [],
  "passives": [],
  "visitCounts": {},
  "chainProgress": {
    "wang_revenge": "done",
    "hero_path": "done",
    "sword_path": "done",
    "wuxiang_sword": "done",
    "li_yunshu_afterstory": "done",
    "su_qing_afterstory": "done",
    "lingxue_afterstory": "done",
    "elder_afterstory": "done",
    "yan_afterstory": "done",
    "truth_shards": "done",
    "zhushi_zhi_wo": "done"
  },
  "peakCombatStats": { "atk": 38, "def": 24, "hp": 640 },
  "lifetimeBondLevels": {
    "wang_tie": 5, "li_yunshu": 5, "mysterious_elder": 5,
    "yan_chixing": 5, "su_qing": 5, "ling_xue": 5
  },
  "lifetimeChainsDone": [
    "wang_revenge", "hero_path", "sword_path", "wuxiang_sword",
    "li_yunshu_afterstory", "su_qing_afterstory", "lingxue_afterstory",
    "elder_afterstory", "yan_afterstory", "truth_shards", "zhushi_zhi_wo"
  ],
  "unlockedIllustrations": [
    "wang-tie-meet", "wang-tie-bond-1", "wang-tie-bond-2", "wang-tie-bond-3", "wang-tie-bond-4", "wang-tie-ending",
    "wang-tie-afterstory", "wang-tie-afterstory-ending",
    "li-yunshu-meet", "li-yunshu-bond-1", "li-yunshu-bond-2", "li-yunshu-bond-3", "li-yunshu-bond-4", "li-yunshu-ending",
    "li-yunshu-afterstory", "li-yunshu-afterstory-ending",
    "yan-chixing-meet", "yan-chixing-bond-1", "yan-chixing-bond-2", "yan-chixing-bond-3", "yan-chixing-bond-4", "yan-chixing-ending",
    "yan-chixing-afterstory", "yan-chixing-afterstory-ending",
    "su-qing-meet", "su-qing-bond-1", "su-qing-bond-2", "su-qing-bond-3", "su-qing-bond-4", "su-qing-ending",
    "su-qing-afterstory", "su-qing-afterstory-ending",
    "ling-xue-meet", "ling-xue-bond-1", "ling-xue-bond-2", "ling-xue-bond-3", "ling-xue-bond-4", "ling-xue-ending",
    "ling-xue-afterstory", "ling-xue-afterstory-ending",
    "mysterious-elder-meet", "mysterious-elder-bond-1", "mysterious-elder-bond-2", "mysterious-elder-bond-3", "mysterious-elder-bond-4", "mysterious-elder-ending",
    "mysterious-elder-afterstory", "mysterious-elder-afterstory-ending",
    "rebirth", "wuxiang-unlock", "elder-true-form",
    "tianmo-and-jianhun", "tianmo-win", "tianmo-lose",
    "sword-soul-win", "sword-soul-lose",
    "portrait-tianmo", "portrait-jianhun"
  ]
}
```

---

## 字段速查 (Field reference)

| Field | Type | Notes |
|---|---|---|
| `ageMonths` | int | 180 = 15岁; 天魔在 240 (20岁) 触发 |
| `birthMonth` | 1–12 | 影响月份属性奖励 |
| `job` | string | `nobody` `wanderer` `swordsman` `hero` `sword_saint` |
| `legacyTalents` | string[] | 前世天赋, 见 rebirth.js TALENTS |
| `bondLevels` | `{npcId: N}` | 当世羁绊进度 (0–5) |
| `lifetimeBondLevels` | `{npcId: N}` | 历代最高, 影响剧情回想列表 |
| `lifetimeChainsDone` | string[] | 历代已完成支线, 影响剧情回想列表 |
| `inheritedBonds` | `{npcId: N}` | 前世羁绊等级, 触发本世首次见面叙事 |
| `chainProgress` | `{chainId: N\|"done"}` | 当世任务链进度 |
| `flags.meet_scene_<npcId>` | bool | 本世是否已播放见面叙事 |
| `flags.boss_triggered` | bool | 天魔第一次出现 → 解锁天魔立绘 |
| `flags.hidden_boss_triggered` | bool | 剑魂触发 → 解锁剑魂立绘 + 天魔与剑魂 |
| `flags.boss_lost` | bool | 败于天魔 → 解锁魔焰吞噬 |
| `flags.jade_tablet_awakened` | bool | 必须为 true 才能触发20岁天魔剧情 |
| `rebirthCount` | int | 0 = 第一世; 影响宿命之力天赋 |
| `unlockedIllustrations` | string[] | 图鉴已解锁列表 |
