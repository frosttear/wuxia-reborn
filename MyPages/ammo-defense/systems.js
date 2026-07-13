"use strict";

function addWorker() {
  if (state.porterLevel >= 6) return;
  const index = state.porterLevel;
  const roles = ["porter", "loader", "dispatcher", "mechanic"];
  const role = roles[index % roles.length];
  state.porterLevel++;
  state.workers.push({
    index,
    role,
    x: PICKUP_X - (index % 2) * 9,
    y: 606 + (index % 3) * 13,
    homeX: PICKUP_X - (index % 2) * 9,
    homeY: 606 + (index % 3) * 13,
    state: "idle",
    carrying: null,
    targetGunner: null,
    targetCannon: null,
    targetDefense: null,
    repairDuration: 0,
    wait: index * 0.18,
    step: rand(0, Math.PI * 2)
  });
}

function addGunner() {
  if (state.gunnerCount >= 3) return;
  state.gunnerCount++;
  state.gunTimers.push(0);
  state.gunnerAimAngles.push(0);
  state.gunnerMagazines.push({ bullet: 0, ap: 0, ice: 0 });
  state.gunnerHealth.push(DEFENSE_MAX_HP);
  state.gunnerRepairWave.push(Infinity);
  const slot = GUN_SLOTS[state.gunnerCount - 1];
  addFloater(`枪手 ${state.gunnerCount}/3`, slot.x, slot.y - 48, "#ee6d55");
}

function addCannon() {
  if (state.cannonCount >= 3) return;
  state.cannonCount++;
  state.cannonTimers.push(0);
  state.cannonAimAngles.push(0);
  state.cannonMagazines.push({ shell: 0, fire: 0, he: 0 });
  state.cannonHealth.push(DEFENSE_MAX_HP);
  state.cannonRepairWave.push(Infinity);
  const slot = CANNON_SLOTS[state.cannonCount - 1];
  addFloater(`炮台 ${state.cannonCount}/3`, slot.x, slot.y - 48, "#ff9d43");
}

function spawnAmmo() {
  const baseShellChance = state.priority === "shell" ? 0.72
    : state.priority === "bullet" ? 0.16
    : clamp(0.28 + state.cannonCount * 0.04 + state.cannonLevel * 0.015, 0.32, 0.48);
  const family = Math.random() < baseShellChance ? "shell" : "bullet";
  const special = family === "bullet"
    ? ["ap", "ice"].filter(key => state.unlocks[key])
    : ["fire", "he"].filter(key => state.unlocks[key]);
  const kind = special.length > 0 && Math.random() < 0.24
    ? special[Math.floor(Math.random() * special.length)]
    : family;
  const isShell = ammoMeta[kind].family === "shell";
  const lane = rand(0.12, 0.88);
  state.ammoDrops.push({
    x: beltPointForLane(PLAY_TOP, lane),
    y: PLAY_TOP - 18,
    lane,
    kind,
    r: isShell ? 12 : 10,
    spin: rand(-0.16, 0.16),
    pulse: rand(0, Math.PI * 2)
  });
}

function spawnEnemy(forcedType = null, countSpawn = true) {
  const wave = waveBook[state.wave];
  let type = forcedType || wave.type;
  if (type === "mixed") {
    const difficulty = state.wave / Math.max(1, waveBook.length - 1);
    const roll = Math.random();
    const tankChance = 0.12 + difficulty * 0.18;
    const saboteurChance = 0.12 + difficulty * 0.08;
    const runnerChance = 0.18 + difficulty * 0.08;
    type = roll < tankChance ? "tank"
      : roll < tankChance + saboteurChance ? "saboteur"
      : roll < tankChance + saboteurChance + runnerChance ? "runner"
      : "grunt";
  }

  const scale = type === "boss" ? 1.55 : type === "tank" ? 1.18 : type === "runner" ? 0.82 : type === "saboteur" ? 0.92 : 1;
  const hpMultiplier = type === "tank" ? 1.75 : type === "runner" ? 0.72 : type === "saboteur" ? 0.9 : 1;
  const speedMultiplier = type === "tank" ? 0.68 : type === "runner" ? 1.48 : type === "saboteur" ? 1.16 : 1;
  const baseHp = forcedType ? 82 + state.wave * 18 : wave.hp;
  const hp = baseHp * hpMultiplier;
  const lane = type === "boss" ? 0.55 : rand(0.08, 0.92);

  state.enemies.push({
    x: roadPointForLane(ENEMY_SPAWN_Y, lane),
    y: ENEMY_SPAWN_Y,
    lane,
    type,
    scale,
    hp,
    maxHp: hp,
    speed: wave.speed * speedMultiplier,
    reward: Math.round((forcedType ? 22 : wave.reward) * hpMultiplier),
    phase: rand(0, Math.PI * 2),
    hit: 0,
    armor: type === "tank" || type === "boss",
    slow: 0,
    burn: 0,
    burnTimer: 0,
    sabotageDone: false,
    shield: type === "boss" ? (wave.shield || 360) : 0,
    maxShield: type === "boss" ? (wave.shield || 360) : 0,
    bossTimer: type === "boss" ? 4.5 : 0,
    bossPhase: 0,
    movement: "advancing",
    attackTimer: rand(0.35, 0.65),
    attackFlash: 0,
    attackTarget: null,
    defenseBias: Math.random() < 0.5 ? "gunner" : "cannon",
    homeOffset: rand(-34, 34),
    defenseSide: Math.random() < 0.5 ? -1 : 1,
    defenseSpacing: rand(24, 34)
  });
  if (countSpawn) state.spawned++;
}

