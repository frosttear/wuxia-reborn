"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startOverlay = document.getElementById("startOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const resultOverlay = document.getElementById("resultOverlay");
const stageOverlay = document.getElementById("stageOverlay");
const choiceOverlay = document.getElementById("choiceOverlay");
const choiceList = document.getElementById("choiceList");
const refreshChoicesButton = document.getElementById("refreshChoicesButton");
const pauseButton = document.getElementById("pauseButton");
const soundButton = document.getElementById("soundButton");
const announcer = document.getElementById("announcer");
const nextStageButton = document.getElementById("nextStageButton");
const continueStageButton = document.getElementById("continueStageButton");
const continueGameButton = document.getElementById("continueGameButton");

const W = 430;
const H = 820;
const SCALE = 2;
const PLAY_TOP = 76;
const SHOP_TOP = 672;
const BELT = { x: 12, y: PLAY_TOP, w: 148, h: SHOP_TOP - PLAY_TOP };
const ROAD = { x: 176, y: PLAY_TOP, w: 240, h: SHOP_TOP - PLAY_TOP };
const DEPOT = { x: BELT.x + BELT.w / 2, y: 610 };
const PICKUP_X = BELT.x + BELT.w - 2;
const GUN_SLOTS = [
  { x: 220, y: 490 },
  { x: 295, y: 490 },
  { x: 370, y: 490 }
];
const CANNON_SLOTS = [
  { x: 220, y: 575 },
  { x: 295, y: 575 },
  { x: 370, y: 575 }
];
const GUN = GUN_SLOTS[0];
const CANNON = CANNON_SLOTS[0];
const GATE_Y = 452;
const ROAD_HORIZON_Y = 116;
const ENEMY_SPAWN_Y = 138;
const GUNNER_MAG_CAPACITY = 5;
const CANNON_MAG_CAPACITY = 2;
const WALL_MAX_HP = 5;
const DEFENSE_MAX_HP = 5;
const HOME_MAX_HP = 5;
const HOME_ATTACK_Y = 625;
const DEFENSE_REPAIR_DURATION = 5;
const BELT_REPAIR_BASE_DURATION = 3;
const BELT_REPAIR_POINT = { x: PICKUP_X - 18, y: 570 };
const ENEMY_BELT_JAM_COOLDOWN = 22;
const BASE_COIN_INTERVAL = 5;
const MAX_BASE_INCOME_LEVEL = 5;
const BASE_MAX_PROD = 20;
const BASE_MAX_GUN = 20;
const BASE_MAX_CAN = 20;
function maxProductionLevel() { return state.endless ? Infinity : BASE_MAX_PROD; }
function maxGunnerLevel() { return state.endless ? Infinity : BASE_MAX_GUN; }
function maxCannonLevel() { return state.endless ? Infinity : BASE_MAX_CAN; }
const MAX_DAMAGE_BONUS = 1.2;
const TOTAL_STAGES = 10;
const WAVES_PER_STAGE = 10;
const TOTAL_WAVES = TOTAL_STAGES * WAVES_PER_STAGE;
const ENDLESS_UNLOCK_KEY = "ammo-defense-endless-unlocked";
let currentSlot = 1;

function slotKey(base) { return `ammo-defense-slot-${currentSlot}-${base}`; }
function STAGE_PROGRESS_KEY() { return slotKey("stage"); }
function PRESTIGE_KEY() { return slotKey("prestige"); }
function TECH_KEY() { return slotKey("tech"); }
function BEST_WAVE_KEY() { return slotKey("best"); }

(function migrateLegacySave() {
  const old = localStorage.getItem("ammo-defense-stage-progress");
  if (old && !localStorage.getItem("ammo-defense-slot-1-stage")) {
    localStorage.setItem("ammo-defense-slot-1-stage", old);
    const p = localStorage.getItem("ammo-defense-prestige");
    if (p) localStorage.setItem("ammo-defense-slot-1-prestige", p);
    const t = localStorage.getItem("ammo-defense-tech");
    if (t) localStorage.setItem("ammo-defense-slot-1-tech", t);
    const b = localStorage.getItem("mining-defense-best");
    if (b) localStorage.setItem("ammo-defense-slot-1-best", b);
    if (Number(old) >= TOTAL_STAGES) localStorage.setItem(ENDLESS_UNLOCK_KEY, "1");
    localStorage.removeItem("ammo-defense-stage-progress");
    localStorage.removeItem("ammo-defense-prestige");
    localStorage.removeItem("ammo-defense-tech");
  }
})();

function loadPrestige() {
  return Number(localStorage.getItem(PRESTIGE_KEY()) || 0);
}
function savePrestige(p) {
  localStorage.setItem(PRESTIGE_KEY(), String(p));
}
function loadTech() {
  try { return JSON.parse(localStorage.getItem(TECH_KEY())) || {}; } catch { return {}; }
}
function saveTech(t) {
  localStorage.setItem(TECH_KEY(), JSON.stringify(t));
}
function isEndlessUnlocked() {
  return readSavedStage() >= TOTAL_STAGES;
}
function unlockEndless() {
}
function getSlotSummary(slot) {
  const stage = Number(localStorage.getItem(`ammo-defense-slot-${slot}-stage`) || 0);
  const prestige = Number(localStorage.getItem(`ammo-defense-slot-${slot}-prestige`) || 0);
  return { stage, prestige, empty: stage <= 0 };
}
function switchSlot(slot) {
  currentSlot = slot;
  state.prestige = loadPrestige();
  state.tech = loadTech();
  state.savedStage = readSavedStage();
  state.bestWave = Number(localStorage.getItem(BEST_WAVE_KEY()) || 0);
}
function exportSaveData() {
  const data = {};
  for (let s = 1; s <= 3; s++) {
    data[`slot${s}`] = {
      stage: localStorage.getItem(`ammo-defense-slot-${s}-stage`),
      prestige: localStorage.getItem(`ammo-defense-slot-${s}-prestige`),
      tech: localStorage.getItem(`ammo-defense-slot-${s}-tech`),
      best: localStorage.getItem(`ammo-defense-slot-${s}-best`)
    };
  }
  data.endlessUnlocked = localStorage.getItem(ENDLESS_UNLOCK_KEY);
  return JSON.stringify(data);
}
function importSaveData(json) {
  try {
    const data = JSON.parse(json);
    for (let s = 1; s <= 3; s++) {
      const slot = data[`slot${s}`];
      if (!slot) continue;
      for (const [k, v] of Object.entries(slot)) {
        const key = `ammo-defense-slot-${s}-${k}`;
        if (v != null) localStorage.setItem(key, v);
        else localStorage.removeItem(key);
      }
    }
    if (data.endlessUnlocked) localStorage.setItem(ENDLESS_UNLOCK_KEY, data.endlessUnlocked);
    switchSlot(currentSlot);
    updateContinueGameButton();
    return true;
  } catch { return false; }
}

const techDefs = [
  { id: "startCoins",   label: "战备物资",   desc: "初始金币+200",        max: 3, cost: [1, 2, 3], effect: lv => ({ coins: lv * 200 }) },
  { id: "startWorkers", label: "老兵征召",   desc: "初始搬运工+1",       max: 3, cost: [1, 3, 5], effect: lv => ({ workers: lv }) },
  { id: "startProd",    label: "工业底蕴",   desc: "初始产线等级+2",     max: 3, cost: [1, 3, 5], effect: lv => ({ productionLevel: lv * 2 }) },
  { id: "permCrit",     label: "射击训练",   desc: "全局暴击率+5%",      max: 3, cost: [2, 3, 5], effect: lv => ({ critChance: lv * 0.05 }) },
  { id: "permDamage",   label: "火力研发",   desc: "全局伤害+12%",       max: 3, cost: [2, 4, 6], effect: lv => ({ damageBonus: lv * 0.12 }) },
  { id: "permLives",    label: "加固工事",   desc: "基地生命上限+1",     max: 3, cost: [2, 4, 6], effect: lv => ({ lives: lv }) },
  { id: "baseIncome",   label: "经济基建",   desc: "基地收入+6/5s",      max: 3, cost: [1, 2, 4], effect: lv => ({ baseIncome: lv }) },
  { id: "blastRadius",  label: "爆破专家",   desc: "炮弹爆炸范围+10%",   max: 3, cost: [2, 4, 6], effect: lv => ({ blastRadius: lv * 0.10 }) }
];

