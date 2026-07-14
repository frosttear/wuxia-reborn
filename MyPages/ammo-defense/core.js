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
const MAX_PRODUCTION_LEVEL = 20;
const MAX_GUNNER_LEVEL = 20;
const MAX_CANNON_LEVEL = 20;
const MAX_DAMAGE_BONUS = 1.2;
const TOTAL_STAGES = 10;
const WAVES_PER_STAGE = 10;
const TOTAL_WAVES = TOTAL_STAGES * WAVES_PER_STAGE;
const STAGE_PROGRESS_KEY = "ammo-defense-stage-progress";

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
  pendingChoices: [],
  choiceRefreshes: 0,
  stageStartEarned: 0,
  stageStartKills: 0,
  savedStage: readSavedStage(),
  bestWave: Number(localStorage.getItem("mining-defense-best") || 0),
  endless: false,
  endlessWave: 0,
  synergyCounts: { fire: 0, armor: 0, speed: 0, economy: 0 },
  activeSynergies: [],
  tipShown: { armor: false, shield: false }
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
      hp: Math.round(5100 * Math.pow(1.38, stageTier)),
      speed: Math.min(32, 15 + stageTier * 1.65),
      reward: Math.round(420 + stageTier * 240),
      shield: Math.round(650 * Math.pow(1.35, stageTier)),
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
    hp: Math.round(52 * Math.pow(1.16, stageWave - 1) * Math.pow(1.24, stageTier)),
    speed: Math.min(50, 22.75 + (stageWave - 1) * 1.15 + stageTier * 1.8),
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
  const saved = Number(localStorage.getItem(STAGE_PROGRESS_KEY));
  if (!Number.isFinite(saved)) return 1;
  return Math.min(TOTAL_STAGES, Math.max(1, Math.floor(saved)));
}

function updateContinueGameButton() {
  const savedStage = readSavedStage();
  state.savedStage = savedStage;
  continueGameButton.hidden = savedStage <= 1;
  continueGameButton.textContent = `继续第 ${savedStage} 关`;
}

function saveStageProgress(stage) {
  const normalized = Math.min(TOTAL_STAGES, Math.max(1, Math.floor(stage)));
  const savedStage = Math.max(readSavedStage(), normalized);
  localStorage.setItem(STAGE_PROGRESS_KEY, String(savedStage));
  state.savedStage = savedStage;
  updateContinueGameButton();
  return savedStage;
}