function spawnProjectile(ammoType, target, weapon = "gun") {
  const family = ammoMeta[ammoType].family;
  const gunIndex = weapon.startsWith("gun-") ? Number(weapon.split("-")[1]) : -1;
  const cannonIndex = weapon.startsWith("cannon-") ? Number(weapon.split("-")[1]) : -1;
  const mortarIndex = weapon.startsWith("mortar-") ? Number(weapon.split("-")[1]) : -1;
  const machineIndex = state.specialSlots.machine;
  const sniperIndex = state.specialSlots.sniper;
  const origin = weapon === "machine" && Number.isInteger(machineIndex) ? GUN_SLOTS[machineIndex]
    : weapon === "sniper" && Number.isInteger(sniperIndex) ? GUN_SLOTS[sniperIndex]
    : gunIndex >= 0 ? GUN_SLOTS[gunIndex]
    : mortarIndex >= 0 ? CANNON_SLOTS[mortarIndex]
    : cannonIndex >= 0 ? CANNON_SLOTS[cannonIndex]
    : family === "shell" ? CANNON
    : GUN;
  const gunnerMultiplier = 1 + (state.gunnerLevel - 1) * 0.1;
  const baseDamage = weapon === "machine" ? (8 + state.productionLevel) * gunnerMultiplier
    : weapon === "sniper" ? (48 + state.productionLevel * 4) * gunnerMultiplier
    : mortarIndex >= 0 ? 44 + state.cannonLevel * 12
    : family === "shell" ? 54 + state.cannonLevel * 20
    : 13 + state.productionLevel * 2 + state.gunnerLevel * 3;
  const critical = Math.random() < state.critChance;
  const damage = baseDamage * (critical ? 1.75 : 1);
  const muzzleHeight = family === "shell" ? 34 : 28;
  const aimRotation = aimAngleForTarget(origin, target);
  const barrelLength = weapon === "machine" ? 41
    : weapon === "sniper" ? 43
    : mortarIndex >= 0 ? 36
    : family === "shell" ? 44
    : 36;
  const muzzleOffsetX = weapon === "machine" ? 4.5
    : weapon === "sniper" || gunIndex >= 0 ? 7
    : 0;
  const startX = origin.x +
    muzzleOffsetX * Math.cos(aimRotation) +
    barrelLength * Math.sin(aimRotation);
  const muzzleScreenY = origin.y +
    muzzleOffsetX * Math.sin(aimRotation) -
    barrelLength * Math.cos(aimRotation);
  const startY = muzzleScreenY + muzzleHeight;
  const dx = target.x - startX;
  const dy = target.y - startY;
  const length = Math.hypot(dx, dy) || 1;
  const speed = family === "shell" ? 350 : weapon === "sniper" ? 720 : 560;
  const isMortar = mortarIndex >= 0;
  state.projectiles.push({
    kind: family,
    ammoType,
    weapon,
    targetX: target.x,
    targetY: target.y,
    x: startX,
    y: startY,
    vx: dx / length * speed,
    vy: dy / length * speed,
    renderAngle: aimRotation,
    speed,
    damage,
    critical,
    criticalShown: false,
    r: family === "shell" ? 7 : weapon === "sniper" ? 4.5 : 3.5,
    travelled: 0,
    initialDistance: length,
    progress: 0,
    muzzleHeight,
    arcHeight: family === "shell" ? (isMortar ? 104 : 72) : 0,
    height: family === "shell" ? 34 : 28
  });
  burst(startX, muzzleScreenY, ammoMeta[ammoType].color, family === "shell" ? 9 : 3, 70);
  beep(family === "shell" ? 118 : weapon === "sniper" ? 210 : 310, family === "shell" ? 0.1 : 0.025, "square", family === "shell" ? 0.055 : 0.018);
}

function burst(x, y, color, count, speed = 80) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * rand(speed * 0.35, speed),
      vy: Math.sin(angle) * rand(speed * 0.35, speed),
      life: rand(0.25, 0.55),
      maxLife: 0.55,
      size: rand(2, 5),
      color
    });
  }
}

function addFloater(value, x, y, color = "#fff4c5") {
  state.floaters.push({ value, x, y, life: 0.8, color });
}

function storeAmmo(ammo) {
  state.ammoStock[ammo.kind]++;
  const meta = ammoMeta[ammo.kind];
  const color = meta.color;
  burst(ammo.x, DEPOT.y - 25, color, 7, 90);
  addFloater(`${meta.label} +1`, DEPOT.x, DEPOT.y - 42, color);
  beep(meta.family === "shell" ? 460 : 560, 0.04, "triangle", 0.025);
}

function stockTotal(family) {
  return Object.entries(state.ammoStock)
    .filter(([key]) => ammoMeta[key].family === family)
    .reduce((sum, [, value]) => sum + value, 0);
}

function bulletLoadAmount(worker) {
  const loaderLevel = state.roleLevels.loader - 1;
  const specialistBonus = worker.role === "loader" ? Math.floor(loaderLevel / 2) : 0;
  return 2 + loaderLevel + specialistBonus;
}

function reservedBulletsForGunner(index, excludedWorker = null) {
  return state.workers.reduce((sum, worker) => {
    if (worker === excludedWorker || worker.state !== "delivering" || worker.targetGunner !== index || !worker.carrying) {
      return sum;
    }
    if (ammoMeta[worker.carrying].family !== "bullet") return sum;
    return sum + bulletLoadAmount(worker);
  }, 0);
}