const legacyDefs = [
  {
    id: "weaponLevels",
    icon: "🔥",
    title: "火力传承",
    desc: () => "保留武器等级的一半（枪手LV." + Math.floor(state.gunnerLevel / 2) + " 炮台LV." + Math.floor(state.cannonLevel / 2) + "）",
    eligible: () => state.gunnerLevel > 1 || state.cannonLevel > 1,
    snapshot: () => ({ gunnerLevel: Math.floor(state.gunnerLevel / 2), cannonLevel: Math.floor(state.cannonLevel / 2) }),
    apply: s => { state.gunnerLevel = Math.max(state.gunnerLevel, s.gunnerLevel); state.cannonLevel = Math.max(state.cannonLevel, s.cannonLevel); }
  },
  {
    id: "coinReserve",
    icon: "💰",
    title: "物资储备",
    desc: () => "继承当前金币的50%（+" + Math.round(state.coins * 0.5) + "金）",
    eligible: () => state.coins >= 100,
    snapshot: () => ({ coins: Math.round(state.coins * 0.5) }),
    apply: s => { state.coins += s.coins; }
  },
  {
    id: "veteranCrew",
    icon: "👷",
    title: "老兵部队",
    desc: () => "保留搬运工（最多3人，当前" + state.workers.length + "人）",
    eligible: () => state.workers.length > 1,
    snapshot: () => ({ workerCount: Math.min(3, state.workers.length) }),
    apply: s => { while (state.workers.length < s.workerCount) addWorker(); }
  },
  {
    id: "tacticMemory",
    icon: "🎯",
    title: "战术经验",
    desc: () => {
      const owned = ["ap", "ice", "fire", "he"].filter(k => state.unlocks[k]);
      return owned.length ? "保留一种特殊弹药（" + owned.join("/") + "）" : "无可保留弹药";
    },
    eligible: () => ["ap", "ice", "fire", "he"].some(k => state.unlocks[k]),
    snapshot: () => {
      const owned = ["ap", "ice", "fire", "he"].filter(k => state.unlocks[k]);
      return { ammo: owned[Math.floor(Math.random() * owned.length)] };
    },
    apply: s => { if (s.ammo) state.unlocks[s.ammo] = true; }
  },
  {
    id: "synergyEcho",
    icon: "⚡",
    title: "共鸣余韵",
    desc: () => {
      const best = Object.entries(state.synergyCounts).sort((a, b) => b[1] - a[1])[0];
      return best && best[1] > 0 ? "保留最高共鸣标签2层（" + best[0] + " " + best[1] + "→2）" : "无共鸣可保留";
    },
    eligible: () => Object.values(state.synergyCounts).some(v => v >= 2),
    snapshot: () => {
      const best = Object.entries(state.synergyCounts).sort((a, b) => b[1] - a[1])[0];
      return { tag: best[0], count: Math.min(2, best[1]) };
    },
    apply: s => { if (s.tag) { state.synergyCounts[s.tag] += s.count; checkSynergies(); } }
  }
];

ctx.scale(SCALE, SCALE);
ctx.lineJoin = "round";
ctx.lineCap = "round";

const state = {
  mode: "start",
  time: 0,
  last: 0,
  coins: 120,
  earned: 0,
  kills: 0,
  lives: HOME_MAX_HP,
  baseCoinTimer: BASE_COIN_INTERVAL,
  baseIncomeLevel: 1,
  wave: 0,
  waveActive: false,
  waveClearTimer: null,
  waveTimer: 1.2,
  spawned: 0,
  spawnTimer: 0,
  productionLevel: 1,
  gunnerCount: 1,
  gunnerLevel: 1,
  cannonLevel: 1,
  cannonCount: 1,
  porterLevel: 1,
  priority: "balanced",
  ammoTimer: 0,
  ammoStock: { bullet: 0, shell: 0, ap: 0, ice: 0, fire: 0, he: 0 },
  gunnerMagazines: [{ bullet: 5, ap: 0, ice: 0 }],
  cannonMagazines: [{ shell: 1, fire: 0, he: 0 }],
  gunnerHealth: [DEFENSE_MAX_HP],
  cannonHealth: [DEFENSE_MAX_HP],
  gunnerRepairWave: [Infinity],
  cannonRepairWave: [Infinity],
  wallHealth: WALL_MAX_HP,
  wallRepairWave: Infinity,
  gunTimers: [0],
  cannonTimers: [0],
  gunnerAimAngles: [0],
  cannonAimAngles: [0],
  weaponTimers: { machine: 0, sniper: 0, mortar: 0 },
  weaponAimAngles: { machine: 0, sniper: 0, mortar: 0 },
  unlocks: {
    ap: false,
    ice: false,
    fire: false,
    he: false,
    machine: false,
    sniper: false,
    mortar: false
  },
  specialSlots: { machine: null, sniper: null, mortar: null },
  gunnerSkillCharge: [0],
  cannonSkillCharge: [0],
  gunnerSkillActive: [0],
  cannonSkillActive: [0],
  roleLevels: { porter: 1, loader: 1, dispatcher: 1, mechanic: 1 },
  damageBonus: 0,
  gunnerMagCapacity: GUNNER_MAG_CAPACITY,
  cannonMagCapacity: CANNON_MAG_CAPACITY,
  critChance: 0,
  beltSpeedBonus: 0,
  blastRadiusBonus: 0,
  ammoEfficiency: 0,
  killCoinBonus: 0,
  waveRepair: 0,
  gateMax: HOME_MAX_HP,
  defenseHitCooldown: 0,
  defenseTransitionTimer: 0,
  focusDefenseTarget: null,
  focusTarget: null,
  homeHitCooldown: 0,
  eventTimer: 14,
  beltEvent: null,
  eventDuration: 0,
  enemyBeltJamCooldown: 0,
  enemyBeltJamsThisWave: 0,
  beltOffset: 0,
  flash: 0,
  sound: true,
  particles: [],
  ammoDrops: [],
  workers: [],
  enemies: [],
  projectiles: [],
  floaters: [],
  fireZones: [],
  pendingChoices: [],
  choiceRefreshes: 0,
  stageStartEarned: 0,
  stageStartKills: 0,
  savedStage: readSavedStage(),
  bestWave: Number(localStorage.getItem(BEST_WAVE_KEY()) || 0),
  endless: false,
  endlessWave: 0,
  synergyCounts: { fire: 0, armor: 0, speed: 0, economy: 0 },
  activeSynergies: [],
  tipShown: { armor: false, shield: false, berserker: false },
  burnDurationBonus: 0,
  defenseRepairBonus: 0,
  prestige: loadPrestige(),
  tech: loadTech(),
  pendingLegacy: null,
  legacySnapshot: null
};

const bossNames = [
  "废土监工",
  "装甲督军",
  "裂地领主",
  "钢铁暴君",
  "辐射巨像",
  "战争主脑",
  "深渊堡垒",
  "毁灭统帅",
  "终末领主",
  "终焉堡垒"
];