function baseCoinAmount() {
  return 5 + (state.baseIncomeLevel - 1) * 3;
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
    maxed: () => state.productionLevel >= MAX_PRODUCTION_LEVEL,
    action: () => {
      state.productionLevel = Math.min(MAX_PRODUCTION_LEVEL, state.productionLevel + 1);
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
      : state.gunnerLevel >= MAX_GUNNER_LEVEL ? "强化 MAX" : `强化 LV.${state.gunnerLevel}`,
    buttonLabel: () => state.gunnerCount < 3
      ? "添加"
      : state.gunnerLevel >= MAX_GUNNER_LEVEL ? "已满" : "强化",
    maxed: () => state.gunnerCount >= 3 && state.gunnerLevel >= MAX_GUNNER_LEVEL,
    action: () => {
      if (state.gunnerCount < 3) addGunner();
      else state.gunnerLevel = Math.min(MAX_GUNNER_LEVEL, state.gunnerLevel + 1);
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
        : state.cannonLevel >= MAX_CANNON_LEVEL ? "强化 MAX" : `强化 LV.${state.cannonLevel}`,
      buttonLabel: () => state.cannonCount < 3
        ? "添加"
        : state.cannonLevel >= MAX_CANNON_LEVEL ? "已满" : "强化",
      maxed: () => state.cannonCount >= 3 && state.cannonLevel >= MAX_CANNON_LEVEL,
      action: () => {
        if (state.cannonCount < 3) addCannon();
        else state.cannonLevel = Math.min(MAX_CANNON_LEVEL, state.cannonLevel + 1);
      }
  },
  {
    key: "porter",
    label: "搬运工+1",
    color: "#65d18a",
    cost: () => 90 + state.porterLevel * 110,
    level: () => state.porterLevel,
    maxed: () => state.porterLevel >= 6,
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
      desc: "产线可能掉落穿甲弹，对装甲目标伤害大幅提高",
      eligible: () => !state.unlocks.ap,
      apply: () => { state.unlocks.ap = true; }
    },
    {
      id: "ice",
      mark: "ICE",
      title: "冰冻弹",
      desc: "命中后降低敌人速度，适合拦截快速怪",
      eligible: () => !state.unlocks.ice,
      apply: () => { state.unlocks.ice = true; }
    },
    {
      id: "fire",
      mark: "F",
      title: "燃烧炮弹",
      desc: "爆炸后造成持续范围伤害",
      eligible: () => !state.unlocks.fire,
      apply: () => { state.unlocks.fire = true; }
    },
    {
      id: "he",
      mark: "HE",
      title: "高爆炮弹",
      desc: "爆炸范围更大，并将敌人向后击退",
      eligible: () => !state.unlocks.he,
      apply: () => { state.unlocks.he = true; }
    },
    {
      id: "machine",
      mark: "MG",
      title: "机枪阵地",
      desc: "按 1→2→3 顺序改装下一名枪手，持续压制小怪",
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
      desc: "按 1→2→3 顺序改装下一名枪手，优先攻击重甲目标",
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
      desc: "按 1→2→3 顺序改装下一座炮台，自动进行范围炮击",
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
      desc: "所有搬运工移动速度提高",
      eligible: () => state.roleLevels.porter < 5,
      apply: () => { state.roleLevels.porter++; }
    },
    {
      id: "loaderRole",
      mark: "装",
      title: "装填专精",
      desc: "提高单次子弹搬运量，装填工高等级获得额外容量",
      eligible: () => state.roleLevels.loader < 5,
      apply: () => { state.roleLevels.loader++; }
    },
    {
      id: "dispatcherRole",
      mark: "调",
      title: "调度专精",
      desc: "工人更准确地优先补充紧缺武器",
      eligible: () => state.roleLevels.dispatcher < 5,
      apply: () => { state.roleLevels.dispatcher++; }
    },
    {
      id: "mechanicRole",
      mark: "修",
      title: "维修专精",
      desc: "产线维修时间减少 0.4 秒，最低缩短至 1.4 秒",
      eligible: () => state.roleLevels.mechanic < 5,
      apply: () => { state.roleLevels.mechanic++; }
    },
    {
      id: "gunnerCapacity",
      mark: "匣",
      title: "弹匣扩容",
      desc: "每名枪手的装弹上限增加 1",
      eligible: () => state.gunnerMagCapacity < 8,
      apply: () => { state.gunnerMagCapacity++; }
    },
    {
      id: "cannonCapacity",
      mark: "仓",
      title: "炮舱扩容",
      desc: "每座炮台的装弹上限增加 1",
      eligible: () => state.cannonMagCapacity < 4,
      apply: () => { state.cannonMagCapacity++; }
    },
    {
      id: "critical",
      mark: "准",
      title: "暴击训练",
      desc: "所有武器增加 8% 暴击率，暴击造成 175% 伤害",
      eligible: () => state.critChance < 0.32,
      apply: () => { state.critChance += 0.08; }
    },
    {
      id: "beltSpeed",
      mark: "带",
      title: "高速履带",
      desc: "传送带运输速度提高 15%",
      eligible: () => state.beltSpeedBonus < 0.6,
      apply: () => { state.beltSpeedBonus += 0.15; }
    },
    {
      id: "blastRadius",
      mark: "爆",
      title: "广域引信",
      desc: "炮弹爆炸范围提高 15%",
      eligible: () => state.blastRadiusBonus < 0.6,
      apply: () => { state.blastRadiusBonus += 0.15; }
    },
    {
      id: "ammoEfficiency",
      mark: "省",
      title: "节约供弹",
      desc: "开火时有 8% 概率不消耗弹药",
      eligible: () => state.ammoEfficiency < 0.32,
      apply: () => { state.ammoEfficiency += 0.08; }
    },
    {
      id: "bounty",
      mark: "赏",
      title: "战地赏金",
      desc: "击杀敌人获得的金币提高 15%",
      eligible: () => state.killCoinBonus < 0.6,
      apply: () => { state.killCoinBonus += 0.15; }
    },
    {
      id: "baseIncome",
      mark: "基",
      title: "基地经济",
      desc: "基地每 5 秒产出的金币增加 3",
      eligible: () => state.baseIncomeLevel < MAX_BASE_INCOME_LEVEL,
      apply: () => { state.baseIncomeLevel++; }
    },
    {
      id: "waveRepair",
      mark: "补",
      title: "维修补给",
      desc: "火力点维修完成时额外补充 1 发对应弹药",
      eligible: () => state.waveRepair < 3,
      apply: () => { state.waveRepair++; }
    },
    {
      id: "productionTune",
      mark: "产",
      title: "产线调校",
      desc: "产线等级提高 1，增加弹药产出效率",
      eligible: () => state.productionLevel < MAX_PRODUCTION_LEVEL,
      apply: () => {
        state.productionLevel = Math.min(MAX_PRODUCTION_LEVEL, state.productionLevel + 1);
      }
    },
    {
      id: "arsenalTraining",
      mark: "训",
      title: "全员训练",
      desc: "枪手和炮台强化等级同时提高 1",
      eligible: () => state.gunnerLevel < MAX_GUNNER_LEVEL || state.cannonLevel < MAX_CANNON_LEVEL,
      apply: () => {
        state.gunnerLevel = Math.min(MAX_GUNNER_LEVEL, state.gunnerLevel + 1);
        state.cannonLevel = Math.min(MAX_CANNON_LEVEL, state.cannonLevel + 1);
      }
    },
    {
      id: "damage",
      mark: "+",
      title: "火力校准",
      desc: "所有武器伤害提高 12%",
      eligible: () => state.damageBonus < MAX_DAMAGE_BONUS - 0.001,
      apply: () => {
        state.damageBonus = Math.min(MAX_DAMAGE_BONUS, state.damageBonus + 0.12);
      }
    },
    {
      id: "coinCache",
      mark: "金",
      title: "战地金库",
      desc: "立即获得一批随关卡提高的金币",
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
      desc: "立即补充子弹与炮弹库存",
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
      desc: "基地恢复 2 点生命；满生命时改为获得 100 金币",
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
  { tag: "fire", threshold: 6, name: "焚天", desc: "燃烧弹持续时间+50%", effect: () => {} },
  { tag: "armor", threshold: 3, name: "钢铁壁垒", desc: "城墙+1上限", effect: () => { state.gateMax++; state.lives = Math.min(state.gateMax, state.lives + 1); } },
  { tag: "armor", threshold: 6, name: "铜墙铁壁", desc: "火力点耐久维修速度提高", effect: () => {} },
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
    const tagHtml = tag ? `<span class="choice-tag">${tagLabel} ${tagCount}/3</span>` : "";
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
    pendingChoices: [],
    choiceRefreshes: 0,
    synergyCounts: { fire: 0, armor: 0, speed: 0, economy: 0 },
    activeSynergies: [],
    tipShown: { armor: false, shield: false }
  });
  addWorker();
}

function resetGame() {
  state.endless = false;
  state.endlessWave = 0;
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
  state.stageStartEarned = state.earned;
  state.stageStartKills = state.kills;
  resetStageState("stageClear");
  pauseButton.hidden = true;
  choiceOverlay.hidden = true;
  document.getElementById("stageEyebrow").textContent = `第 ${completedStage} 关完成`;
  document.getElementById("stageSummary").innerHTML =
    `第 ${completedStage + 1} 关敌人生命、速度与数量提升<br>阵地、金币、弹药和强化已全部重置`;
  nextStageButton.textContent = `进入第 ${completedStage + 1} 关`;
  stageOverlay.hidden = false;
  announce(`第 ${completedStage} 关完成`);
  beep(523, 0.1, "triangle", 0.05);
  setTimeout(() => beep(659, 0.14, "triangle", 0.05), 110);
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
  localStorage.setItem("mining-defense-best", String(state.bestWave));
  if (won || isEndless) {
    beep(523, 0.1, "triangle", 0.05);
    setTimeout(() => beep(659, 0.12, "triangle", 0.05), 100);
    setTimeout(() => beep(784, 0.2, "triangle", 0.05), 220);
  } else {
    beep(130, 0.35, "sawtooth", 0.06);
  }
}