function findGunnerLoadTarget(worker = null) {
  let bestIndex = null;
  let bestFill = Infinity;
  for (let index = 0; index < state.gunnerCount; index++) {
    if (!gunnerOperational(index)) continue;
    const effectiveFill = gunnerAmmoCount(index) + reservedBulletsForGunner(index, worker);
    if (effectiveFill < state.gunnerMagCapacity && effectiveFill < bestFill) {
      bestFill = effectiveFill;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function totalReservedBullets() {
  return state.workers.reduce((sum, worker) => {
    if (worker.state !== "delivering" || !worker.carrying || ammoMeta[worker.carrying].family !== "bullet") {
      return sum;
    }
    return sum + bulletLoadAmount(worker);
  }, 0);
}

function shellLoadAmount(worker) {
  const loaderBonus = state.roleLevels.loader - 1 + (worker.role === "loader" ? 2 : 0);
  return 1 + Math.floor((state.productionLevel - 1) / 3) + Math.floor(loaderBonus / 2);
}

function reservedShellsForCannon(index, excludedWorker = null) {
  return state.workers.reduce((sum, worker) => {
    if (worker === excludedWorker || worker.state !== "delivering" || worker.targetCannon !== index || !worker.carrying) {
      return sum;
    }
    if (ammoMeta[worker.carrying].family !== "shell") return sum;
    return sum + shellLoadAmount(worker);
  }, 0);
}

function findCannonLoadTarget(worker = null) {
  let bestIndex = null;
  let bestFill = Infinity;
  for (let index = 0; index < state.cannonCount; index++) {
    if (!cannonOperational(index)) continue;
    const effectiveFill = cannonAmmoCount(index) + reservedShellsForCannon(index, worker);
    if (effectiveFill < state.cannonMagCapacity && effectiveFill < bestFill) {
      bestFill = effectiveFill;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function totalReservedShells() {
  return state.workers.reduce((sum, worker) => {
    if (worker.state !== "delivering" || !worker.carrying || ammoMeta[worker.carrying].family !== "shell") {
      return sum;
    }
    return sum + shellLoadAmount(worker);
  }, 0);
}

function chooseCargo(worker) {
  const activeGunners = state.gunnerHealth
    .slice(0, state.gunnerCount)
    .filter(health => health > 0).length;
  const activeCannons = state.cannonHealth
    .slice(0, state.cannonCount)
    .filter(health => health > 0).length;
  const bulletCap = activeGunners * state.gunnerMagCapacity;
  const shellCap = activeCannons * state.cannonMagCapacity;
  const bulletRatio = bulletCap > 0
    ? (totalAmmo("bullet") + totalReservedBullets()) / bulletCap
    : Infinity;
  const shellRatio = shellCap > 0
    ? (totalAmmo("shell") + totalReservedShells()) / shellCap
    : Infinity;
  const bulletAvailable = stockTotal("bullet") > 0 && findGunnerLoadTarget(worker) !== null;
  const shellAvailable = stockTotal("shell") > 0 && findCannonLoadTarget(worker) !== null;
  let family = null;

  if (bulletAvailable && bulletRatio < 1 && shellAvailable && shellRatio < 1) {
    const dispatcherBias = 0.12 * state.roleLevels.dispatcher;
    family = bulletRatio + dispatcherBias < shellRatio ? "bullet" : "shell";
  } else if (bulletAvailable && bulletRatio < 1) {
    family = "bullet";
  } else if (shellAvailable && shellRatio < 1) {
    family = "shell";
  }
  if (!family) return null;

  const order = family === "bullet" ? ["ap", "ice", "bullet"] : ["he", "fire", "shell"];
  return order.find(type => state.ammoStock[type] > 0) || null;
}

function defenseHealth(target) {
  if (target.kind === "wall") return state.wallHealth;
  return target.kind === "gunner"
    ? state.gunnerHealth[target.index]
    : state.cannonHealth[target.index];
}

function defenseMaxHealth(target) {
  return target.kind === "wall" ? WALL_MAX_HP : DEFENSE_MAX_HP;
}

function defenseRepairWave(target) {
  if (target.kind === "wall") return state.wallRepairWave;
  return target.kind === "gunner"
    ? state.gunnerRepairWave[target.index]
    : state.cannonRepairWave[target.index];
}

function defensePosition(target) {
  if (target.kind === "wall") return { x: ROAD.x + ROAD.w / 2, y: GATE_Y };
  return target.kind === "gunner"
    ? GUN_SLOTS[target.index]
    : CANNON_SLOTS[target.index];
}

function setDefenseHealth(target, health) {
  if (target.kind === "wall") state.wallHealth = health;
  else if (target.kind === "gunner") state.gunnerHealth[target.index] = health;
  else state.cannonHealth[target.index] = health;
}

function setDefenseRepairWave(target, wave) {
  if (target.kind === "wall") state.wallRepairWave = wave;
  else if (target.kind === "gunner") state.gunnerRepairWave[target.index] = wave;
  else state.cannonRepairWave[target.index] = wave;
}

function defenseTargetKey(target) {
  return `${target.kind}-${target.index}`;
}

function repairableDefenses() {
  const targets = [];
  const wallTarget = { kind: "wall", index: 0 };
  if (state.wallHealth < WALL_MAX_HP && state.wave >= state.wallRepairWave) {
    targets.push(wallTarget);
  }
  for (let index = 0; index < state.gunnerCount; index++) {
    const target = { kind: "gunner", index };
    if (defenseHealth(target) < DEFENSE_MAX_HP && state.wave >= defenseRepairWave(target)) {
      targets.push(target);
    }
  }
  for (let index = 0; index < state.cannonCount; index++) {
    const target = { kind: "cannon", index };
    if (defenseHealth(target) < DEFENSE_MAX_HP && state.wave >= defenseRepairWave(target)) {
      targets.push(target);
    }
  }
  return targets.sort((a, b) => {
    if (a.kind === "wall") return -1;
    if (b.kind === "wall") return 1;
    return defenseHealth(a) - defenseHealth(b);
  });
}

function findRepairTarget(worker = null) {
  const reserved = new Set(state.workers
    .filter(candidate =>
      candidate !== worker &&
      candidate.targetDefense &&
      (candidate.state === "toRepair" || candidate.state === "repairing"))
    .map(candidate => defenseTargetKey(candidate.targetDefense)));
  return repairableDefenses().find(target => !reserved.has(defenseTargetKey(target))) || null;
}

function beltRepairDuration() {
  return Math.max(1.4, BELT_REPAIR_BASE_DURATION - (state.roleLevels.mechanic - 1) * 0.4);
}

function activeBeltRepairWorker() {
  return state.workers.find(worker =>
    worker.state === "toBeltRepair" || worker.state === "repairingBelt"
  ) || null;
}

function assignBeltRepairWorker() {
  if (state.beltEvent !== "jam" || activeBeltRepairWorker() || state.workers.length === 0) return;
  const worker = [...state.workers].sort((a, b) => {
    const roleDifference = Number(b.role === "mechanic") - Number(a.role === "mechanic");
    if (roleDifference !== 0) return roleDifference;
    const availableStates = new Set(["idle", "returning", "unloading"]);
    return Number(availableStates.has(b.state)) - Number(availableStates.has(a.state));
  })[0];
  if (worker.carrying) state.ammoStock[worker.carrying]++;
  worker.carrying = null;
  worker.targetGunner = null;
  worker.targetCannon = null;
  worker.targetDefense = null;
  worker.repairDuration = 0;
  worker.state = "toBeltRepair";
  worker.wait = 0;
}

function returnWorkerHome(worker) {
  worker.carrying = null;
  worker.targetGunner = null;
  worker.targetCannon = null;
  worker.targetDefense = null;
  worker.repairDuration = 0;
  worker.state = "returning";
}

function updateWorkers(dt) {
  assignBeltRepairWorker();
  for (const worker of state.workers) {
    worker.step += dt * 9;
    worker.wait -= dt;
    const roleSpeed = worker.role === "porter"
      ? 1.28 + (state.roleLevels.porter - 1) * 0.14
      : 1 + (state.roleLevels.porter - 1) * 0.05;
    const speed = (64 + state.porterLevel * 7) * roleSpeed;

    if (worker.state === "toBeltRepair") {
      if (state.beltEvent !== "jam") {
        returnWorkerHome(worker);
        continue;
      }
      const dx = BELT_REPAIR_POINT.x - worker.x;
      const dy = BELT_REPAIR_POINT.y - worker.y;
      const distance = Math.hypot(dx, dy);
      const movement = Math.min(distance, speed * dt);
      if (distance > 0) {
        worker.x += dx / distance * movement;
        worker.y += dy / distance * movement;
      }
      if (distance < 3) {
        worker.x = BELT_REPAIR_POINT.x;
        worker.y = BELT_REPAIR_POINT.y;
        worker.state = "repairingBelt";
        worker.repairDuration = beltRepairDuration();
        worker.wait = worker.repairDuration;
      }
    } else if (worker.state === "repairingBelt") {
      if (state.beltEvent !== "jam") {
        returnWorkerHome(worker);
        continue;
      }
      if (worker.wait <= 0) {
        state.beltEvent = null;
        state.eventDuration = 0;
        burst(BELT_REPAIR_POINT.x, BELT_REPAIR_POINT.y, "#65d18a", 14, 80);
        addFloater("产线维修完成", BELT.x + BELT.w / 2, 540, "#65d18a");
        beep(520, 0.09, "triangle", 0.03);
        returnWorkerHome(worker);
      }
    } else if (worker.state === "idle" && worker.wait <= 0) {
      const repairTarget = findRepairTarget(worker);
      if (repairTarget) {
        worker.targetDefense = repairTarget;
        worker.state = "toRepair";
        worker.wait = 0;
        continue;
      }
      const cargo = chooseCargo(worker);
      if (cargo) {
        const family = ammoMeta[cargo].family;
        const targetGunner = family === "bullet" ? findGunnerLoadTarget(worker) : null;
        const targetCannon = family === "shell" ? findCannonLoadTarget(worker) : null;
        if ((family === "bullet" && targetGunner === null) ||
            (family === "shell" && targetCannon === null)) {
          worker.wait = 0.2;
          continue;
        }
        state.ammoStock[cargo]--;
        worker.carrying = cargo;
        worker.targetGunner = targetGunner;
        worker.targetCannon = targetCannon;
        worker.state = "delivering";
      } else {
        worker.wait = 0.2;
      }
    } else if (worker.state === "delivering") {
      const family = ammoMeta[worker.carrying].family;
      if (family === "bullet" &&
          (worker.targetGunner === null || worker.targetGunner >= state.gunnerCount ||
           !gunnerOperational(worker.targetGunner) ||
           gunnerAmmoCount(worker.targetGunner) >= state.gunnerMagCapacity)) {
        worker.targetGunner = findGunnerLoadTarget(worker);
        if (worker.targetGunner === null) {
          state.ammoStock[worker.carrying]++;
          returnWorkerHome(worker);
          continue;
        }
      }
      if (family === "shell" &&
          (worker.targetCannon === null || worker.targetCannon >= state.cannonCount ||
           !cannonOperational(worker.targetCannon) ||
           cannonAmmoCount(worker.targetCannon) >= state.cannonMagCapacity)) {
        worker.targetCannon = findCannonLoadTarget(worker);
        if (worker.targetCannon === null) {
          state.ammoStock[worker.carrying]++;
          returnWorkerHome(worker);
          continue;
        }
      }
      const target = family === "shell"
        ? CANNON_SLOTS[worker.targetCannon]
        : GUN_SLOTS[worker.targetGunner];
      const targetX = target.x - 25;
      const targetY = target.y + 8 + (worker.index % 2) * 8;
      const dx = targetX - worker.x;
      worker.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      worker.y += (targetY - worker.y) * Math.min(1, dt * 7);
      if (Math.abs(dx) < 3) {
        if (family === "shell") {
          const magazine = state.cannonMagazines[worker.targetCannon];
          const load = Math.min(
            shellLoadAmount(worker),
            state.cannonMagCapacity - cannonAmmoCount(worker.targetCannon)
          );
          if (load > 0) magazine[worker.carrying] += load;
          else state.ammoStock[worker.carrying]++;
          const slot = CANNON_SLOTS[worker.targetCannon];
          addFloater(
            `装填 ${cannonAmmoCount(worker.targetCannon)}/${state.cannonMagCapacity}`,
            slot.x,
            slot.y - 48,
            "#c47bff"
          );
        } else {
          const magazine = state.gunnerMagazines[worker.targetGunner];
          const load = Math.min(
            bulletLoadAmount(worker),
            state.gunnerMagCapacity - gunnerAmmoCount(worker.targetGunner)
          );
          if (load > 0) magazine[worker.carrying] += load;
          else state.ammoStock[worker.carrying]++;
          const slot = GUN_SLOTS[worker.targetGunner];
          addFloater(
            `装填 ${gunnerAmmoCount(worker.targetGunner)}/${state.gunnerMagCapacity}`,
            slot.x,
            slot.y - 48,
            "#ffc43d"
          );
        }
        beep(family === "shell" ? 360 : 620, 0.055, "triangle", 0.025);
        worker.carrying = null;
        worker.targetGunner = null;
        worker.targetCannon = null;
        worker.targetDefense = null;
        worker.state = "unloading";
        worker.wait = 0.22;
      }
    } else if (worker.state === "toRepair") {
      const target = worker.targetDefense;
      if (!target || defenseHealth(target) >= defenseMaxHealth(target) ||
          state.wave < defenseRepairWave(target)) {
        returnWorkerHome(worker);
        continue;
      }
      const position = defensePosition(target);
      const targetX = position.x - 27;
      const targetY = position.y + 10 + (worker.index % 2) * 7;
      const dx = targetX - worker.x;
      worker.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      worker.y += (targetY - worker.y) * Math.min(1, dt * 7);
      if (Math.abs(dx) < 3) {
        worker.state = "repairing";
        worker.wait = DEFENSE_REPAIR_DURATION;
      }
    } else if (worker.state === "repairing") {
      const target = worker.targetDefense;
      if (!target || defenseHealth(target) >= defenseMaxHealth(target) ||
          state.wave < defenseRepairWave(target)) {
        returnWorkerHome(worker);
        continue;
      }
      if (worker.wait <= 0) {
        setDefenseHealth(target, defenseMaxHealth(target));
        setDefenseRepairWave(target, Infinity);
        if (target.kind === "wall" ||
            (state.focusDefenseTarget &&
             defenseTargetKey(target) === defenseTargetKey(state.focusDefenseTarget))) {
          state.focusDefenseTarget = null;
        }
        if (target.kind !== "wall" && state.waveRepair > 0) {
          if (target.kind === "gunner") {
            const magazine = state.gunnerMagazines[target.index];
            magazine.bullet += Math.min(
              state.waveRepair,
              state.gunnerMagCapacity - gunnerAmmoCount(target.index)
            );
          } else {
            const magazine = state.cannonMagazines[target.index];
            magazine.shell += Math.min(
              state.waveRepair,
              state.cannonMagCapacity - cannonAmmoCount(target.index)
            );
          }
        }
        const position = defensePosition(target);
        burst(position.x, position.y, "#65d18a", 14, 90);
        addFloater(
          target.kind === "wall" ? "城墙修复完成" : "维修完成",
          position.x,
          position.y - 48,
          "#65d18a"
        );
        beep(480, 0.09, "triangle", 0.03);
        returnWorkerHome(worker);
      }
    } else if (worker.state === "unloading") {
      if (worker.wait <= 0) worker.state = "returning";
    } else if (worker.state === "returning") {
      const dx = worker.homeX - worker.x;
      worker.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      worker.y += (worker.homeY - worker.y) * Math.min(1, dt * 7);
      if (Math.abs(dx) < 3) {
        worker.x = worker.homeX;
        worker.y = worker.homeY;
        worker.state = "idle";
        worker.wait = rand(0.08, 0.24);
      }
    }
  }
}

function defeatEnemy(enemy) {
  const index = state.enemies.indexOf(enemy);
  if (index < 0) return;
  state.enemies.splice(index, 1);
  const reward = Math.round(enemy.reward * (1 + state.killCoinBonus));
  state.coins += reward;
  state.earned += reward;
  state.kills++;
  burst(enemy.x, enemy.y, enemy.type === "boss" ? "#ff7867" : "#7ee0b3", enemy.type === "boss" ? 36 : 14, 140);
  addFloater(`+${reward}`, enemy.x, enemy.y - 18, "#ffc43d");
  beep(enemy.type === "boss" ? 95 : 240, enemy.type === "boss" ? 0.3 : 0.08, "sawtooth", 0.035);
}

function damageEnemy(enemy, amount, projectile = null) {
  if (!state.enemies.includes(enemy)) return;
  const ammoType = projectile?.ammoType || "bullet";
  const family = ammoMeta[ammoType]?.family || "bullet";
  let adjusted = amount * (1 + state.damageBonus);
  if (projectile?.critical && !projectile.criticalShown) {
    projectile.criticalShown = true;
    addFloater("暴击", enemy.x, enemy.y - 42, "#ffe36a");
  }

  if (enemy.armor) {
    if (ammoType === "ap") adjusted *= 2.15;
    else if (family === "bullet") adjusted *= 0.48;
    else adjusted *= 1.18;
  }

  if (enemy.shield > 0) {
    const shieldDamage = family === "shell" ? adjusted : adjusted * 0.16;
    enemy.shield = Math.max(0, enemy.shield - shieldDamage);
    enemy.hit = 1;
    if (enemy.shield === 0) {
      addFloater("护盾击破", enemy.x, enemy.y - 48, "#81e6ff");
      burst(enemy.x, enemy.y, "#81e6ff", 28, 160);
    }
    return;
  }

  if (ammoType === "ice") enemy.slow = Math.max(enemy.slow, 3.8);
  if (ammoType === "fire") {
    enemy.burn = Math.max(enemy.burn, 5);
    enemy.burnTimer = 0;
  }
  if (ammoType === "he") {
    enemy.y = Math.max(PLAY_TOP + 8, enemy.y - 25);
    if (enemy.movement === "attackingDefense") enemy.movement = "approachingDefense";
    else if (enemy.movement === "attackingHome") enemy.movement = "breaching";
  }

  enemy.hp -= adjusted;
  enemy.hit = 1;
  if (enemy.hp <= 0) defeatEnemy(enemy);
}

function activeDefenseTargets() {
  const targets = [];
  for (let index = 0; index < state.gunnerCount; index++) {
    if (gunnerOperational(index)) targets.push({ kind: "gunner", index });
  }
  for (let index = 0; index < state.cannonCount; index++) {
    if (cannonOperational(index)) targets.push({ kind: "cannon", index });
  }
  return targets;
}

function chooseEnemyDefenseTarget(enemy) {
  const candidates = activeDefenseTargets();
  if (candidates.length === 0) {
    state.focusDefenseTarget = null;
    return null;
  }
  if (state.focusDefenseTarget) {
    const focused = candidates.find(candidate =>
      defenseTargetKey(candidate) === defenseTargetKey(state.focusDefenseTarget));
    if (focused) return focused;
  }
  const selected = candidates.reduce((best, candidate) => {
    const position = defensePosition(candidate);
    const preferencePenalty = candidate.kind === enemy.defenseBias ? 0 : 20;
    const score = Math.abs(position.x - enemy.x) + preferencePenalty + defenseHealth(candidate) * 2;
    if (!best || score < best.score) return { target: candidate, score };
    return best;
  }, null).target;
  state.focusDefenseTarget = selected;
  return selected;
}

function damageDefense(target, enemy) {
  const maxHealth = defenseMaxHealth(target);
  const health = Math.max(0, defenseHealth(target) - 1);
  setDefenseHealth(target, health);
  const repairWave = defenseRepairWave(target);
  const nextRepairWave = state.wave + 1;
  setDefenseRepairWave(
    target,
    Number.isFinite(repairWave) ? Math.max(repairWave, nextRepairWave) : nextRepairWave
  );
  const position = defensePosition(target);
  state.flash = 0.3;
  burst(position.x, position.y, health > 0 ? "#ffb04a" : "#ee5a48", 16, 115);
  addFloater(
    target.kind === "wall"
      ? health > 0 ? `城墙 ${health}/${maxHealth}` : "城墙失守"
      : health > 0 ? `耐久 ${health}/${maxHealth}` : "阵地失守",
    position.x,
    position.y - (target.kind === "wall" ? 24 : 50),
    health > 0 ? "#ffc43d" : "#ff8874"
  );

  if (health <= 0) {
    if (target.kind === "gunner") {
      state.gunnerMagazines[target.index] = { bullet: 0, ap: 0, ice: 0 };
    } else if (target.kind === "cannon") {
      state.cannonMagazines[target.index] = { shell: 0, fire: 0, he: 0 };
    }
    state.defenseTransitionTimer = target.kind === "wall" ? 1.2 : 0.8;
    state.focusDefenseTarget = null;
    enemy.attackTarget = null;
  }
}

function enemyAttackInterval(enemy) {
  if (enemy.type === "boss") return 0.68;
  if (enemy.type === "runner") return 0.86;
  if (enemy.type === "tank") return 1.28;
  if (enemy.type === "saboteur") return 1;
  return 1.12;
}

function beginDefenseApproach(enemy) {
  if (state.defenseTransitionTimer > 0) return;
  const target = chooseEnemyDefenseTarget(enemy);
  enemy.attackTarget = target;
  if (!target) {
    enemy.movement = "breaching";
    enemy.attackTimer = rand(0.25, 0.45);
    return;
  }
  enemy.movement = "approachingDefense";
}

function enemyDefenseAttackPoint(enemy, target) {
  const position = defensePosition(target);
  return {
    x: position.x + enemy.defenseSide * enemy.defenseSpacing,
    y: position.y + 5
  };
}

function performEnemyAttack(enemy) {
  if (state.wallHealth <= 0) {
    beginDefenseApproach(enemy);
    return;
  }
  const target = { kind: "wall", index: 0 };
  enemy.attackTarget = target;
  if (state.defenseHitCooldown > 0) return;
  enemy.attackFlash = 0.24;
  state.defenseHitCooldown = 0.55;
  damageDefense(target, enemy);
  beep(105, 0.13, "sawtooth", 0.045);
}

function performDefenseAttack(enemy) {
  const target = enemy.attackTarget;
  if (!target || target.kind === "wall" || defenseHealth(target) <= 0) {
    beginDefenseApproach(enemy);
    return;
  }
  if (state.defenseHitCooldown > 0) return;
  enemy.attackFlash = 0.24;
  state.defenseHitCooldown = 0.9;
  damageDefense(target, enemy);
  beep(105, 0.13, "sawtooth", 0.045);
}

function performHomeAttack(enemy) {
  if (state.wallHealth > 0 || activeDefenseTargets().length > 0) {
    enemy.movement = "attacking";
    enemy.attackTimer = 0.2;
    return;
  }
  if (state.homeHitCooldown > 0) {
    enemy.attackTimer = 0.14;
    return;
  }
  enemy.attackFlash = 0.24;
  state.homeHitCooldown = 0.85;
  state.lives = Math.max(0, state.lives - 1);
  state.flash = 0.65;
  burst(ROAD.x + ROAD.w / 2, 642, "#ee5a48", 24, 150);
  addFloater("基地 -1", ROAD.x + ROAD.w / 2, 610, "#ff8874");
  beep(78, 0.24, "sawtooth", 0.065);
  if (state.lives <= 0) endGame(false);
}

function startBeltEvent(type, duration = 7) {
  state.beltEvent = type;
  state.eventDuration = type === "jam" ? 0 : duration;
  const labels = {
    jam: "传送带故障",
    overload: "产线超载",
    supply: "补给爆发",
    rare: "稀有弹药"
  };
  addFloater(labels[type], BELT.x + BELT.w / 2, 120, type === "jam" ? "#ff8874" : "#fff4c5");

  if (type === "supply") {
    state.ammoStock.bullet += 3;
    state.ammoStock.shell += 2;
  } else if (type === "rare") {
    const unlocked = ["ap", "ice", "fire", "he"].filter(key => state.unlocks[key]);
    const typeKey = unlocked.length > 0 ? unlocked[Math.floor(Math.random() * unlocked.length)] : "bullet";
    state.ammoStock[typeKey] += 3;
  }
}

function enemyBeltJamLimit() {
  return waveBook[state.wave]?.stageWave === WAVES_PER_STAGE ? 2 : 1;
}

function tryStartEnemyBeltJam(duration, label, y) {
  if (state.beltEvent === "jam" ||
      state.enemyBeltJamCooldown > 0 ||
      state.enemyBeltJamsThisWave >= enemyBeltJamLimit()) {
    return false;
  }
  state.enemyBeltJamsThisWave++;
  state.enemyBeltJamCooldown = ENEMY_BELT_JAM_COOLDOWN;
  startBeltEvent("jam", duration);
  addFloater(label, BELT.x + BELT.w / 2, y, "#ff8874");
  return true;
}

function updateEvents(dt) {
  state.enemyBeltJamCooldown = Math.max(0, state.enemyBeltJamCooldown - dt);
  if (state.beltEvent !== "jam") state.eventTimer -= dt;
  if (state.beltEvent && state.beltEvent !== "jam") state.eventDuration -= dt;

  if (state.beltEvent && state.beltEvent !== "jam" && state.eventDuration <= 0) {
    state.beltEvent = null;
  }
  if (state.eventTimer <= 0 && !state.beltEvent) {
    const roll = Math.random();
    const type = roll < 0.14 ? "jam" : roll < 0.46 ? "overload" : roll < 0.76 ? "supply" : "rare";
    startBeltEvent(type, type === "jam" ? 9 : 6);
    state.eventTimer = rand(17, 25);
  }
}

function gunCooldown() {
  const levelReduction = (state.gunnerLevel - 1) * 0.025;
  const productionReduction = (state.productionLevel - 1) * 0.008;
  return Math.max(0.48, 0.9 - levelReduction - productionReduction);
}

function cannonCooldown() {
  return Math.max(1.2, 2.5 - (state.cannonLevel - 1) * 0.07);
}

function mortarCooldown() {
  return 3;
}

function priorityTarget(mode = "front") {
  if (state.enemies.length === 0) return null;
  if (mode === "heavy") {
    return state.enemies.reduce((best, enemy) =>
      (enemy.armor ? enemy.hp * 1.5 : enemy.hp) > (best.armor ? best.hp * 1.5 : best.hp) ? enemy : best
    );
  }
  return state.enemies.reduce((closest, enemy) => enemy.y > closest.y ? enemy : closest);
}

function aimAngleForTarget(origin, target) {
  if (!target) return 0;
  const targetHeight = lerp(10, 18, roadProgress(target.y));
  return Math.atan2(target.y - targetHeight - origin.y, target.x - origin.x) + Math.PI / 2;
}

function shortestAimDelta(current, target) {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function turnAimToward(current, target, maxTurn) {
  const delta = shortestAimDelta(current, target);
  if (Math.abs(delta) <= maxTurn) return target;
  return current + Math.sign(delta) * maxTurn;
}

function aimIsReady(current, target) {
  return Math.abs(shortestAimDelta(current, target)) < 0.001;
}

function updateWeapons(dt) {
  const front = priorityTarget();
  const heavy = priorityTarget("heavy");
  const machineIndex = state.specialSlots.machine;
  const sniperIndex = state.specialSlots.sniper;
  const mortarIndex = state.specialSlots.mortar;
  const gunnerDesiredAngles = [];
  const cannonDesiredAngles = [];
  let machineDesiredAngle = null;
  let sniperDesiredAngle = null;
  let mortarDesiredAngle = null;

  if (front) {
    for (let index = 0; index < state.gunnerCount; index++) {
      const desired = aimAngleForTarget(GUN_SLOTS[index], front);
      gunnerDesiredAngles[index] = desired;
      state.gunnerAimAngles[index] = turnAimToward(
        state.gunnerAimAngles[index] || 0,
        desired,
        dt * 5.8
      );
    }
    for (let index = 0; index < state.cannonCount; index++) {
      const desired = aimAngleForTarget(CANNON_SLOTS[index], front);
      cannonDesiredAngles[index] = desired;
      state.cannonAimAngles[index] = turnAimToward(
        state.cannonAimAngles[index] || 0,
        desired,
        dt * 3.6
      );
    }
    if (Number.isInteger(machineIndex)) {
      machineDesiredAngle = aimAngleForTarget(GUN_SLOTS[machineIndex], front);
      state.weaponAimAngles.machine = turnAimToward(
        state.weaponAimAngles.machine || 0,
        machineDesiredAngle,
        dt * 7.2
      );
    }
    if (Number.isInteger(mortarIndex)) {
      mortarDesiredAngle = aimAngleForTarget(CANNON_SLOTS[mortarIndex], front);
      state.weaponAimAngles.mortar = turnAimToward(
        state.weaponAimAngles.mortar || 0,
        mortarDesiredAngle,
        dt * 2.8
      );
    }
  }
  if (heavy && Number.isInteger(sniperIndex)) {
    sniperDesiredAngle = aimAngleForTarget(GUN_SLOTS[sniperIndex], heavy);
    state.weaponAimAngles.sniper = turnAimToward(
      state.weaponAimAngles.sniper || 0,
      sniperDesiredAngle,
      dt * 4.4
    );
  }
  for (let i = 0; i < state.gunTimers.length; i++) {
    state.gunTimers[i] = Math.max(0, state.gunTimers[i] - dt);
  }
  for (const key of Object.keys(state.weaponTimers)) {
    state.weaponTimers[key] = Math.max(0, state.weaponTimers[key] - dt);
  }
  for (let i = 0; i < state.cannonTimers.length; i++) {
    state.cannonTimers[i] = Math.max(0, state.cannonTimers[i] - dt);
  }

  for (let i = 0; i < state.gunnerCount; i++) {
    if (!gunnerOperational(i)) continue;
    if (gunnerSpecialAt(i) || !front || state.gunTimers[i] > 0 ||
        !aimIsReady(state.gunnerAimAngles[i], gunnerDesiredAngles[i])) continue;
    const ammo = takeAmmo("bullet", i);
    if (ammo) {
      spawnProjectile(ammo, front, `gun-${i}`);
      state.gunTimers[i] = gunCooldown();
    }
  }

  for (let i = 0; i < state.cannonCount; i++) {
    if (!cannonOperational(i)) continue;
    if (cannonSpecialAt(i) || !front || state.cannonTimers[i] > 0 ||
        !aimIsReady(state.cannonAimAngles[i], cannonDesiredAngles[i])) continue;
    const ammo = takeAmmo("shell", i);
    if (ammo) {
      spawnProjectile(ammo, front, `cannon-${i}`);
      state.cannonTimers[i] = cannonCooldown();
    }
  }

  if (front && Number.isInteger(machineIndex) && gunnerOperational(machineIndex) &&
      state.unlocks.machine && state.weaponTimers.machine <= 0 &&
      aimIsReady(state.weaponAimAngles.machine, machineDesiredAngle)) {
    const ammo = takeAmmo("bullet", machineIndex);
    if (ammo) {
      spawnProjectile(ammo, front, "machine");
      state.weaponTimers.machine = Math.max(0.09, 0.17 - (state.gunnerLevel - 1) * 0.012);
    }
  }

  if (Number.isInteger(sniperIndex) && gunnerOperational(sniperIndex) &&
      state.unlocks.sniper && state.weaponTimers.sniper <= 0 &&
      sniperDesiredAngle !== null &&
      aimIsReady(state.weaponAimAngles.sniper, sniperDesiredAngle)) {
    const ammo = heavy ? takeAmmo("bullet", sniperIndex) : null;
    if (ammo) {
      spawnProjectile(ammo, heavy, "sniper");
      state.weaponTimers.sniper = Math.max(0.9, 1.75 - (state.gunnerLevel - 1) * 0.1);
    }
  }

  if (front && Number.isInteger(mortarIndex) && state.unlocks.mortar &&
      cannonOperational(mortarIndex) &&
      state.weaponTimers.mortar <= 0 &&
      aimIsReady(state.weaponAimAngles.mortar, mortarDesiredAngle)) {
    const ammo = takeAmmo("shell", mortarIndex);
    if (ammo) {
      spawnProjectile(ammo, front, `mortar-${mortarIndex}`);
      state.weaponTimers.mortar = mortarCooldown();
    }
  }
}

function segmentEnemyHit(projectile, fromX, fromY, toX, toY) {
  const segmentX = toX - fromX;
  const segmentY = toY - fromY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY || 1;
  let closest = null;
  let closestProgress = Infinity;

  for (const enemy of state.enemies) {
    const progress = clamp(
      ((enemy.x - fromX) * segmentX + (enemy.y - fromY) * segmentY) / segmentLengthSquared,
      0,
      1
    );
    const nearestX = fromX + segmentX * progress;
    const nearestY = fromY + segmentY * progress;
    const enemyScale = enemy.scale * roadDepthScale(enemy.y);
    const hitRadius = 18 * enemyScale + projectile.r;
    if (Math.hypot(enemy.x - nearestX, enemy.y - nearestY) <= hitRadius &&
        progress < closestProgress) {
      closest = enemy;
      closestProgress = progress;
    }
  }
  return closest ? { enemy: closest, progress: closestProgress } : null;
}

function detonateShell(projectile) {
  const baseBlastRadius = projectile.ammoType === "he" ? 76 + state.cannonLevel * 3
    : projectile.weapon.startsWith("mortar-") ? 60
    : 48 + state.cannonLevel * 3;
  const blastRadius = baseBlastRadius * (1 + state.blastRadiusBonus);
  const victims = state.enemies.filter(enemy =>
    Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <= blastRadius
  );
  for (const enemy of victims) damageEnemy(enemy, projectile.damage, projectile);
  burst(projectile.x, projectile.y, ammoMeta[projectile.ammoType].color, 22, 155);
}

function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const projectile = state.projectiles[i];
    const previousX = projectile.x;
    const previousY = projectile.y;
    const previousRenderY = projectile.y - projectile.height;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.travelled += projectile.speed * dt;
    projectile.progress = clamp(projectile.travelled / projectile.initialDistance, 0, 1);
    const targetHeight = projectile.kind === "shell"
      ? 7
      : lerp(10, 18, roadProgress(projectile.y));
    const baseHeight = lerp(projectile.muzzleHeight, targetHeight, projectile.progress);
    projectile.height = baseHeight + Math.sin(projectile.progress * Math.PI) * projectile.arcHeight;
    const renderDx = projectile.x - previousX;
    const renderDy = projectile.y - projectile.height - previousRenderY;
    if (Math.abs(renderDx) + Math.abs(renderDy) > 0.001) {
      projectile.renderAngle = Math.atan2(renderDy, renderDx) + Math.PI / 2;
    }

    if (projectile.kind === "shell" && projectile.travelled >= projectile.initialDistance) {
      projectile.x = projectile.targetX;
      projectile.y = projectile.targetY;
      projectile.height = 7;
      detonateShell(projectile);
      state.projectiles.splice(i, 1);
      continue;
    }

    if (projectile.kind === "bullet") {
      const hit = segmentEnemyHit(projectile, previousX, previousY, projectile.x, projectile.y);
      if (hit) {
        projectile.x = lerp(previousX, projectile.x, hit.progress);
        projectile.y = lerp(previousY, projectile.y, hit.progress);
        damageEnemy(hit.enemy, projectile.damage, projectile);
        burst(projectile.x, projectile.y, ammoMeta[projectile.ammoType].color, 4, 65);
        state.projectiles.splice(i, 1);
        continue;
      }
    }

    if (projectile.travelled > 900 ||
        projectile.y < PLAY_TOP - 40 ||
        projectile.y > SHOP_TOP + 40 ||
        projectile.x < 0 ||
        projectile.x > W) {
      state.projectiles.splice(i, 1);
    }
  }
}

function tryUpgrade(index) {
  const item = shop[index];
  if (!item) return;
  const cost = item.cost();
  const actionLabel = item.buttonLabel ? item.buttonLabel() : "升级";
  const shopX = (index + 0.5) * (W / shop.length);
  if (item.maxed?.()) {
    addFloater("已满级", shopX, 690, "#fff4c5");
    return;
  }
  if (state.coins >= cost) {
    state.coins -= cost;
    item.action();
    burst(shopX, 722, item.color, 14, 120);
    addFloater(actionLabel, shopX, 690, "#fff4c5");
    beep(620 + index * 90, 0.1, "square", 0.045);
  } else {
    addFloater("金币不足", shopX, 690, "#ff8874");
    beep(115, 0.11, "sawtooth", 0.025);
  }
}

function update(dt) {
  state.time += dt;
  state.defenseHitCooldown = Math.max(0, state.defenseHitCooldown - dt);
  state.defenseTransitionTimer = Math.max(0, state.defenseTransitionTimer - dt);
  state.homeHitCooldown = Math.max(0, state.homeHitCooldown - dt);
  state.baseCoinTimer -= dt;
  if (state.baseCoinTimer <= 0) {
    const amount = baseCoinAmount();
    state.coins += amount;
    state.earned += amount;
    state.baseCoinTimer += BASE_COIN_INTERVAL;
    burst(ROAD.x + ROAD.w / 2, 646, "#ffc43d", 8, 75);
    addFloater(`基地收益 +${amount}`, ROAD.x + ROAD.w / 2, 615, "#ffc43d");
  }
  updateEvents(dt);
  const baseBeltSpeed = state.beltEvent === "jam" ? 0 : state.beltEvent === "overload" ? 180 : 110;
  const beltSpeed = baseBeltSpeed * (1 + state.beltSpeedBonus);
  state.beltOffset = (state.beltOffset + dt * beltSpeed) % 264;
  state.flash = Math.max(0, state.flash - dt * 3);

  if (state.beltEvent !== "jam") state.ammoTimer -= dt * (state.beltEvent === "overload" ? 1.65 : 1);
  if (state.ammoTimer <= 0 && state.beltEvent !== "jam") {
    spawnAmmo();
    state.ammoTimer = Math.max(0.28, 0.78 - state.productionLevel * 0.055) + rand(0, 0.16);
  }

  if (!state.waveActive) {
    state.waveTimer -= dt;
    if (state.waveTimer <= 0 && state.wave < waveBook.length) {
      state.waveActive = true;
      state.waveClearTimer = null;
      state.focusDefenseTarget = null;
      state.defenseTransitionTimer = 0;
      state.enemyBeltJamCooldown = 0;
      state.enemyBeltJamsThisWave = 0;
      state.spawned = 0;
      state.spawnTimer = 0;
      announce(`第 ${currentStageNumber()} 关 · 第 ${currentStageWave()} 波`);
      beep(260, 0.08, "square", 0.04);
    }
  } else {
    const wave = waveBook[state.wave];
    state.spawnTimer -= dt;
    if (state.spawned < wave.count && state.spawnTimer <= 0) {
      const batchSize = Math.min(wave.batchSize || 1, wave.count - state.spawned);
      for (let i = 0; i < batchSize; i++) spawnEnemy();
      state.spawnTimer = wave.interval;
    }
    const waveCleared = state.spawned >= wave.count && state.enemies.length === 0;
    if (waveCleared && state.waveClearTimer === null) {
      state.waveClearTimer = 1;
    } else if (!waveCleared) {
      state.waveClearTimer = null;
    }
    if (waveCleared && state.waveClearTimer !== null) {
      state.waveClearTimer -= dt;
    }
    if (waveCleared && state.waveClearTimer <= 0) {
      state.waveActive = false;
      state.waveClearTimer = null;
      state.focusDefenseTarget = null;
      const clearedWave = wave;
      state.wave++;
      if (state.wave >= waveBook.length) {
        endGame(true);
        return;
      }
      if (clearedWave.stageWave === WAVES_PER_STAGE) {
        showStageClear(clearedWave.stage);
        return;
      }
      const bonus = 80 + clearedWave.stageWave * 25 + (clearedWave.stage - 1) * 40;
      state.coins += bonus;
      state.earned += bonus;
      addFloater(`波次奖励 +${bonus}`, ROAD.x + ROAD.w / 2, 145, "#fff4c5");
      showChoices();
      return;
    }
  }

  for (let i = state.ammoDrops.length - 1; i >= 0; i--) {
    const ammo = state.ammoDrops[i];
    ammo.y += beltSpeed * dt;
    ammo.pulse += dt * 5;
    ammo.x = beltPointForLane(ammo.y, ammo.lane);
    if (ammo.y >= DEPOT.y - 24) {
      storeAmmo(ammo);
      state.ammoDrops.splice(i, 1);
    }
  }

  updateWorkers(dt);

  for (const enemy of state.enemies) {
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.phase += dt * 5;
    enemy.hit = Math.max(0, enemy.hit - dt * 5);
    enemy.attackFlash = Math.max(0, enemy.attackFlash - dt);

    if (enemy.movement === "advancing") {
      const slowFactor = enemy.slow > 0 ? 0.52 : 1;
      enemy.y += enemy.speed * slowFactor * dt;
      const laneSway = Math.sin(enemy.phase * 0.45 + enemy.lane * 8) * 1.6 * roadDepthScale(enemy.y);
      enemy.x = roadPointForLane(enemy.y, enemy.lane) + laneSway;
      if (enemy.y >= GATE_Y - 5) {
        enemy.y = GATE_Y - 5;
        enemy.x = roadPointForLane(enemy.y, enemy.lane);
        enemy.movement = "attacking";
        enemy.attackTimer = rand(0.35, 0.62);
      }
    } else if (enemy.movement === "attacking") {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        performEnemyAttack(enemy);
        if (state.mode !== "playing") return;
        if (enemy.movement === "attacking") {
          enemy.attackTimer = enemyAttackInterval(enemy);
        }
      }
    } else if (enemy.movement === "approachingDefense") {
      const target = enemy.attackTarget;
      if (!target || target.kind === "wall" || defenseHealth(target) <= 0) {
        beginDefenseApproach(enemy);
      } else {
        const point = enemyDefenseAttackPoint(enemy, target);
        const approachSpeed = Math.max(48, enemy.speed * 1.2);
        const dx = point.x - enemy.x;
        const dy = point.y - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;
        const step = Math.min(distance, approachSpeed * dt);
        enemy.x += dx / distance * step;
        enemy.y += dy / distance * step;
        if (distance < 3) {
          enemy.x = point.x;
          enemy.y = point.y;
          enemy.movement = "attackingDefense";
          enemy.attackTimer = rand(0.25, 0.55);
        }
      }
    } else if (enemy.movement === "attackingDefense") {
      const target = enemy.attackTarget;
      if (!target || target.kind === "wall" || defenseHealth(target) <= 0) {
        beginDefenseApproach(enemy);
      } else {
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0) {
          performDefenseAttack(enemy);
          if (state.mode !== "playing") return;
          if (enemy.movement === "attackingDefense") {
            enemy.attackTimer = enemyAttackInterval(enemy);
          }
        }
      }
    } else if (enemy.movement === "breaching") {
      const targetX = ROAD.x + ROAD.w / 2 + enemy.homeOffset;
      const targetY = HOME_ATTACK_Y + Math.abs(enemy.homeOffset) * 0.1;
      const breachSpeed = Math.max(42, enemy.speed * 1.15);
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = Math.min(distance, breachSpeed * dt);
      enemy.x += dx / distance * step;
      enemy.y += dy / distance * step;
      if (distance < 3) {
        enemy.x = targetX;
        enemy.y = targetY;
        enemy.movement = "attackingHome";
        enemy.attackTimer = rand(0.35, 0.65);
      }
    } else if (enemy.movement === "attackingHome") {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        performHomeAttack(enemy);
        if (state.mode !== "playing") return;
        if (enemy.movement === "attackingHome") {
          enemy.attackTimer = enemyAttackInterval(enemy);
        }
      }
    }

    if (enemy.burn > 0) {
      enemy.burn -= dt;
      enemy.burnTimer -= dt;
      if (enemy.burnTimer <= 0) {
        enemy.burnTimer = 0.5;
        damageEnemy(enemy, 8 + state.cannonLevel * 2, { ammoType: "fire" });
        burst(enemy.x, enemy.y, "#ff7048", 3, 35);
      }
    }
    if (!state.enemies.includes(enemy)) continue;

    if (enemy.type === "saboteur" && !enemy.sabotageDone && enemy.y > 340) {
      enemy.sabotageDone = true;
      tryStartEnemyBeltJam(8, "产线被破坏", 210);
    }

    if (enemy.type === "boss") {
      enemy.bossTimer -= dt;
      if (enemy.bossTimer <= 0) {
        enemy.bossPhase++;
        if (enemy.bossPhase % 2 === 1) {
          spawnEnemy("runner", false);
          spawnEnemy("saboteur", false);
          addFloater("召集援军", enemy.x, enemy.y - 52, "#ff8874");
        } else {
          tryStartEnemyBeltJam(9, "冲击产线", 185);
        }
        enemy.bossTimer = enemy.shield > 0 ? 5.2 : 3.9;
      }
    }
  }

  updateWeapons(dt);
  updateProjectiles(dt);

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  for (let i = state.floaters.length - 1; i >= 0; i--) {
    const f = state.floaters[i];
    f.y -= dt * 32;
    f.life -= dt;
    if (f.life <= 0) state.floaters.splice(i, 1);
  }
}