function createWave(index) {
  const stage = Math.floor(index / WAVES_PER_STAGE) + 1;
  const stageWave = index % WAVES_PER_STAGE + 1;
  const stageTier = stage - 1;
  if (stageWave === WAVES_PER_STAGE) {
    return {
      count: 1,
      interval: 0,
      hp: Math.round(5100 * Math.pow(1.26, stageTier)),
      speed: Math.min(30, 15 + stageTier * 1.0),
      reward: Math.round(420 + stageTier * 240),
      shield: Math.round(650 * Math.pow(1.22, stageTier)),
      type: "boss",
      bossName: bossNames[stageTier],
      batchSize: 1,
      stage,
      stageWave
    };
  }
  return {
    count: Math.min(80, 24 + (stageWave - 1) * 5 + stageTier * 4),
    interval: Math.max(0.3, 1.17 - stageWave * 0.065 - stageTier * 0.025),
    hp: Math.round(52 * Math.pow(1.16, stageWave - 1) * Math.pow(1.14, stageTier)),
    speed: Math.min(50, 22.75 + (stageWave - 1) * 1.15 + stageTier * 1.0),
    reward: Math.round(18 + stageWave * 4 + stageTier * 9),
    type: stage === 1 && stageWave <= 2 ? "grunt" : "mixed",
    batchSize: Math.min(6, 2 + Math.floor((stageWave - 1) / 2) + Math.floor(stageTier / 3)),
    stage,
    stageWave
  };
}

const waveBook = Array.from({ length: TOTAL_WAVES }, (_, index) => createWave(index));

function createEndlessWave(endlessIndex) {
  const stageWave = endlessIndex % WAVES_PER_STAGE + 1;
  const virtualStage = TOTAL_STAGES + Math.floor(endlessIndex / WAVES_PER_STAGE);
  const scaleFactor = 1 + endlessIndex * 0.06;
  if (stageWave === WAVES_PER_STAGE) {
    return {
      count: 1,
      interval: 0,
      hp: Math.round(5100 * Math.pow(1.38, virtualStage - 1) * scaleFactor),
      speed: Math.min(52, 15 + (virtualStage - 1) * 1.65),
      reward: Math.round(420 + (virtualStage - 1) * 240),
      shield: Math.round(650 * Math.pow(1.35, virtualStage - 1) * scaleFactor),
      type: "boss",
      bossName: `无尽Boss·${Math.floor(endlessIndex / WAVES_PER_STAGE) + 1}`,
      batchSize: 1,
      stage: virtualStage,
      stageWave
    };
  }
  return {
    count: Math.min(120, 28 + (stageWave - 1) * 6 + (virtualStage - 1) * 5),
    interval: Math.max(0.22, 1.0 - stageWave * 0.06 - (virtualStage - 1) * 0.02),
    hp: Math.round(52 * Math.pow(1.16, stageWave - 1) * Math.pow(1.24, virtualStage - 1) * scaleFactor),
    speed: Math.min(60, 22.75 + (stageWave - 1) * 1.15 + (virtualStage - 1) * 1.8),
    reward: Math.round(18 + stageWave * 5 + (virtualStage - 1) * 12),
    type: "mixed",
    batchSize: Math.min(8, 2 + Math.floor((stageWave - 1) / 2) + Math.floor((virtualStage - 1) / 2)),
    stage: virtualStage,
    stageWave
  };
}

function getWave(index) {
  if (index < waveBook.length) return waveBook[index];
  return createEndlessWave(index - TOTAL_WAVES);
}

function currentStageNumber() {
  return Math.min(TOTAL_STAGES, Math.floor(state.wave / WAVES_PER_STAGE) + 1);
}

function currentStageWave() {
  return Math.min(WAVES_PER_STAGE, state.wave % WAVES_PER_STAGE + 1);
}

function readSavedStage() {
  const saved = Number(localStorage.getItem(STAGE_PROGRESS_KEY()));
  if (!Number.isFinite(saved)) return 1;
  return Math.min(TOTAL_STAGES, Math.max(1, Math.floor(saved)));
}

function updateContinueGameButton() {
  const savedStage = readSavedStage();
  state.savedStage = savedStage;
  const hasSave = savedStage > 1;
  continueGameButton.hidden = !hasSave;
  continueGameButton.textContent = `继续第 ${savedStage} 关 (槽${currentSlot})`;
  document.getElementById("startButton").hidden = hasSave;
  document.getElementById("resetProgressButton").hidden = !hasSave;
  const endlessTitleBtn = document.getElementById("endlessTitleButton");
  if (endlessTitleBtn) endlessTitleBtn.hidden = !isEndlessUnlocked();
  renderSlotSelector();
}

function renderSlotSelector() {
  for (let s = 1; s <= 3; s++) {
    const btn = document.getElementById(`slot${s}Button`);
    if (!btn) continue;
    const info = getSlotSummary(s);
    btn.className = s === currentSlot ? "slot-button active" : "slot-button";
    btn.innerHTML = info.empty
      ? `槽${s}<span class="slot-info">空</span>`
      : `槽${s}<span class="slot-info">第${info.stage}关 ★${info.prestige}</span>`;
  }
}

function saveStageProgress(stage) {
  const normalized = Math.min(TOTAL_STAGES, Math.max(1, Math.floor(stage)));
  const savedStage = Math.max(readSavedStage(), normalized);
  localStorage.setItem(STAGE_PROGRESS_KEY(), String(savedStage));
  state.savedStage = savedStage;
  if (savedStage >= TOTAL_STAGES) unlockEndless();
  updateContinueGameButton();
  return savedStage;
}

function baseCoinAmount() {
  const stageBonus = (currentStageNumber() - 1) * 4;
  return 5 + (state.baseIncomeLevel - 1) * 3 + stageBonus;
}

function nextGunnerSpecialSlot() {
  const occupied = new Set(
    [state.specialSlots.machine, state.specialSlots.sniper]
      .filter(index => Number.isInteger(index))
  );
  for (let index = 0; index < state.gunnerCount; index++) {
    if (!occupied.has(index)) return index;
  }
  return null;
}

function nextCannonSpecialSlot() {
  const occupied = new Set(
    [state.specialSlots.mortar].filter(index => Number.isInteger(index))
  );
  for (let index = 0; index < state.cannonCount; index++) {
    if (!occupied.has(index)) return index;
  }
  return null;
}

function gunnerSpecialAt(index) {
  if (state.unlocks.machine && state.specialSlots.machine === index) return "machine";
  if (state.unlocks.sniper && state.specialSlots.sniper === index) return "sniper";
  return null;
}

function cannonSpecialAt(index) {
  return state.unlocks.mortar && state.specialSlots.mortar === index ? "mortar" : null;
}

const shop = [
  {
    key: "production",
    label: "产线",
    color: "#69b9ff",
    cost: () => 100 + state.productionLevel * 90,
    level: () => state.productionLevel,
    maxed: () => state.productionLevel >= maxProductionLevel(),
    desc: () => "产弹" + Math.max(0.28, 0.78 - state.productionLevel * 0.055).toFixed(2) + "s→" + Math.max(0.28, 0.78 - (state.productionLevel + 1) * 0.055).toFixed(2) + "s 枪伤+2",
    action: () => {
      state.productionLevel = Math.min(maxProductionLevel(), state.productionLevel + 1);
    }
  },
  {
    key: "gunner",
    label: () => state.gunnerCount < 3 ? "枪手+1" : "枪手强化",
    color: "#ee6d55",
    cost: () => state.gunnerCount < 3
      ? 100 + state.gunnerCount * 120
      : 220 + state.gunnerLevel * 140,
    status: () => state.gunnerCount < 3
      ? `数量 ${state.gunnerCount}/3`
      : state.gunnerLevel >= maxGunnerLevel() ? "强化 MAX" : `强化 LV.${state.gunnerLevel}`,
    buttonLabel: () => state.gunnerCount < 3
      ? "添加"
      : state.gunnerLevel >= maxGunnerLevel() ? "已满" : "强化",
    maxed: () => state.gunnerCount >= 3 && state.gunnerLevel >= maxGunnerLevel(),
    desc: () => state.gunnerCount < 3 ? "增加一名枪手" : "伤害+3 射速" + Math.max(0.48, 0.9 - (state.gunnerLevel - 1) * 0.025 - (state.productionLevel - 1) * 0.008).toFixed(2) + "s→" + Math.max(0.48, 0.9 - state.gunnerLevel * 0.025 - (state.productionLevel - 1) * 0.008).toFixed(2) + "s",
    action: () => {
      if (state.gunnerCount < 3) addGunner();
      else state.gunnerLevel = Math.min(maxGunnerLevel(), state.gunnerLevel + 1);
    }
  },
  {
      key: "cannon",
      label: () => state.cannonCount < 3 ? "炮台+1" : "炮台强化",
      color: "#ff9d43",
      cost: () => state.cannonCount < 3
        ? 160 + state.cannonCount * 120
        : 320 + state.cannonLevel * 180,
      status: () => state.cannonCount < 3
        ? `数量 ${state.cannonCount}/3`
        : state.cannonLevel >= maxCannonLevel() ? "强化 MAX" : `强化 LV.${state.cannonLevel}`,
      buttonLabel: () => state.cannonCount < 3
        ? "添加"
        : state.cannonLevel >= maxCannonLevel() ? "已满" : "强化",
      maxed: () => state.cannonCount >= 3 && state.cannonLevel >= maxCannonLevel(),
      desc: () => state.cannonCount < 3 ? "增加一座炮台" : "伤害+20 射速" + Math.max(1.2, 2.5 - (state.cannonLevel - 1) * 0.07).toFixed(2) + "s→" + Math.max(1.2, 2.5 - state.cannonLevel * 0.07).toFixed(2) + "s 爆炸+3",
      action: () => {
        if (state.cannonCount < 3) addCannon();
        else state.cannonLevel = Math.min(maxCannonLevel(), state.cannonLevel + 1);
      }
  },
  {
    key: "porter",
    label: "搬运工+1",
    color: "#65d18a",
    cost: () => 90 + state.porterLevel * 110,
    level: () => state.porterLevel,
    maxed: () => state.porterLevel >= 6,
    desc: () => "当前" + state.workers.length + "人 添加一名搬运工",
    action: () => addWorker()
  }
];

let audioCtx = null;

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRound(x, y, w, h, r, color) {
  roundedRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRound(x, y, w, h, r, color, width = 2) {
  roundedRect(x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function text(value, x, y, size, color = "#17231c", align = "center", weight = 900) {
  ctx.save();
  ctx.font = `${weight} ${size}px "Arial Black", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function roadProgress(y) {
  return clamp((y - ROAD_HORIZON_Y) / (GATE_Y - ROAD_HORIZON_Y), 0, 1);
}

function roadDepthScale(y) {
  return lerp(0.56, 1, roadProgress(y));
}

function roadBoundsAt(y) {
  const progress = roadProgress(y);
  return {
    left: lerp(184, 186, progress),
    right: lerp(324, 416, progress)
  };
}

function roadPointForLane(y, lane) {
  const bounds = roadBoundsAt(y);
  return lerp(bounds.left, bounds.right, clamp(lane, 0, 1));
}

function beltProgress(y) {
  return clamp((y - PLAY_TOP) / (DEPOT.y - 24 - PLAY_TOP), 0, 1);
}

function beltDepthScale(y) {
  return lerp(0.58, 1, beltProgress(y));
}

function beltBoundsAt(y) {
  const progress = beltProgress(y);
  return {
    left: lerp(69, 51, progress),
    right: lerp(113, 129, progress)
  };
}

function beltPointForLane(y, lane) {
  const bounds = beltBoundsAt(y);
  return lerp(bounds.left, bounds.right, clamp(lane, 0, 1));
}

const ammoMeta = {
  bullet: { family: "bullet", color: "#ffc43d", label: "标准弹" },
  ap: { family: "bullet", color: "#ff835f", label: "穿甲弹" },
  ice: { family: "bullet", color: "#66d9ff", label: "冰冻弹" },
  shell: { family: "shell", color: "#9d5dca", label: "标准炮弹" },
  fire: { family: "shell", color: "#ff7048", label: "燃烧弹" },
  he: { family: "shell", color: "#ffe36a", label: "高爆弹" }
};

function totalAmmo(family) {
  if (family === "bullet") {
    return state.gunnerMagazines
      .slice(0, state.gunnerCount)
      .reduce((sum, magazine) =>
        sum + Object.values(magazine).reduce((magazineSum, value) => magazineSum + value, 0), 0);
  }
  return state.cannonMagazines
    .slice(0, state.cannonCount)
    .reduce((sum, magazine) =>
      sum + Object.values(magazine).reduce((magazineSum, value) => magazineSum + value, 0), 0);
}

function gunnerAmmoCount(index) {
  const magazine = state.gunnerMagazines[index];
  return magazine ? Object.values(magazine).reduce((sum, value) => sum + value, 0) : 0;
}

function gunnerOperational(index) {
  return index < state.gunnerCount && (state.gunnerHealth[index] || 0) > 0;
}

function gunnerAmmoTypes(index) {
  const magazine = state.gunnerMagazines[index];
  if (!magazine) return [];
  return ["ap", "ice", "bullet"].flatMap(type => Array(magazine[type]).fill(type));
}

function cannonAmmoCount(index) {
  const magazine = state.cannonMagazines[index];
  return magazine ? Object.values(magazine).reduce((sum, value) => sum + value, 0) : 0;
}

function cannonOperational(index) {
  return index < state.cannonCount && (state.cannonHealth[index] || 0) > 0;
}

function cannonAmmoTypes(index) {
  const magazine = state.cannonMagazines[index];
  if (!magazine) return [];
  return ["he", "fire", "shell"].flatMap(type => Array(magazine[type]).fill(type));
}

function takeAmmo(family, weaponIndex = null) {
  const source = family === "bullet"
    ? state.gunnerMagazines[weaponIndex]
    : state.cannonMagazines[weaponIndex];
  if (!source) return null;
  const order = family === "bullet"
    ? ["ap", "ice", "bullet"]
    : ["he", "fire", "shell"];
  const type = order.find(key => source[key] > 0);
  if (!type) return null;
  if (Math.random() >= state.ammoEfficiency) source[type]--;
  return type;
}

function beep(freq = 440, duration = 0.06, type = "square", volume = 0.04) {
  if (!state.sound) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (_) {
    state.sound = false;
  }
}

function announce(message) {
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

function choicePool() {
  return [
    {
      id: "ap",
      mark: "AP",
      title: "穿甲弹",
      desc: "解锁穿甲弹(AP)，对装甲×2.15伤害；普通子弹仅×0.48",
      eligible: () => !state.unlocks.ap,
      apply: () => { state.unlocks.ap = true; }
    },
    {
      id: "ice",
      mark: "ICE",
      title: "冰冻弹",
      desc: "解锁冰冻弹，命中后减速3.8秒，克制跑者",
      eligible: () => !state.unlocks.ice,
      apply: () => { state.unlocks.ice = true; }
    },
    {
      id: "fire",
      mark: "F",
      title: "燃烧炮弹",
      desc: "解锁燃烧炮弹，命中后持续烧伤5秒，每0.5秒造成额外伤害",
      eligible: () => !state.unlocks.fire,
      apply: () => { state.unlocks.fire = true; }
    },
    {
      id: "he",
      mark: "HE",
      title: "高爆炮弹",
      desc: "解锁高爆炮弹，爆炸范围+58%并击退敌人",
      eligible: () => !state.unlocks.he,
      apply: () => { state.unlocks.he = true; }
    },
    {
      id: "machine",
      mark: "MG",
      title: "机枪阵地",
      desc: "改装一名枪手为机枪，射速极快(0.09s)但单发较低",
      eligible: () => !state.unlocks.machine && nextGunnerSpecialSlot() !== null,
      apply: () => {
        state.specialSlots.machine = nextGunnerSpecialSlot();
        state.unlocks.machine = true;
      }
    },
    {
      id: "sniper",
      mark: "SR",
      title: "狙击阵地",
      desc: "改装一名枪手为狙击，单发高伤(×3.7)且优先打重甲",
      eligible: () => !state.unlocks.sniper && nextGunnerSpecialSlot() !== null,
      apply: () => {
        state.specialSlots.sniper = nextGunnerSpecialSlot();
        state.unlocks.sniper = true;
      }
    },
    {
      id: "mortar",
      mark: "M",
      title: "迫击炮阵地",
      desc: "改装一座炮台为迫击炮，60px范围自动轰炸，冷却3秒",
      eligible: () => !state.unlocks.mortar && nextCannonSpecialSlot() !== null,
      apply: () => {
        state.specialSlots.mortar = nextCannonSpecialSlot();
        state.unlocks.mortar = true;
      }
    },
    {
      id: "porterRole",
      mark: "速",
      title: "搬运专精",
      desc: "搬运工移速+14%（当前LV." + state.roleLevels.porter + "/5）",
      eligible: () => state.roleLevels.porter < 5,
      apply: () => { state.roleLevels.porter++; }
    },
    {
      id: "loaderRole",
      mark: "装",
      title: "装填专精",
      desc: "单次装填量+1，装填工额外+1（当前LV." + state.roleLevels.loader + "/5）",
      eligible: () => state.roleLevels.loader < 5,
      apply: () => { state.roleLevels.loader++; }
    },
    {
      id: "dispatcherRole",
      mark: "调",
      title: "调度专精",
      desc: "调度偏差+12%，更准确补充紧缺弹种（当前LV." + state.roleLevels.dispatcher + "/5）",
      eligible: () => state.roleLevels.dispatcher < 5,
      apply: () => { state.roleLevels.dispatcher++; }
    },
    {
      id: "mechanicRole",
      mark: "修",
      title: "维修专精",
      desc: "产线维修-0.4s（当前" + (Math.max(1.4, 3 - (state.roleLevels.mechanic - 1) * 0.4)).toFixed(1) + "s→" + (Math.max(1.4, 3 - state.roleLevels.mechanic * 0.4)).toFixed(1) + "s，LV." + state.roleLevels.mechanic + "/5）",
      eligible: () => state.roleLevels.mechanic < 5,
      apply: () => { state.roleLevels.mechanic++; }
    },
    {
      id: "gunnerCapacity",
      mark: "匣",
      title: "弹匣扩容",
      desc: "枪手弹匣+1（当前" + state.gunnerMagCapacity + "→" + (state.gunnerMagCapacity + 1) + "发，上限8）",
      eligible: () => state.gunnerMagCapacity < 8,
      apply: () => { state.gunnerMagCapacity++; }
    },
    {
      id: "cannonCapacity",
      mark: "仓",
      title: "炮舱扩容",
      desc: "炮台弹仓+1（当前" + state.cannonMagCapacity + "→" + (state.cannonMagCapacity + 1) + "发，上限4）",
      eligible: () => state.cannonMagCapacity < 4,
      apply: () => { state.cannonMagCapacity++; }
    },
    {
      id: "critical",
      mark: "准",
      title: "暴击训练",
      desc: "暴击率+8%（当前" + Math.round(state.critChance * 100) + "%→" + Math.round((state.critChance + 0.08) * 100) + "%，暴击×1.75伤害）",
      eligible: () => state.critChance < 0.32,
      apply: () => { state.critChance += 0.08; }
    },
    {
      id: "beltSpeed",
      mark: "带",
      title: "高速履带",
      desc: "传送带速度+15%（当前+" + Math.round(state.beltSpeedBonus * 100) + "%→+" + Math.round((state.beltSpeedBonus + 0.15) * 100) + "%）",
      eligible: () => state.beltSpeedBonus < 0.6,
      apply: () => { state.beltSpeedBonus += 0.15; }
    },
    {
      id: "blastRadius",
      mark: "爆",
      title: "广域引信",
      desc: "炮弹AOE范围+15%（当前+" + Math.round(state.blastRadiusBonus * 100) + "%→+" + Math.round((state.blastRadiusBonus + 0.15) * 100) + "%）",
      eligible: () => state.blastRadiusBonus < 0.6,
      apply: () => { state.blastRadiusBonus += 0.15; }
    },
    {
      id: "ammoEfficiency",
      mark: "省",
      title: "节约供弹",
      desc: "免耗弹率+8%（当前" + Math.round(state.ammoEfficiency * 100) + "%→" + Math.round((state.ammoEfficiency + 0.08) * 100) + "%）",
      eligible: () => state.ammoEfficiency < 0.32,
      apply: () => { state.ammoEfficiency += 0.08; }
    },
    {
      id: "bounty",
      mark: "赏",
      title: "战地赏金",
      desc: "击杀奖励+15%（当前+" + Math.round(state.killCoinBonus * 100) + "%→+" + Math.round((state.killCoinBonus + 0.15) * 100) + "%）",
      eligible: () => state.killCoinBonus < 0.6,
      apply: () => { state.killCoinBonus += 0.15; }
    },
    {
      id: "baseIncome",
      mark: "基",
      title: "基地经济",
      desc: "基地收入+3/5s（当前" + baseCoinAmount() + "→" + (baseCoinAmount() + 3) + "金/5s）",
      eligible: () => state.baseIncomeLevel < MAX_BASE_INCOME_LEVEL,
      apply: () => { state.baseIncomeLevel++; }
    },
    {
      id: "waveRepair",
      mark: "补",
      title: "维修补给",
      desc: "维修补充弹药+1（当前维修时补充" + state.waveRepair + "→" + (state.waveRepair + 1) + "发）",
      eligible: () => state.waveRepair < 3,
      apply: () => { state.waveRepair++; }
    },
    {
      id: "productionTune",
      mark: "产",
      title: "产线调校",
      desc: "产线LV." + state.productionLevel + "→" + Math.min(maxProductionLevel(), state.productionLevel + 1) + "：产弹间隔" + Math.max(0.28, 0.78 - state.productionLevel * 0.055).toFixed(2) + "s→" + Math.max(0.28, 0.78 - (state.productionLevel + 1) * 0.055).toFixed(2) + "s，枪手伤害+2",
      eligible: () => state.productionLevel < maxProductionLevel(),
      apply: () => {
        state.productionLevel = Math.min(maxProductionLevel(), state.productionLevel + 1);
      }
    },
    {
      id: "arsenalTraining",
      mark: "训",
      title: "全员训练",
      desc: "枪手LV." + state.gunnerLevel + "→" + Math.min(maxGunnerLevel(), state.gunnerLevel + 1) + " 炮台LV." + state.cannonLevel + "→" + Math.min(maxCannonLevel(), state.cannonLevel + 1) + "（提高伤害和射速）",
      eligible: () => state.gunnerLevel < maxGunnerLevel() || state.cannonLevel < maxCannonLevel(),
      apply: () => {
        state.gunnerLevel = Math.min(maxGunnerLevel(), state.gunnerLevel + 1);
        state.cannonLevel = Math.min(maxCannonLevel(), state.cannonLevel + 1);
      }
    },
    {
      id: "damage",
      mark: "+",
      title: "火力校准",
      desc: "全局伤害+12%（当前+" + Math.round(state.damageBonus * 100) + "%→+" + Math.round(Math.min(MAX_DAMAGE_BONUS, state.damageBonus + 0.12) * 100) + "%，上限+120%）",
      eligible: () => state.damageBonus < MAX_DAMAGE_BONUS - 0.001,
      apply: () => {
        state.damageBonus = Math.min(MAX_DAMAGE_BONUS, state.damageBonus + 0.12);
      }
    },
    {
      id: "coinCache",
      mark: "金",
      title: "战地金库",
      desc: "立即获得 " + (120 + currentStageNumber() * 35) + " 金币",
      eligible: () => true,
      apply: () => {
        const amount = 120 + currentStageNumber() * 35;
        state.coins += amount;
        state.earned += amount;
      }
    },
    {
      id: "ammoCrate",
      mark: "弹",
      title: "整箱弹药",
      desc: "立即获得 " + (12 + currentStageNumber() * 2) + " 子弹 + " + (4 + Math.ceil(currentStageNumber() / 2)) + " 炮弹",
      eligible: () => true,
      apply: () => {
        state.ammoStock.bullet += 12 + currentStageNumber() * 2;
        state.ammoStock.shell += 4 + Math.ceil(currentStageNumber() / 2);
      }
    },
    {
      id: "emergencyRepair",
      mark: "援",
      title: "紧急支援",
      desc: state.lives < state.gateMax ? "基地恢复2点生命（" + state.lives + "/" + state.gateMax + "→" + Math.min(state.gateMax, state.lives + 2) + "/" + state.gateMax + "）" : "生命已满，改为获得100金币",
      eligible: () => true,
      apply: () => {
        if (state.lives < state.gateMax) {
          state.lives = Math.min(state.gateMax, state.lives + 2);
        } else {
          state.coins += 100;
          state.earned += 100;
        }
      }
    }
  ];
}

const choiceTags = {
  ap: "armor", ice: "armor", fire: "fire", he: "fire",
  machine: "fire", sniper: "armor", mortar: "fire",
  porterRole: "speed", loaderRole: "speed", dispatcherRole: "speed", mechanicRole: "speed",
  gunnerCapacity: "armor", cannonCapacity: "fire",
  critical: "fire", beltSpeed: "speed", blastRadius: "fire",
  ammoEfficiency: "economy", bounty: "economy", baseIncome: "economy",
  waveRepair: "armor", productionTune: "speed", arsenalTraining: "fire",
  damage: "fire", coinCache: "economy", ammoCrate: "speed", emergencyRepair: "armor"
};

const synergyDefs = [
  { tag: "fire", threshold: 3, name: "烈焰共鸣", desc: "所有伤害额外+8%", effect: () => { state.damageBonus += 0.08; } },
  { tag: "fire", threshold: 6, name: "焚天", desc: "燃烧弹持续时间+50%", effect: () => { state.burnDurationBonus += 0.5; } },
  { tag: "armor", threshold: 3, name: "钢铁壁垒", desc: "城墙+1上限", effect: () => { state.gateMax++; state.lives = Math.min(state.gateMax, state.lives + 1); } },
  { tag: "armor", threshold: 6, name: "铜墙铁壁", desc: "阵地维修时间缩短30%", effect: () => { state.defenseRepairBonus += 0.3; } },
  { tag: "speed", threshold: 3, name: "极速供应", desc: "传送带速度+10%", effect: () => { state.beltSpeedBonus += 0.10; } },
  { tag: "speed", threshold: 6, name: "闪电物流", desc: "搬运工移动速度+15%", effect: () => { state.roleLevels.porter++; } },
  { tag: "economy", threshold: 3, name: "财源广进", desc: "基地收入+2", effect: () => { state.baseIncomeLevel++; } },
  { tag: "economy", threshold: 6, name: "黄金时代", desc: "击杀奖励+10%", effect: () => { state.killCoinBonus += 0.10; } }
];

function checkSynergies() {
  for (const def of synergyDefs) {
    if (state.synergyCounts[def.tag] >= def.threshold &&
        !state.activeSynergies.includes(def.name)) {
      state.activeSynergies.push(def.name);
      def.effect();
      state.floaters.push({ value: `共鸣·${def.name}`, x: ROAD.x + ROAD.w / 2, y: 180, life: 2.2, color: "#ffe36a" });
      state.floaters.push({ value: def.desc, x: ROAD.x + ROAD.w / 2, y: 206, life: 2.2, color: "#fff4c5" });
      announce(`共鸣触发: ${def.name} — ${def.desc}`);
      beep(740, 0.15, "triangle", 0.05);
      setTimeout(() => beep(880, 0.12, "triangle", 0.05), 100);
    }
  }
}

function choiceRefreshCost() {
  return 60 + state.choiceRefreshes * 40;
}

function shuffleChoices(choices) {
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function updateRefreshChoicesButton() {
  const cost = choiceRefreshCost();
  const affordable = state.coins >= cost;
  refreshChoicesButton.disabled = !affordable;
  refreshChoicesButton.textContent = affordable
    ? `刷新补给 · ${cost} 金币`
    : `金币不足 · 需要 ${cost}`;
}

function renderChoiceOptions(preferNew = false) {
  const available = choicePool().filter(choice => choice.eligible());
  const currentIds = new Set(state.pendingChoices.map(choice => choice.id));
  const fresh = preferNew ? available.filter(choice => !currentIds.has(choice.id)) : available;
  const repeated = preferNew ? available.filter(choice => currentIds.has(choice.id)) : [];
  const candidates = [...shuffleChoices(fresh), ...shuffleChoices(repeated)];
  state.pendingChoices = candidates.slice(0, 3);
  choiceList.replaceChildren();
  for (const choice of state.pendingChoices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    const tag = choiceTags[choice.id];
    const tagLabels = { fire: "🔥火", armor: "🛡防", speed: "⚡速", economy: "💰财" };
    const tagLabel = tag ? tagLabels[tag] || "" : "";
    const tagCount = tag ? (state.synergyCounts[tag] || 0) : 0;
    const tagThreshold = tagCount >= 3 ? 6 : 3;
    const tagHtml = tag ? `<span class="choice-tag">${tagLabel} ${tagCount}/${tagThreshold}</span>` : "";
    button.innerHTML = `
      <span class="choice-mark">${choice.mark}</span>
      <span class="choice-copy">
        <strong>${choice.title}</strong>${tagHtml}
        <span>${choice.desc}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      choice.apply();
      const tag = choiceTags[choice.id];
      if (tag && state.synergyCounts[tag] !== undefined) {
        state.synergyCounts[tag]++;
        checkSynergies();
      }
      choiceOverlay.hidden = true;
      state.mode = "playing";
      state.waveTimer = 2.2;
      state.last = performance.now();
      pauseButton.hidden = false;
      announce(choice.title);
      beep(690, 0.12, "triangle", 0.045);
      requestAnimationFrame(loop);
    }, { once: true });
    choiceList.appendChild(button);
  }
  updateRefreshChoicesButton();
}

function refreshChoices() {
  if (state.mode !== "choosing") return;
  const cost = choiceRefreshCost();
  if (state.coins < cost) {
    updateRefreshChoicesButton();
    return;
  }
  state.coins -= cost;
  state.choiceRefreshes++;
  renderChoiceOptions(true);
  draw();
  announce("补给已刷新");
  beep(570, 0.09, "triangle", 0.035);
}

function showChoices() {
  state.mode = "choosing";
  pauseButton.hidden = true;
  state.choiceRefreshes = 0;
  state.pendingChoices = [];
  renderChoiceOptions();
  choiceOverlay.hidden = false;
}

function resetStageState(mode = "playing") {
  Object.assign(state, {
    mode,
    time: 0,
    last: performance.now(),
    coins: 220,
    lives: HOME_MAX_HP,
    baseCoinTimer: BASE_COIN_INTERVAL,
    baseIncomeLevel: 1,
    waveActive: false,
    waveClearTimer: null,
    waveTimer: 1.2,
    spawned: 0,
    spawnTimer: 0,
    productionLevel: 1,
    gunnerCount: 1,
    gunnerLevel: 1,
    cannonLevel: 1,
    cannonCount: 1,
    porterLevel: 0,
    priority: "balanced",
    ammoTimer: 0.15,
    ammoStock: { bullet: 0, shell: 0, ap: 0, ice: 0, fire: 0, he: 0 },
    gunnerMagazines: [{ bullet: 5, ap: 0, ice: 0 }],
    cannonMagazines: [{ shell: 1, fire: 0, he: 0 }],
    gunnerHealth: [DEFENSE_MAX_HP],
    cannonHealth: [DEFENSE_MAX_HP],
    gunnerRepairWave: [Infinity],
    cannonRepairWave: [Infinity],
    wallHealth: WALL_MAX_HP,
    wallRepairWave: Infinity,
    gunTimers: [0],
    cannonTimers: [0],
    gunnerAimAngles: [0],
    cannonAimAngles: [0],
    weaponTimers: { machine: 0, sniper: 0, mortar: 0 },
    weaponAimAngles: { machine: 0, sniper: 0, mortar: 0 },
    unlocks: {
      ap: false,
      ice: false,
      fire: false,
      he: false,
      machine: false,
      sniper: false,
      mortar: false
    },
    specialSlots: { machine: null, sniper: null, mortar: null },
    gunnerSkillCharge: [0],
    cannonSkillCharge: [0],
    gunnerSkillActive: [0],
    cannonSkillActive: [0],
    roleLevels: { porter: 1, loader: 1, dispatcher: 1, mechanic: 1 },
    damageBonus: 0,
    gunnerMagCapacity: GUNNER_MAG_CAPACITY,
    cannonMagCapacity: CANNON_MAG_CAPACITY,
    critChance: 0,
    beltSpeedBonus: 0,
    blastRadiusBonus: 0,
    ammoEfficiency: 0,
    killCoinBonus: 0,
    waveRepair: 0,
    gateMax: HOME_MAX_HP,
    defenseHitCooldown: 0,
    defenseTransitionTimer: 0,
    focusDefenseTarget: null,
    focusTarget: null,
    homeHitCooldown: 0,
    eventTimer: 14,
    beltEvent: null,
    eventDuration: 0,
    enemyBeltJamCooldown: 0,
    enemyBeltJamsThisWave: 0,
    beltOffset: 0,
    flash: 0,
    particles: [],
    ammoDrops: [],
    workers: [],
    enemies: [],
    projectiles: [],
    floaters: [],
    fireZones: [],
    pendingChoices: [],
    choiceRefreshes: 0,
    synergyCounts: { fire: 0, armor: 0, speed: 0, economy: 0 },
    activeSynergies: [],
    tipShown: { armor: false, shield: false, berserker: false },
    burnDurationBonus: 0,
    defenseRepairBonus: 0
  });
  addWorker();
  applyStageBonus();
  applyTechBonuses();
  applyLegacy();
}

function applyStageBonus() {
  const stage = currentStageNumber();
  if (stage <= 1) return;
  const tier = stage - 1;
  state.coins += tier * 30;
  state.gunnerMagazines[0].bullet += tier;
  state.cannonMagazines[0].shell += Math.min(tier, 5);
  state.productionLevel = Math.min(maxProductionLevel(), state.productionLevel + Math.floor(tier / 2));
  state.gunnerLevel = Math.min(maxGunnerLevel(), state.gunnerLevel + Math.floor(tier / 3));
  state.cannonLevel = Math.min(maxCannonLevel(), state.cannonLevel + Math.floor(tier / 3));
}

function applyTechBonuses() {
  const tech = state.tech;
  for (const def of techDefs) {
    const lv = tech[def.id] || 0;
    if (lv <= 0) continue;
    const fx = def.effect(lv);
    if (fx.coins) state.coins += fx.coins;
    if (fx.workers) { for (let i = 0; i < fx.workers; i++) addWorker(); }
    if (fx.productionLevel) state.productionLevel = Math.min(maxProductionLevel(), state.productionLevel + fx.productionLevel);
    if (fx.critChance) state.critChance += fx.critChance;
    if (fx.damageBonus) state.damageBonus += fx.damageBonus;
    if (fx.lives) { state.gateMax += fx.lives; state.lives = state.gateMax; }
    if (fx.baseIncome) state.baseIncomeLevel += fx.baseIncome;
    if (fx.blastRadius) state.blastRadiusBonus += fx.blastRadius;
  }
}

function applyLegacy() {
  const legacy = state.pendingLegacy;
  const snapshot = state.legacySnapshot;
  if (!legacy || !snapshot) return;
  const def = legacyDefs.find(d => d.id === legacy);
  if (def) {
    def.apply(snapshot);
    addFloater("遗产·" + def.title, ROAD.x + ROAD.w / 2, 200, "#ffe36a");
    announce("遗产生效: " + def.title);
  }
  state.pendingLegacy = null;
  state.legacySnapshot = null;
}

function getTechLevel(id) {
  return state.tech[id] || 0;
}

function upgradeTech(id) {
  const def = techDefs.find(d => d.id === id);
  if (!def) return false;
  const lv = getTechLevel(id);
  if (lv >= def.max) return false;
  const cost = def.cost[lv];
  if (state.prestige < cost) return false;
  state.prestige -= cost;
  state.tech[id] = lv + 1;
  savePrestige(state.prestige);
  saveTech(state.tech);
  return true;
}

function awardPrestige(stage) {
  const points = stage;
  state.prestige += points;
  savePrestige(state.prestige);
  return points;
}

function showLegacyChoice(completedStage) {
  const available = legacyDefs.filter(d => d.eligible());
  if (available.length === 0) {
    showStageClearOverlay(completedStage);
    return;
  }
  const shuffled = available.sort(() => Math.random() - 0.5).slice(0, 3);
  const legacyOverlay = document.getElementById("legacyOverlay");
  const legacyList = document.getElementById("legacyList");
  legacyList.innerHTML = "";
  const snapshots = {};
  for (const def of shuffled) {
    snapshots[def.id] = def.snapshot();
    const btn = document.createElement("button");
    btn.className = "choice-button";
    btn.type = "button";
    btn.innerHTML =
      `<span class="choice-mark">${def.icon}</span>` +
      `<div class="choice-copy"><strong>${def.title}</strong><span>${def.desc()}</span></div>`;
    btn.addEventListener("click", () => {
      state.pendingLegacy = def.id;
      state.legacySnapshot = snapshots[def.id];
      legacyOverlay.hidden = true;
      showStageClearOverlay(completedStage);
      beep(520, 0.08, "triangle", 0.04);
    });
    legacyList.appendChild(btn);
  }
  const skipBtn = document.createElement("button");
  skipBtn.className = "secondary-button";
  skipBtn.type = "button";
  skipBtn.style.marginTop = "12px";
  skipBtn.textContent = "不带遗产";
  skipBtn.addEventListener("click", () => {
    state.pendingLegacy = null;
    state.legacySnapshot = null;
    legacyOverlay.hidden = true;
    showStageClearOverlay(completedStage);
  });
  legacyList.appendChild(skipBtn);
  legacyOverlay.hidden = false;
}

function resetGame() {
  state.endless = false;
  state.endlessWave = 0;
  state.pendingLegacy = null;
  state.legacySnapshot = null;
  startGameAtStage(1);
}

function startGameAtStage(stage) {
  const normalizedStage = Math.min(TOTAL_STAGES, Math.max(1, Math.floor(stage)));
  Object.assign(state, {
    wave: (normalizedStage - 1) * WAVES_PER_STAGE,
    earned: 0,
    kills: 0,
    stageStartEarned: 0,
    stageStartKills: 0
  });
  resetStageState("playing");
  startOverlay.hidden = true;
  pauseOverlay.hidden = true;
  resultOverlay.hidden = true;
  stageOverlay.hidden = true;
  choiceOverlay.hidden = true;
  document.getElementById("legacyOverlay").hidden = true;
  document.getElementById("techOverlay").hidden = true;
  pauseButton.hidden = false;
  saveStageProgress(normalizedStage);
  announce(`第 ${normalizedStage} 关 · 第 1 波准备`);
  beep(320, 0.08, "square", 0.05);
  requestAnimationFrame(loop);
}

function continueSavedGame() {
  startGameAtStage(readSavedStage());
}

function showStageClear(completedStage) {
  saveStageProgress(completedStage + 1);
  const pts = awardPrestige(completedStage);
  state.stageStartEarned = state.earned;
  state.stageStartKills = state.kills;
  state.mode = "legacyChoice";
  pauseButton.hidden = true;
  choiceOverlay.hidden = true;
  announce(`第 ${completedStage} 关完成 · 获得 ${pts} 声望点`);
  beep(523, 0.1, "triangle", 0.05);
  setTimeout(() => beep(659, 0.14, "triangle", 0.05), 110);
  showLegacyChoice(completedStage);
}

function showStageClearOverlay(completedStage) {
  const legacyId = state.pendingLegacy;
  const legacyName = legacyId ? legacyDefs.find(d => d.id === legacyId)?.title : null;
  resetStageState("stageClear");
  document.getElementById("stageEyebrow").textContent = `第 ${completedStage} 关完成 · +${completedStage} 声望`;
  document.getElementById("stageSummary").innerHTML =
    `第 ${completedStage + 1} 关敌人生命、速度与数量提升` +
    (legacyName ? `<br>遗产「${legacyName}」已生效` : `<br>阵地与资源已重置`);
  nextStageButton.textContent = `进入第 ${completedStage + 1} 关`;
  stageOverlay.hidden = false;
}

function startNextStage() {
  if (state.mode !== "stageClear") return;
  saveStageProgress(currentStageNumber());
  state.mode = "playing";
  state.waveTimer = 1.5;
  state.last = performance.now();
  stageOverlay.hidden = true;
  pauseButton.hidden = false;
  announce(`第 ${currentStageNumber()} 关 · 第 1 波准备`);
  requestAnimationFrame(loop);
}

function retryCurrentStage() {
  const stage = currentStageNumber();
  saveStageProgress(stage);
  state.wave = (stage - 1) * WAVES_PER_STAGE;
  state.earned = state.stageStartEarned;
  state.kills = state.stageStartKills;
  resetStageState("playing");
  resultOverlay.hidden = true;
  choiceOverlay.hidden = true;
  stageOverlay.hidden = true;
  pauseButton.hidden = false;
  announce(`重新挑战第 ${stage} 关`);
  beep(320, 0.08, "square", 0.05);
  requestAnimationFrame(loop);
}

continueStageButton.addEventListener("click", retryCurrentStage);

function pauseGame() {
  if (state.mode !== "playing") return;
  state.mode = "paused";
  pauseOverlay.hidden = false;
  pauseButton.hidden = true;
}

function resumeGame() {
  if (state.mode !== "paused") return;
  state.mode = "playing";
  state.last = performance.now();
  pauseOverlay.hidden = true;
  pauseButton.hidden = false;
  requestAnimationFrame(loop);
}

function backToTitle() {
  state.mode = "start";
  pauseOverlay.hidden = true;
  resultOverlay.hidden = true;
  stageOverlay.hidden = true;
  choiceOverlay.hidden = true;
  document.getElementById("legacyOverlay").hidden = true;
  document.getElementById("techOverlay").hidden = true;
  pauseButton.hidden = true;
  startOverlay.hidden = false;
  updateContinueGameButton();
  draw();
}

function activateGunnerSkill(index) {
  if (state.gunnerSkillCharge[index] < 100 || state.gunnerSkillActive[index] > 0) return false;
  if (!gunnerOperational(index) || gunnerSpecialAt(index)) return false;
  state.gunnerSkillCharge[index] = 0;
  state.gunnerSkillActive[index] = 3.0;
  addFloater("弹幕!", GUN_SLOTS[index].x, GUN_SLOTS[index].y - 50, "#ff7048");
  beep(880, 0.06, "triangle", 0.04);
  return true;
}

function activateCannonSkill(index) {
  if (state.cannonSkillCharge[index] < 100 || state.cannonSkillActive[index] > 0) return false;
  if (!cannonOperational(index) || cannonSpecialAt(index)) return false;
  const target = priorityTarget();
  if (!target) {
    addFloater("无目标", CANNON_SLOTS[index].x, CANNON_SLOTS[index].y - 55, "#9ac4a2");
    return false;
  }
  state.cannonSkillCharge[index] = 0;
  state.cannonSkillActive[index] = 0.1;
  const dmgPerTick = (54 + state.cannonLevel * 20) * 0.4 * (1 + state.damageBonus);
  const radius = (48 + state.cannonLevel * 3) * 1.5 * (1 + state.blastRadiusBonus);
  state.fireZones.push({
    x: target.x, y: target.y,
    radius,
    dmg: dmgPerTick,
    duration: 5.0,
    timer: 5.0,
    tickInterval: 0.5,
    tickTimer: 0
  });
  burst(target.x, target.y, "#ff7048", 30, 160);
  addFloater("火海!", CANNON_SLOTS[index].x, CANNON_SLOTS[index].y - 55, "#ff7048");
  beep(150, 0.2, "sawtooth", 0.06);
  return true;
}

function startEndlessMode() {
  state.endless = true;
  state.endlessWave = 0;
  state.wave = TOTAL_WAVES;
  state.waveActive = false;
  state.waveTimer = 2.5;
  state.mode = "playing";
  state.last = performance.now();
  resultOverlay.hidden = true;
  pauseButton.hidden = false;
  announce("无尽模式开启");
  beep(440, 0.1, "triangle", 0.05);
  setTimeout(() => beep(660, 0.12, "triangle", 0.05), 120);
  requestAnimationFrame(loop);
}

function endGame(won) {
  saveStageProgress(won ? TOTAL_STAGES : currentStageNumber());
  if (won && !state.endless) awardPrestige(TOTAL_STAGES);
  state.mode = won ? "won" : "lost";
  pauseButton.hidden = true;
  resultOverlay.hidden = false;
  const isEndless = state.endless;
  const endlessStage = isEndless ? Math.floor(state.endlessWave / WAVES_PER_STAGE) + 1 : 0;
  document.getElementById("resultEyebrow").textContent =
    isEndless ? `无尽模式 · 第 ${endlessStage} 阶段失守`
    : won ? "撤离完成" : `第 ${currentStageNumber()} 关失守`;
  document.getElementById("resultTitle").textContent =
    isEndless ? `坚守了 ${state.endlessWave} 波` : won ? "守住了" : "阵地失守";
  document.getElementById("resultCoins").textContent = state.earned;
  document.getElementById("resultKills").textContent = state.kills;
  const restartButton = document.getElementById("restartButton");
  continueStageButton.hidden = won || isEndless;
  restartButton.textContent = isEndless ? "再来一局" : won ? "再来一局" : "重新开始";
  restartButton.className = won || isEndless ? "primary-button" : "secondary-button";
  let endlessButton = document.getElementById("endlessButton");
  if (!endlessButton && won && !isEndless) {
    endlessButton = document.createElement("button");
    endlessButton.id = "endlessButton";
    endlessButton.className = "secondary-button";
    endlessButton.type = "button";
    endlessButton.textContent = "无尽模式";
    endlessButton.addEventListener("click", startEndlessMode);
    restartButton.parentNode.insertBefore(endlessButton, restartButton.nextSibling);
  }
  if (endlessButton) endlessButton.hidden = !(won && !isEndless);
  const rank = isEndless
    ? state.endlessWave >= 40 ? "SS" : state.endlessWave >= 20 ? "S" : state.endlessWave >= 10 ? "A" : "B"
    : won
      ? state.lives >= 5 ? "S" : state.lives >= 3 ? "A" : "B"
      : state.wave >= 4 ? "C" : "D";
  document.getElementById("resultRank").textContent = rank;
  state.bestWave = Math.max(state.bestWave, state.wave + (won ? 1 : 0));
  localStorage.setItem(BEST_WAVE_KEY(), String(state.bestWave));
  if (won || isEndless) {
    beep(523, 0.1, "triangle", 0.05);
    setTimeout(() => beep(659, 0.12, "triangle", 0.05), 100);
    setTimeout(() => beep(784, 0.2, "triangle", 0.05), 220);
  } else {
    beep(130, 0.35, "sawtooth", 0.06);
  }
}
