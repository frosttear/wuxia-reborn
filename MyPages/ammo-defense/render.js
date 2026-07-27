"use strict";

function drawBackground() {
  drawWorldBackground();
}

function drawHeader() {
  ctx.fillStyle = "#fff4c5";
  text("弹药防线", 18, 24, 18, "#fff4c5", "left");
  if (state.endless) {
    const ew = state.endlessWave % WAVES_PER_STAGE + 1;
    const es = Math.floor(state.endlessWave / WAVES_PER_STAGE) + 1;
    text(`无尽 · 阶段${es} · ${ew}/${WAVES_PER_STAGE} 波`,
      18, 52, 12, "#ff9d43", "left", 800);
  } else {
    text(`第 ${currentStageNumber()} 关 · ${currentStageWave()}/${WAVES_PER_STAGE} 波`,
      18, 52, 12, "#9ac4a2", "left", 800);
  }

  drawHeart(200, 52, 6, "#ee5a48");
  text(`${state.lives}/${state.gateMax}`, 220, 52, 10, "#ff8874", "left", 800);
  drawCoin(268, 52, 9);
  fillRound(278, 41, 58, 22, 11, "#fff4c5");
  strokeRound(278, 41, 58, 22, 11, "#17231c", 2);
  text(String(state.coins), 307, 52, 12, "#17231c");

  const synergyColors = { fire: "#ff7048", armor: "#66d9ff", speed: "#ffe36a", economy: "#ffc43d" };
  const synergyLabels = { fire: "火", armor: "防", speed: "速", economy: "财" };
  const hasSynergy = Object.values(state.synergyCounts).some(v => v > 0);
  if (hasSynergy) {
    const activeTags = Object.keys(state.synergyCounts).filter(t => state.synergyCounts[t] > 0);
    const totalW = activeTags.length * 42 - 4;
    let sx = 18;
    fillRound(sx - 4, 76, totalW + 8, 22, 5, "rgba(23,35,28,0.88)");
    for (const tag of activeTags) {
      const count = state.synergyCounts[tag];
      const color = synergyColors[tag];
      const tier = count >= 12 ? 4 : count >= 9 ? 3 : count >= 6 ? 2 : count >= 3 ? 1 : 0;
      fillRound(sx, 78, 38, 18, 4, tier >= 1 ? color : "#2b3c31");
      text(synergyLabels[tag] + count, sx + 19, 87, 10,
        tier >= 1 ? "#17231c" : color, "center", tier >= 1 ? 900 : 700);
      if (tier >= 1) {
        ctx.strokeStyle = tier >= 4 ? "#ff7048" : tier >= 3 ? "#c97dff" : tier >= 2 ? "#ffe36a" : color;
        ctx.lineWidth = tier >= 3 ? 2.5 : 1.5;
        ctx.strokeRect(sx + 0.5, 78.5, 37, 17);
      }
      sx += 42;
    }
  }
}

function drawCoin(x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#ffc43d";
  ctx.strokeStyle = "#9a5a1b";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 6;
    const radius = i % 2 ? r * 0.9 : r;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#d68521";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -5);
  ctx.lineTo(3, -1);
  ctx.lineTo(-2, 5);
  ctx.stroke();
  ctx.restore();
}

function drawHeart(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.85);
  ctx.bezierCurveTo(-size * 1.4, 0, -size, -size, 0, -size * 0.2);
  ctx.bezierCurveTo(size, -size, size * 1.4, 0, 0, size * 0.85);
  ctx.fill();
  ctx.restore();
}

function drawBelt() {
  if (state.beltEvent === "jam") {
    ctx.fillStyle = "rgba(168,70,59,0.2)";
    ctx.fillRect(BELT.x, BELT.y, BELT.w, BELT.h);
  }
}

function drawBeltStatus() {
  fillRound(BELT.x + 31, BELT.y + 9, 86, 24, 12, "rgba(23,35,28,0.76)");
  text(`弹药线 LV.${state.productionLevel}`, BELT.x + BELT.w / 2, BELT.y + 21, 11, "#fff4c5");
  const priorityLabels = { balanced: "均衡", bullet: "子弹优先", shell: "炮弹优先" };
  const repairWorker = activeBeltRepairWorker();
  const beltLabel = repairWorker?.state === "repairingBelt"
    ? `维修 ${Math.max(0, repairWorker.wait).toFixed(1)}s`
    : repairWorker ? "工人赶来" : "调度维修";
  fillRound(BELT.x + 25, BELT.y + 39, 98, 22, 11,
    state.beltEvent === "jam" ? "#a8463b" : "rgba(255,244,197,0.9)");
  text(state.beltEvent === "jam" ? beltLabel : priorityLabels[state.priority],
    BELT.x + BELT.w / 2, BELT.y + 50, 10,
    state.beltEvent === "jam" ? "#fff4c5" : "#17231c");

  if (state.beltEvent && state.beltEvent !== "jam") {
    const labels = { overload: "超载生产", supply: "补给爆发", rare: "稀有补给" };
    text(labels[state.beltEvent], BELT.x + BELT.w / 2, BELT.y + 74, 10, "#fff4c5");
  }
}

function drawRoad() {
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(238,90,72,${state.flash * 0.08})`;
    ctx.fillRect(ROAD.x, ROAD.y, ROAD.w, ROAD.h);
  }
}

function drawDefenseRows() {
  fillRound(237, 82, 82, 18, 9, "rgba(23,35,28,0.84)");
  text(`炮弹 ${totalAmmo("shell")}/${state.cannonCount * state.cannonMagCapacity}`, 278, 91, 9,
    totalAmmo("shell") > 0 ? "#d8a3ff" : "#ff8874");
  fillRound(324, 82, 82, 18, 9, "rgba(23,35,28,0.84)");
  text(`子弹 ${totalAmmo("bullet")}/${state.gunnerCount * state.gunnerMagCapacity}`, 365, 91, 9,
    totalAmmo("bullet") > 0 ? "#ffc43d" : "#ff8874");
}

function drawAmmo(ammo) {
  const meta = ammoMeta[ammo.kind];
  const depth = beltDepthScale(ammo.y);
  const wobble = Math.sin(ammo.pulse) * 0.025;
  const special = ammo.kind !== "bullet" && ammo.kind !== "shell";

  ctx.save();
  ctx.translate(ammo.x, ammo.y + 1);
  ctx.scale(depth, depth);
  ctx.fillStyle = "rgba(8,16,12,0.38)";
  ctx.beginPath();
  ctx.ellipse(2, 0, meta.family === "shell" ? 11 : 13, meta.family === "shell" ? 3.8 : 3.2, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(ammo.x, ammo.y);
  ctx.scale(depth, depth * 0.86);
  ctx.translate(0, -ammo.r);
  ctx.rotate(ammo.spin + wobble);
  if (special) {
    ctx.shadowColor = meta.color;
    ctx.shadowBlur = 8;
  }
  if (meta.family === "shell") {
    const shellGradient = ctx.createLinearGradient(-ammo.r, 0, ammo.r, 0);
    shellGradient.addColorStop(0, "#392847");
    shellGradient.addColorStop(0.22, meta.color);
    shellGradient.addColorStop(0.7, meta.color);
    shellGradient.addColorStop(1, "#33243f");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "#382345";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -ammo.r * 1.35);
    ctx.quadraticCurveTo(ammo.r * 0.82, -ammo.r * 0.68, ammo.r * 0.68, ammo.r * 0.78);
    ctx.lineTo(ammo.r * 0.5, ammo.r);
    ctx.lineTo(-ammo.r * 0.5, ammo.r);
    ctx.lineTo(-ammo.r * 0.68, ammo.r * 0.78);
    ctx.quadraticCurveTo(-ammo.r * 0.82, -ammo.r * 0.68, 0, -ammo.r * 1.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#dca63b";
    ctx.fillRect(-ammo.r * 0.7, ammo.r * 0.2, ammo.r * 1.4, ammo.r * 0.34);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillRect(-ammo.r * 0.32, -ammo.r * 0.92, 2.2, ammo.r * 1.25);
    ctx.fillStyle = "#1c261f";
    for (const direction of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(direction * ammo.r * 0.35, ammo.r * 0.72);
      ctx.lineTo(direction * ammo.r * 0.92, ammo.r * 1.1);
      ctx.lineTo(direction * ammo.r * 0.42, ammo.r * 1.05);
      ctx.closePath();
      ctx.fill();
    }
    if (ammo.kind === "fire") {
      ctx.fillStyle = "#ffe36a";
      ctx.beginPath();
      ctx.moveTo(0, -ammo.r * 0.78);
      ctx.lineTo(4, -ammo.r * 0.25);
      ctx.lineTo(0, ammo.r * 0.05);
      ctx.lineTo(-4, -ammo.r * 0.25);
      ctx.closePath();
      ctx.fill();
    } else if (ammo.kind === "he") {
      ctx.strokeStyle = "#42351a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(4, 5);
      ctx.moveTo(4, -3);
      ctx.lineTo(-4, 5);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = "#5f3a16";
    ctx.lineWidth = 1.7;
    for (let i = -1; i <= 1; i++) {
      const x = i * 6;
      const bulletGradient = ctx.createLinearGradient(x - 3, 0, x + 3, 0);
      bulletGradient.addColorStop(0, "#9b5d1d");
      bulletGradient.addColorStop(0.45, "#ffd45a");
      bulletGradient.addColorStop(1, "#8d531a");
      ctx.fillStyle = bulletGradient;
      roundedRect(x - 2.7, -ammo.r * 0.62, 5.4, ammo.r * 1.55, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, -ammo.r * 0.62);
      ctx.lineTo(x, -ammo.r);
      ctx.lineTo(x + 2.5, -ammo.r * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#6d431c";
      ctx.fillRect(x - 3, ammo.r * 0.72, 6, 2.4);
    }
    if (ammo.kind === "ice") {
      ctx.strokeStyle = "#d9f7ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -1);
      ctx.lineTo(9, -1);
      ctx.moveTo(0, -7);
      ctx.lineTo(0, 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDepot() {
  ctx.save();
  ctx.translate(DEPOT.x, DEPOT.y);
  fillRound(-38, -25, 76, 24, 5, "rgba(16,27,21,0.92)");
  strokeRound(-38, -25, 76, 24, 5, "#0b1711", 2);
  ctx.fillStyle = "#d0a13b";
  ctx.fillRect(-1, -22, 2, 17);
  ctx.fillStyle = "#ffc43d";
  ctx.beginPath();
  ctx.moveTo(-29, -18);
  ctx.lineTo(-25, -22);
  ctx.lineTo(-21, -18);
  ctx.lineTo(-22, -9);
  ctx.lineTo(-28, -9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#a66bd0";
  ctx.beginPath();
  ctx.moveTo(22, -21);
  ctx.lineTo(28, -16);
  ctx.lineTo(27, -9);
  ctx.lineTo(21, -9);
  ctx.lineTo(20, -16);
  ctx.closePath();
  ctx.fill();
  text(String(stockTotal("bullet")), -10, -13, 11, "#ffc43d");
  text(String(stockTotal("shell")), 13, -13, 11, "#d8a3ff");
  ctx.restore();
}

function drawWorker(worker) {
  const walking = worker.state === "delivering" ||
    worker.state === "toRepair" ||
    worker.state === "toBeltRepair" ||
    worker.state === "returning";
  const bob = walking ? Math.sin(worker.step) * 2 : 0;
  ctx.save();
  ctx.translate(worker.x, worker.y + bob);
  const facingLeft = worker.state === "returning" || worker.state === "toBeltRepair";
  ctx.scale(facingLeft ? -1 : 1, 1);

  ctx.fillStyle = "rgba(10,18,13,0.34)";
  ctx.beginPath();
  ctx.ellipse(2, 18, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 2.3;
  const roleColors = { porter: "#365f7a", loader: "#a3663d", dispatcher: "#3c7b69", mechanic: "#8b7539" };
  const roleLights = { porter: "#6fa5c4", loader: "#d6965d", dispatcher: "#69b99c", mechanic: "#c4a951" };
  const roleMarks = { porter: "速", loader: "装", dispatcher: "调", mechanic: "修" };

  const stride = walking ? Math.sin(worker.step) * 3 : 0;
  ctx.beginPath();
  ctx.moveTo(-5, 11);
  ctx.lineTo(-6 - stride, 19);
  ctx.lineTo(-10 - stride, 20);
  ctx.moveTo(5, 11);
  ctx.lineTo(6 + stride, 19);
  ctx.lineTo(10 + stride, 20);
  ctx.stroke();

  ctx.fillStyle = "#4a4c42";
  roundedRect(-10, -4, 20, 19, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = roleColors[worker.role] || "#365f7a";
  roundedRect(-8, -2, 16, 15, 4);
  ctx.fill();
  ctx.fillStyle = roleLights[worker.role] || "#6fa5c4";
  ctx.fillRect(-6, 0, 3, 10);
  fillRound(-5, 4, 10, 8, 3, "rgba(20,31,25,0.62)");
  text(roleMarks[worker.role] || "", 0, 8, 6, "#fff4c5");

  ctx.fillStyle = "#ffd09b";
  ctx.beginPath();
  ctx.arc(0, -12, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#40563a";
  ctx.beginPath();
  ctx.arc(0, -15, 8, Math.PI, Math.PI * 2);
  ctx.lineTo(9, -13);
  ctx.lineTo(-9, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = roleLights[worker.role] || "#6fa5c4";
  ctx.fillRect(-5, -19, 10, 3);
  ctx.fillStyle = "#253029";
  ctx.beginPath();
  ctx.arc(3, -12, 1.2, 0, Math.PI * 2);
  ctx.fill();

  if (worker.carrying && ammoMeta[worker.carrying].family === "bullet") {
    ctx.save();
    ctx.translate(13, 1);
    ctx.rotate(-0.16);
    fillRound(-3, -11, 12, 20, 3, "#6f4a2b");
    strokeRound(-3, -11, 12, 20, 3, "#17231c", 2);
    ctx.fillStyle = ammoMeta[worker.carrying].color;
    for (let i = 0; i < 3; i++) ctx.fillRect(0 + i * 3, -8 + i, 2, 12);
    ctx.restore();
    ctx.strokeStyle = "#17231c";
    ctx.beginPath();
    ctx.moveTo(7, -1);
    ctx.lineTo(15, 1);
    ctx.stroke();
  } else if (worker.carrying) {
    ctx.save();
    ctx.translate(14, -1);
    ctx.rotate(0.2);
    const cargoColor = ammoMeta[worker.carrying].color;
    ctx.fillStyle = cargoColor;
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(7, -5);
    ctx.lineTo(5, 9);
    ctx.lineTo(-5, 9);
    ctx.lineTo(-7, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffc43d";
    ctx.fillRect(-5, 1, 10, 3);
    ctx.restore();
    ctx.strokeStyle = "#17231c";
    ctx.beginPath();
    ctx.moveTo(7, -1);
    ctx.lineTo(14, 1);
    ctx.stroke();
  } else if (worker.state === "toRepair" || worker.state === "repairing" ||
      worker.state === "toBeltRepair" || worker.state === "repairingBelt") {
    ctx.save();
    ctx.translate(13, 0);
    const repairing = worker.state === "repairing" || worker.state === "repairingBelt";
    ctx.rotate(repairing ? Math.sin(worker.step) * 0.45 - 0.3 : -0.55);
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -7);
    ctx.stroke();
    ctx.fillStyle = "#c6c8bd";
    ctx.fillRect(-7, -11, 14, 5);
    ctx.fillStyle = "#d09a32";
    ctx.fillRect(-2, 7, 4, 4);
    ctx.restore();
  }
  ctx.restore();
}

function drawRepairProgress() {
  for (const worker of state.workers) {
    if (worker.state === "repairingBelt") {
      const duration = worker.repairDuration || beltRepairDuration();
      const remaining = clamp(worker.wait, 0, duration);
      const progress = 1 - remaining / duration;
      const y = BELT_REPAIR_POINT.y - 46;
      fillRound(BELT_REPAIR_POINT.x - 31, y, 62, 17, 5, "rgba(23,35,28,0.9)");
      text(`修产线 ${remaining.toFixed(1)}s`, BELT_REPAIR_POINT.x, y + 7, 8, "#fff4c5");
      fillRound(BELT_REPAIR_POINT.x - 28, y + 13, 56, 3, 1.5, "#3b4b42");
      fillRound(BELT_REPAIR_POINT.x - 28, y + 13, 56 * progress, 3, 1.5, "#65d18a");
      continue;
    }
    if (worker.state !== "repairing" || !worker.targetDefense) continue;
    const position = defensePosition(worker.targetDefense);
    const adjustedDuration = DEFENSE_REPAIR_DURATION * (1 - state.defenseRepairBonus);
    const remaining = clamp(worker.wait, 0, adjustedDuration);
    const progress = 1 - remaining / adjustedDuration;
    const y = position.y - 62;
    fillRound(position.x - 28, y, 56, 17, 5, "rgba(23,35,28,0.9)");
    text(`${worker.targetDefense.kind === "wall" ? "修墙" : "维修"} ${remaining.toFixed(1)}s`,
      position.x, y + 7, 8, "#fff4c5");
    fillRound(position.x - 25, y + 13, 50, 3, 1.5, "#3b4b42");
    fillRound(position.x - 25, y + 13, 50 * progress, 3, 1.5, "#65d18a");
  }
}

function enemyPalette(enemy) {
  const hit = enemy.hit > 0;
  const palettes = {
    grunt: { body: "#4d9287", light: "#6fc4b5", dark: "#27584f", accent: "#d55f4d" },
    runner: { body: "#2b8c82", light: "#5dd2c3", dark: "#174f4b", accent: "#f0b83f" },
    tank: { body: "#596558", light: "#87917b", dark: "#303a33", accent: "#ba7543" },
    saboteur: { body: "#a76c3f", light: "#d49a58", dark: "#563923", accent: "#ffd34e" },
    boss: { body: "#914653", light: "#c36a72", dark: "#40202a", accent: "#ffbd48" },
    healer: { body: "#3a7a5c", light: "#6fc4a0", dark: "#1e4035", accent: "#7ee0b3" },
    shielded: { body: "#4a6a8a", light: "#6a9ac4", dark: "#2a3a4f", accent: "#81e6ff" },
    berserker: { body: "#8a3a3a", light: "#c45a5a", dark: "#4a1a1a", accent: "#ff4040" },
    charger: { body: "#b87030", light: "#e09848", dark: "#6a3e18", accent: "#ff9d43" },
    splitter: { body: "#3a8a5a", light: "#5cc48a", dark: "#1e4a30", accent: "#7ee0b3" },
    bomber: { body: "#993322", light: "#cc5544", dark: "#551818", accent: "#ff5733" },
    necro: { body: "#6a3a8a", light: "#9a5ab8", dark: "#3a1a5a", accent: "#b06ddb" },
    tunneler: { body: "#7a6a4a", light: "#a89060", dark: "#4a3a28", accent: "#a08060" },
    titan: { body: "#5a6a7a", light: "#8099aa", dark: "#2a3a4a", accent: "#8899aa" }
  };
  const palette = palettes[enemy.type] || palettes.grunt;
  return hit ? { ...palette, body: "#fff1bf", light: "#fff9dc" } : palette;
}

function drawEnemyLegs(type, palette, phase) {
  const stride = Math.sin(phase) * (type === "runner" ? 5 : 2.5);
  ctx.strokeStyle = "#15211b";
  ctx.lineWidth = type === "tank" || type === "boss" || type === "titan" ? 6 : 4;
  ctx.beginPath();
  ctx.moveTo(-7, 7);
  ctx.lineTo(-9 - stride, 20);
  ctx.lineTo(-14 - stride, 22);
  ctx.moveTo(7, 7);
  ctx.lineTo(9 + stride, 20);
  ctx.lineTo(14 + stride, 22);
  ctx.stroke();
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = type === "tank" || type === "boss" || type === "titan" ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.lineTo(-10 - stride, 18);
  ctx.moveTo(8, 8);
  ctx.lineTo(10 + stride, 18);
  ctx.stroke();
}

function drawGruntEnemy(palette) {
  fillRound(-13, -10, 26, 23, 7, palette.body);
  strokeRound(-13, -10, 26, 23, 7, "#17231c", 2.5);
  fillRound(-10, 0, 20, 8, 2, palette.dark);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -17, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-10, -19);
  ctx.lineTo(-6, -27);
  ctx.lineTo(1, -23);
  ctx.lineTo(7, -28);
  ctx.lineTo(11, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe486";
  ctx.fillRect(-5, -18, 3, 2);
  ctx.fillRect(3, -18, 3, 2);
}

function drawRunnerEnemy(palette, phase) {
  ctx.save();
  ctx.rotate(Math.sin(phase) * 0.05);
  fillRound(-9, -11, 18, 23, 6, palette.body);
  strokeRound(-9, -11, 18, 23, 6, "#17231c", 2.5);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.fillRect(-9, -21, 18, 5);
  ctx.fillStyle = "#17231c";
  ctx.fillRect(-6, -20, 4, 2);
  ctx.fillRect(2, -20, 4, 2);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-7, -7);
  ctx.lineTo(-18, -1);
  ctx.lineTo(-23, -7);
  ctx.stroke();
  ctx.restore();
}

function drawTankEnemy(palette) {
  ctx.fillStyle = palette.dark;
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-17, -4, 9, 0, Math.PI * 2);
  ctx.arc(17, -4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  fillRound(-18, -13, 36, 28, 7, palette.body);
  strokeRound(-18, -13, 36, 28, 7, "#17231c", 3);
  fillRound(-15, -8, 30, 11, 2, palette.light);
  ctx.fillStyle = "#3b453d";
  ctx.fillRect(-12, -5, 24, 5);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -21, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  fillRound(-10, -25, 20, 7, 2, palette.dark);
  ctx.fillStyle = "#ffb54d";
  ctx.fillRect(-5, -22, 10, 2);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(-4, 5, 8, 7);
}

function drawSaboteurEnemy(palette) {
  ctx.fillStyle = "#3b3025";
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 2.5;
  roundedRect(-17, -9, 13, 24, 4);
  ctx.fill();
  ctx.stroke();
  fillRound(-11, -11, 24, 25, 6, palette.body);
  strokeRound(-11, -11, 24, 25, 6, "#17231c", 2.5);
  ctx.fillStyle = palette.dark;
  ctx.beginPath();
  ctx.moveTo(-11, -17);
  ctx.quadraticCurveTo(0, -31, 11, -17);
  ctx.lineTo(8, -11);
  ctx.lineTo(-8, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#202a24";
  ctx.beginPath();
  ctx.arc(0, -17, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(0, -10);
  ctx.lineTo(3, -5);
  ctx.lineTo(8, -12);
  ctx.lineTo(5, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ef6a4a";
  ctx.beginPath();
  ctx.arc(-10, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHealerEnemy(palette) {
  ctx.fillStyle = palette.dark;
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 2.5;
  fillRound(-11, -12, 22, 26, 5, palette.main);
  strokeRound(-11, -12, 22, 26, 5, "#17231c", 2.5);
  ctx.fillStyle = "#7ee0b3";
  ctx.fillRect(-2, -6, 4, 14);
  ctx.fillRect(-6, 0, 12, 4);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, -18, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7ee0b3";
  ctx.beginPath();
  ctx.arc(0, -22, 8, Math.PI, Math.PI * 2);
  ctx.lineTo(9, -18);
  ctx.lineTo(-9, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const healPulse = 0.4 + Math.sin(state.time * 5) * 0.3;
  ctx.save();
  ctx.globalAlpha = healPulse;
  ctx.strokeStyle = "#7ee0b3";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -2, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBossEnemy(palette, shielded) {
  ctx.fillStyle = palette.dark;
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -10);
  ctx.lineTo(-28, 20);
  ctx.lineTo(0, 13);
  ctx.lineTo(28, 20);
  ctx.lineTo(22, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(-21, -7, 11, 0, Math.PI * 2);
  ctx.arc(21, -7, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  fillRound(-21, -16, 42, 32, 8, palette.body);
  strokeRound(-21, -16, 42, 32, 8, "#17231c", 3);
  fillRound(-15, -8, 30, 15, 3, palette.dark);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, -1, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -25, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.dark;
  ctx.beginPath();
  ctx.moveTo(-12, -27);
  ctx.lineTo(-19, -35);
  ctx.lineTo(-7, -32);
  ctx.lineTo(0, -38);
  ctx.lineTo(7, -32);
  ctx.lineTo(19, -35);
  ctx.lineTo(12, -27);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd36a";
  ctx.fillRect(-6, -26, 12, 3);
  if (shielded) {
    ctx.strokeStyle = "rgba(102,217,255,0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -7, 32, 38, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawShieldedEnemy(palette, hasShield) {
  fillRound(-13, -10, 26, 23, 7, palette.body);
  strokeRound(-13, -10, 26, 23, 7, "#17231c", 2.5);
  fillRound(-10, 0, 20, 8, 2, palette.dark);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -17, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, -22, 10, Math.PI, Math.PI * 2);
  ctx.lineTo(10, -20);
  ctx.lineTo(-10, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (hasShield) {
    ctx.strokeStyle = "rgba(102,217,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -7, 22, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBerserkerEnemy(palette, rage) {
  fillRound(-13, -10, 26, 23, 7, palette.body);
  strokeRound(-13, -10, 26, 23, 7, "#17231c", 2.5);
  fillRound(-10, 0, 20, 8, 2, palette.dark);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -17, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.fillRect(-4, -26, 8, 4);
  ctx.fillRect(-8, -24, 16, 2);
  if (rage > 0.3) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,64,64,${0.3 + rage * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -7, 20, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawChargerEnemy(palette, charging) {
  fillRound(-12, -10, 24, 23, 6, palette.body);
  strokeRound(-12, -10, 24, 23, 6, "#17231c", 2.5);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -17, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-8, -20);
  ctx.lineTo(0, -28);
  ctx.lineTo(8, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17231c";
  ctx.fillRect(-4, -18, 3, 2);
  ctx.fillRect(2, -18, 3, 2);
  if (charging) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,157,67,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-24, 5);
    ctx.moveTo(-16, -8);
    ctx.lineTo(-24, -5);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSplitterEnemy(palette) {
  fillRound(-12, -9, 24, 22, 8, palette.body);
  strokeRound(-12, -9, 24, 22, 8, "#17231c", 2.5);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(-8, 5);
  ctx.lineTo(8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(-5, -16, 6, 0, Math.PI * 2);
  ctx.arc(5, -16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17231c";
  ctx.fillRect(-6, -17, 2, 2);
  ctx.fillRect(4, -17, 2, 2);
}

function drawBomberEnemy(palette) {
  fillRound(-11, -10, 22, 22, 6, palette.body);
  strokeRound(-11, -10, 22, 22, 6, "#17231c", 2.5);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -17, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ffd34e";
  ctx.fillRect(-1.5, -9, 3, 6);
  const fuse = Math.sin(state.time * 12) * 0.4 + 0.6;
  ctx.fillStyle = `rgba(255,87,51,${fuse})`;
  ctx.beginPath();
  ctx.arc(0, -11, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawNecroEnemy(palette) {
  ctx.fillStyle = palette.dark;
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(-18, -5);
  ctx.lineTo(-8, -3);
  ctx.lineTo(8, -3);
  ctx.lineTo(18, -5);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  fillRound(-11, -12, 22, 24, 5, palette.body);
  strokeRound(-11, -12, 22, 24, 5, "#17231c", 2.5);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, -24, 10, Math.PI, Math.PI * 2);
  ctx.lineTo(10, -22);
  ctx.lineTo(-10, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e0b0ff";
  ctx.fillRect(-2, -19, 4, 2);
  const pulse = 0.3 + Math.sin(state.time * 4) * 0.3;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = "#b06ddb";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -2, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTunnelerEnemy(palette) {
  fillRound(-11, -10, 22, 22, 6, palette.body);
  strokeRound(-11, -10, 22, 22, 6, "#17231c", 2.5);
  ctx.fillStyle = palette.dark;
  ctx.fillRect(-9, -2, 18, 8);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -17, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.fillRect(-8, -22, 16, 5);
  ctx.fillStyle = "#17231c";
  ctx.fillRect(-5, -18, 3, 2);
  ctx.fillRect(3, -18, 3, 2);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.lineTo(-6, 12);
  ctx.lineTo(6, 12);
  ctx.lineTo(10, 6);
  ctx.closePath();
  ctx.fill();
}

function drawTitanEnemy(palette) {
  ctx.fillStyle = palette.dark;
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-20, -4, 10, 0, Math.PI * 2);
  ctx.arc(20, -4, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  fillRound(-22, -16, 44, 34, 8, palette.body);
  strokeRound(-22, -16, 44, 34, 8, "#17231c", 3);
  fillRound(-18, -8, 36, 14, 3, palette.light);
  ctx.fillStyle = "#3b453d";
  ctx.fillRect(-14, -5, 28, 6);
  ctx.fillStyle = palette.light;
  ctx.beginPath();
  ctx.arc(0, -24, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-14, -26);
  ctx.lineTo(-8, -36);
  ctx.lineTo(0, -30);
  ctx.lineTo(8, -36);
  ctx.lineTo(14, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffb54d";
  ctx.fillRect(-6, -25, 12, 3);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(-5, 8, 10, 8);
}

function drawEnemyWeapon(enemy) {
  if (enemy.movement !== "attacking" &&
      enemy.movement !== "attackingDefense" &&
      enemy.movement !== "attackingHome") return;
  ctx.save();
  ctx.translate(enemy.type === "boss" ? 23 : 15, -1);
  ctx.rotate(-0.9 + Math.sin(enemy.phase * 1.6) * 0.42);
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = enemy.type === "boss" ? 5 : 3;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(0, -15);
  ctx.stroke();
  ctx.fillStyle = enemy.type === "saboteur" ? "#d09a32" : "#aeb5aa";
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(9, -18);
  ctx.lineTo(6, -10);
  ctx.lineTo(-6, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(enemy) {
  const depth = roadDepthScale(enemy.y);
  const bob = Math.abs(Math.sin(enemy.phase)) * -1.5 * depth;
  const s = enemy.scale * depth;
  const palette = enemyPalette(enemy);

  ctx.save();
  ctx.translate(enemy.x, enemy.y + 2);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(10,18,13,0.22)";
  ctx.beginPath();
  const shadowW = enemy.type === "boss" ? 30 : enemy.type === "titan" ? 28 : enemy.type === "tank" ? 24 : enemy.type === "healer" ? 16 : 18;
  ctx.ellipse(3, 1, shadowW, 6, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(10,18,13,0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 0, enemy.type === "boss" ? 18 : enemy.type === "titan" ? 16 : 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (enemy.burrowed) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.translate(enemy.x, enemy.y + bob);
    ctx.scale(s, s);
    ctx.translate(0, -21);
    drawTunnelerEnemy(palette);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(enemy.x, enemy.y + bob);
  ctx.scale(s, s);
  ctx.translate(0, -21);
  drawEnemyLegs(enemy.type, palette, enemy.phase);
  if (enemy.type === "runner") drawRunnerEnemy(palette, enemy.phase);
  else if (enemy.type === "tank") drawTankEnemy(palette);
  else if (enemy.type === "saboteur") drawSaboteurEnemy(palette);
  else if (enemy.type === "healer") drawHealerEnemy(palette);
  else if (enemy.type === "shielded") drawShieldedEnemy(palette, enemy.shield > 0);
  else if (enemy.type === "berserker") drawBerserkerEnemy(palette, 1 - enemy.hp / enemy.maxHp);
  else if (enemy.type === "charger") drawChargerEnemy(palette, enemy.chargeTimer > 0);
  else if (enemy.type === "splitter") drawSplitterEnemy(palette);
  else if (enemy.type === "bomber") drawBomberEnemy(palette);
  else if (enemy.type === "necro") drawNecroEnemy(palette);
  else if (enemy.type === "tunneler") drawTunnelerEnemy(palette);
  else if (enemy.type === "titan") drawTitanEnemy(palette);
  else if (enemy.type === "boss") {
    drawBossEnemy(palette, enemy.shield > 0);
    if (isBossEnraged(enemy)) {
      const enragePulse = 0.3 + Math.sin(state.time * 10) * 0.2;
      ctx.save();
      ctx.strokeStyle = `rgba(255,64,64,${enragePulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -7, 40, 46, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,160,40,${enragePulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -7, 44, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  else drawGruntEnemy(palette);
  drawEnemyWeapon(enemy);

  if (enemy.slow > 0) {
    ctx.strokeStyle = "rgba(102,217,255,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(0, -7, enemy.type === "boss" ? 36 : 23, enemy.type === "boss" ? 42 : 29, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (enemy.burn > 0) {
    ctx.fillStyle = "#ff7048";
    for (const x of [-8, 4]) {
      ctx.beginPath();
      ctx.moveTo(x, -31);
      ctx.quadraticCurveTo(x + 7, -25, x + 1, -18);
      ctx.quadraticCurveTo(x - 5, -24, x, -31);
      ctx.fill();
    }
  }
  ctx.restore();

  if (enemy.attackFlash > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(enemy.attackFlash / 0.24, 0, 1);
    ctx.strokeStyle = "#ffd34e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(enemy.x - 14, enemy.y + 8);
    ctx.lineTo(enemy.x + 8, enemy.y + 25);
    ctx.moveTo(enemy.x - 5, enemy.y + 4);
    ctx.lineTo(enemy.x + 15, enemy.y + 19);
    ctx.stroke();
    ctx.restore();
  }

  const barW = Math.max(24, (enemy.type === "boss" ? 48 : 36) * s);
  const barY = enemy.y - (enemy.type === "boss" ? 61 : 50) * s;
  const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  fillRound(enemy.x - barW / 2 - 1, barY - 1, barW + 2, 6, 3, "rgba(12,20,15,0.88)");
  fillRound(enemy.x - barW / 2, barY, barW * hpRatio, 4, 2,
    hpRatio < 0.3 ? "#ee5a48" : "#73d68d");
  if (enemy.maxShield > 0 && enemy.shield > 0) {
    const shieldRatio = enemy.shield / enemy.maxShield;
    fillRound(enemy.x - barW / 2 - 1, barY - 7, barW + 2, 5, 2.5, "#173241");
    fillRound(enemy.x - barW / 2, barY - 6, barW * shieldRatio, 3, 1.5, "#66d9ff");
  }
  if (state.focusTarget === enemy) {
    const pulse = 0.6 + Math.sin(state.time * 6) * 0.25;
    const cr = (enemy.type === "boss" ? 38 : 26) * s;
    ctx.save();
    ctx.strokeStyle = `rgba(255,100,80,${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - 8 * s, cr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const len = 6 * s;
    ctx.strokeStyle = `rgba(255,100,80,${pulse + 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x - len, enemy.y - 8 * s);
    ctx.lineTo(enemy.x + len, enemy.y - 8 * s);
    ctx.moveTo(enemy.x, enemy.y - 8 * s - len);
    ctx.lineTo(enemy.x, enemy.y - 8 * s + len);
    ctx.stroke();
    fillRound(enemy.x - 16, barY - 14, 32, 10, 5, "rgba(130,35,35,0.88)");
    text("集火", enemy.x, barY - 9, 6, "#fff4c5");
    ctx.restore();
  }
}

function drawGunnerMagazine(index) {
  const loadedTypes = gunnerAmmoTypes(index);
  const capacity = state.gunnerMagCapacity;
  const gap = capacity <= 5 ? 7 : 5;
  const width = capacity <= 5 ? 5 : 4;
  const startX = -((capacity - 1) * gap + width) / 2;
  for (let slot = 0; slot < capacity; slot++) {
    fillRound(startX + slot * gap, 19, width, 5, 1.5,
      loadedTypes[slot] ? ammoMeta[loadedTypes[slot]].color : "rgba(23,35,28,0.55)");
    strokeRound(startX + slot * gap, 19, width, 5, 1.5, "#17231c", 0.8);
  }
}

function drawDefenseDurability(position, health, yOffset) {
  const barWidth = 38;
  fillRound(position.x - barWidth / 2, position.y + yOffset, barWidth, 4, 2, "rgba(23,35,28,0.74)");
  fillRound(
    position.x - barWidth / 2,
    position.y + yOffset,
    barWidth * clamp(health / DEFENSE_MAX_HP, 0, 1),
    4,
    2,
    health <= 1 ? "#ee5a48" : "#65d18a"
  );
}

function drawFocusedDefense() {
  const target = state.focusDefenseTarget;
  if (!target || state.wallHealth > 0 || defenseHealth(target) <= 0) return;
  const targetKey = defenseTargetKey(target);
  const activelyTargeted = state.enemies.some(enemy =>
    (enemy.movement === "approachingDefense" || enemy.movement === "attackingDefense") &&
    enemy.attackTarget &&
    defenseTargetKey(enemy.attackTarget) === targetKey
  );
  if (!activelyTargeted) return;
  const position = defensePosition(target);
  const pulse = 0.5 + Math.sin(state.time * 8) * 0.15;
  ctx.save();
  ctx.strokeStyle = `rgba(255,196,61,${pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.ellipse(
    position.x,
    position.y + 4,
    target.kind === "cannon" ? 38 : 33,
    target.kind === "cannon" ? 31 : 27,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);
  fillRound(position.x - 28, position.y - 62, 56, 17, 5, "rgba(91,45,42,0.92)");
  text("正在拆除", position.x, position.y - 53.5, 8, "#fff4c5");
  ctx.restore();
}

function drawBrokenDefense(position, label, yOffset) {
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.fillStyle = "rgba(23,35,28,0.36)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 29, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#282e2a";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-13, 10);
  ctx.lineTo(12, -11);
  ctx.moveTo(-11, -9);
  ctx.lineTo(14, 9);
  ctx.stroke();
  ctx.fillStyle = "rgba(40,46,42,0.7)";
  ctx.beginPath();
  ctx.arc(-9, -12, 5, 0, Math.PI * 2);
  ctx.arc(8, -16, 4, 0, Math.PI * 2);
  ctx.fill();
  fillRound(-24, 24, 48, 13, 6, "rgba(91,45,42,0.9)");
  text(`${label} · 待维修`, 0, 30.5, 7, "#ffb09d");
  ctx.restore();
  drawDefenseDurability(position, 0, yOffset);
}

function gunnerWeaponTimer(index, type) {
  if (type === "machine") return state.weaponTimers.machine;
  if (type === "sniper") return state.weaponTimers.sniper;
  return state.gunTimers[index];
}

function gunnerWeaponCooldown(type) {
  if (type === "machine") return Math.max(0.09, 0.17 - (state.gunnerLevel - 1) * 0.012);
  if (type === "sniper") return Math.max(0.9, 1.75 - (state.gunnerLevel - 1) * 0.1);
  return gunCooldown();
}

function gunnerWeaponAimAngle(index, type) {
  if (type === "machine") return state.weaponAimAngles.machine || 0;
  if (type === "sniper") return state.weaponAimAngles.sniper || 0;
  return state.gunnerAimAngles[index] || 0;
}

function drawGunnerWeapon(position, index, type = "rifle") {
  const health = state.gunnerHealth[index] || 0;
  if (health <= 0) {
    drawBrokenDefense(position, `枪${index + 1}`, 41);
    return;
  }
  const timer = gunnerWeaponTimer(index, type);
  const cooldown = gunnerWeaponCooldown(type);
  const recoilWindow = type === "machine" ? 0.035 : type === "sniper" ? 0.1 : 0.055;
  const recoil = timer > cooldown - recoilWindow ? (type === "sniper" ? 4 : 3) : 0;
  const uniform = type === "sniper" ? "#35546a" : type === "machine" ? "#4b604a" : "#40583f";
  const accent = type === "sniper" ? "#66d9ff" : type === "machine" ? "#ffc43d" : "#9fc078";

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.fillStyle = "rgba(10,18,13,0.34)";
  ctx.beginPath();
  ctx.ellipse(2, 20, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#675d43";
  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 2.5;
  for (const x of [-15, 0, 15]) {
    ctx.beginPath();
    ctx.ellipse(x, 13 + Math.abs(x) * 0.08, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, 4);
  ctx.lineTo(-10, 16);
  ctx.moveTo(8, 4);
  ctx.lineTo(10, 16);
  ctx.stroke();

  fillRound(-12, -6, 24, 22, 6, uniform);
  strokeRound(-12, -6, 24, 22, 6, "#17231c", 2.5);
  ctx.fillStyle = accent;
  ctx.fillRect(-8, -2, 4, 12);
  fillRound(-5, 5, 10, 7, 2, "rgba(18,29,23,0.64)");

  ctx.fillStyle = "#ffd09b";
  ctx.beginPath();
  ctx.arc(-2, -13, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = type === "sniper" ? "#334c57" : "#4c633d";
  ctx.beginPath();
  ctx.arc(-2, -17, 10, Math.PI, Math.PI * 2);
  ctx.lineTo(9, -14);
  ctx.lineTo(-13, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(-7, -21, 10, 3);

  ctx.save();
  ctx.rotate(gunnerWeaponAimAngle(index, type));
  ctx.translate(2, recoil - 4);
  if (type === "machine") {
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(-10, 17);
    ctx.moveTo(0, 4);
    ctx.lineTo(11, 17);
    ctx.stroke();
    fillRound(-7, -17, 14, 20, 4, "#4f5d52");
    strokeRound(-7, -17, 14, 20, 4, "#17231c", 2.5);
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-3, -14);
    ctx.lineTo(-1, -37);
    ctx.moveTo(4, -14);
    ctx.lineTo(6, -37);
    ctx.stroke();
    ctx.strokeStyle = "#89988a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -15);
    ctx.lineTo(-1, -37);
    ctx.moveTo(4, -15);
    ctx.lineTo(6, -37);
    ctx.stroke();
    fillRound(8, -10, 10, 12, 2, "#9c6a2d");
    strokeRound(8, -10, 10, 12, 2, "#17231c", 2);
  } else if (type === "sniper") {
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(5, -39);
    ctx.stroke();
    ctx.strokeStyle = "#7593a2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(5, -39);
    ctx.stroke();
    ctx.fillStyle = "#263c48";
    ctx.fillRect(-4, -20, 13, 5);
    ctx.strokeRect(-4, -20, 13, 5);
    ctx.fillStyle = "#66d9ff";
    ctx.beginPath();
    ctx.arc(7, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17231c";
    ctx.fillRect(1, -43, 9, 5);
  } else {
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(5, -32);
    ctx.stroke();
    ctx.strokeStyle = "#7f9082";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(5, -32);
    ctx.stroke();
    ctx.fillStyle = "#17231c";
    ctx.fillRect(0, -35, 10, 5);
  }
  ctx.restore();

  drawGunnerMagazine(index);
  if (gunnerAmmoCount(index) === 0 && state.waveActive) {
    const starvePulse = 0.5 + Math.sin(state.time * 8) * 0.5;
    ctx.save();
    ctx.globalAlpha = starvePulse;
    fillRound(-10, -42, 20, 16, 8, "rgba(238,90,72,0.92)");
    text("!", 0, -34, 11, "#fff4c5");
    ctx.restore();
  }
  fillRound(-20, 24, 40, 13, 6, "rgba(23,35,28,0.82)");
  const typeMark = type === "machine" ? "机" : type === "sniper" ? "狙" : String(index + 1);
  text(`${typeMark} · 强${state.gunnerLevel}`, 0, 30.5, 7, "#fff4c5");
  ctx.restore();
  drawDefenseDurability(position, health, 41);
  {
    const skillCfg = type === "machine" ? { color: "#69b9ff", label: "弹雨", dur: 4.0 }
      : type === "sniper" ? { color: "#c97dff", label: "穿甲弹", dur: 15.0 }
      : { color: "#ff7048", label: "弹幕", dur: 3.0 };
    const skillActive = state.gunnerSkillActive[index] || 0;
    if (skillActive > 0) {
      const barW = 38;
      const barY = position.y + 48;
      fillRound(position.x - barW / 2, barY, barW, 5, 2, "rgba(23,35,28,0.74)");
      fillRound(position.x - barW / 2, barY, barW * clamp(skillActive / skillCfg.dur, 0, 1), 5, 2, skillCfg.color);
      const pulse = 0.6 + Math.sin(state.time * 12) * 0.4;
      ctx.save();
      ctx.globalAlpha = pulse;
      strokeRound(position.x - 22, position.y - 22, 44, 68, 8, skillCfg.color, 2.5);
      ctx.restore();
      text(skillCfg.label, position.x, position.y - 28, 9, skillCfg.color, "center", 900);
    } else {
      const charge = state.gunnerSkillCharge[index] || 0;
      if (charge > 0) {
        const barW = 38;
        const barY = position.y + 48;
        fillRound(position.x - barW / 2, barY, barW, 5, 2, "rgba(23,35,28,0.74)");
        const chargeFill = barW * clamp(charge / 100, 0, 1);
        fillRound(position.x - barW / 2, barY, chargeFill, 5, 2, charge >= 100 ? "#ffc43d" : skillCfg.color);
        if (charge >= 100) {
          const pulse = 0.5 + Math.sin(state.time * 6) * 0.3;
          ctx.save();
          ctx.globalAlpha = pulse;
          strokeRound(position.x - 22, position.y - 22, 44, 68, 8, "#ffc43d", 2);
          ctx.restore();
          text("⚡", position.x, position.y - 28, 10, "#ffc43d");
        }
      }
    }
  }
}

function drawGun(position, index) {
  drawGunnerWeapon(position, index, "rifle");
}

function drawCannon(position, index, type = "cannon") {
  const health = state.cannonHealth[index] || 0;
  if (health <= 0) {
    drawBrokenDefense(position, `炮${index + 1}`, 47);
    return;
  }
  const timer = type === "mortar" ? state.weaponTimers.mortar : state.cannonTimers[index];
  const cooldown = type === "mortar" ? mortarCooldown() : cannonCooldown();
  const recoil = timer > cooldown - 0.12 ? 5 : 0;
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.fillStyle = "rgba(10,18,13,0.36)";
  ctx.beginPath();
  ctx.ellipse(2, 23, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 3;
  fillRound(-27, 7, 54, 18, 7, "#303b39");
  strokeRound(-27, 7, 54, 18, 7, "#17231c", 3);
  ctx.fillStyle = "#68736d";
  for (const x of [-19, -6, 7, 20]) {
    ctx.beginPath();
    ctx.arc(x, 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#28322f";
  ctx.fillRect(-24, 11, 48, 3);

  ctx.fillStyle = type === "mortar" ? "#66547f" : "#406d78";
  ctx.beginPath();
  ctx.arc(0, 6, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = type === "mortar" ? "#8a71ad" : "#5b93a2";
  ctx.beginPath();
  ctx.arc(0, 4, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d09a32";
  for (const x of [-11, 11]) {
    ctx.beginPath();
    ctx.arc(x, 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  const aimAngle = type === "mortar"
    ? state.weaponAimAngles.mortar || 0
    : state.cannonAimAngles[index] || 0;
  ctx.rotate(aimAngle);
  ctx.translate(0, recoil);
  if (type === "mortar") {
    fillRound(-10, -34, 20, 38, 6, "#77608e");
    strokeRound(-10, -34, 20, 38, 6, "#17231c", 3);
    ctx.fillStyle = "#282033";
    ctx.beginPath();
    ctx.ellipse(0, -33, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#9f83bd";
    ctx.beginPath();
    ctx.ellipse(0, -32, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    fillRound(-7, -39, 14, 42, 4, "#557f89");
    strokeRound(-7, -39, 14, 42, 4, "#17231c", 3);
    ctx.fillStyle = "#8eb1b6";
    ctx.fillRect(-3, -35, 3, 31);
    fillRound(-11, -44, 22, 8, 2, "#293735");
    strokeRound(-11, -44, 22, 8, 2, "#17231c", 2.5);
    ctx.fillStyle = "#d09a32";
    ctx.fillRect(-7, -42, 14, 2);
  }
  ctx.restore();
  text(type === "mortar" ? "M" : String(index + 1), 0, 5, 10, "#fff4c5");
  const loadedTypes = cannonAmmoTypes(index);
  const capacity = state.cannonMagCapacity;
  const gap = capacity <= 2 ? 13 : 10;
  const width = capacity <= 2 ? 9 : 7;
  const startX = -((capacity - 1) * gap + width) / 2;
  for (let slot = 0; slot < capacity; slot++) {
    fillRound(startX + slot * gap, 21, width, 6, 2,
      loadedTypes[slot] ? ammoMeta[loadedTypes[slot]].color : "rgba(23,35,28,0.55)");
    strokeRound(startX + slot * gap, 21, width, 6, 2, "#17231c", 1);
  }
  if (cannonAmmoCount(index) === 0 && state.waveActive) {
    const starvePulse = 0.5 + Math.sin(state.time * 8) * 0.5;
    ctx.save();
    ctx.globalAlpha = starvePulse;
    fillRound(-10, -50, 20, 16, 8, "rgba(238,90,72,0.92)");
    text("!", 0, -42, 11, "#fff4c5");
    ctx.restore();
  }
  fillRound(-22, 30, 44, 13, 6, "rgba(23,35,28,0.82)");
  text(`${index + 1} · 强${state.cannonLevel}`, 0, 36.5, 7, "#fff4c5");
  ctx.restore();
  drawDefenseDurability(position, health, 47);
  {
    const cSkillColor = type === "mortar" ? "#ff5733" : "#ff9d43";
    const charge = state.cannonSkillCharge[index] || 0;
    if (charge > 0) {
      const barW = 42;
      const barY = position.y + 54;
      fillRound(position.x - barW / 2, barY, barW, 5, 2, "rgba(23,35,28,0.74)");
      const chargeFill = barW * clamp(charge / 100, 0, 1);
      fillRound(position.x - barW / 2, barY, chargeFill, 5, 2, charge >= 100 ? "#ffc43d" : cSkillColor);
      if (charge >= 100) {
        const pulse = 0.5 + Math.sin(state.time * 6) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        strokeRound(position.x - 26, position.y - 28, 52, 80, 8, "#ffc43d", 2);
        ctx.restore();
        text("⚡", position.x, position.y - 34, 10, "#ffc43d");
      }
    }
  }
}

function drawExtraWeapons() {
  const machineIndex = state.specialSlots.machine;
  if (state.unlocks.machine && Number.isInteger(machineIndex)) {
    const position = GUN_SLOTS[machineIndex];
    drawGunnerWeapon(position, machineIndex, "machine");
  }

  const sniperIndex = state.specialSlots.sniper;
  if (state.unlocks.sniper && Number.isInteger(sniperIndex)) {
    const position = GUN_SLOTS[sniperIndex];
    drawGunnerWeapon(position, sniperIndex, "sniper");
  }
}

function drawProjectile(projectile) {
  const color = ammoMeta[projectile.ammoType]?.color || "#ffc43d";
  const depth = roadDepthScale(projectile.y);
  const renderY = projectile.y - projectile.height;
  const direction = (projectile.renderAngle ?? Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2) - Math.PI / 2;

  ctx.save();
  ctx.translate(projectile.x, projectile.y + 1);
  const shadowAlpha = projectile.kind === "shell"
    ? lerp(0.3, 0.08, clamp(projectile.height / 120, 0, 1))
    : 0.17;
  ctx.fillStyle = `rgba(13,22,17,${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, (projectile.kind === "shell" ? 8 : 5) * depth, 2.2 * depth, direction, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(projectile.x, renderY);
  ctx.rotate(direction + Math.PI / 2);
  if (projectile.kind === "shell") {
    ctx.scale(depth, depth);
    ctx.strokeStyle = "rgba(214,218,202,0.34)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(0, 23);
    ctx.stroke();
    ctx.strokeStyle = "rgba(68,78,69,0.46)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 19);
    ctx.stroke();
    ctx.shadowColor = color;
    ctx.shadowBlur = 7;
    const shellGradient = ctx.createLinearGradient(-6, 0, 6, 0);
    shellGradient.addColorStop(0, "#2e2434");
    shellGradient.addColorStop(0.35, color);
    shellGradient.addColorStop(0.72, color);
    shellGradient.addColorStop(1, "#241c29");
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = "#382345";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, -2);
    ctx.lineTo(5, 8);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d5a13b";
    ctx.fillRect(-5, 2, 10, 3);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillRect(-2.5, -4, 1.5, 8);
  } else {
    const streak = projectile.weapon === "sniper" ? 22 : 13;
    ctx.strokeStyle = "rgba(255,244,197,0.2)";
    ctx.lineWidth = projectile.weapon === "sniper" ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(0, streak + 5);
    ctx.lineTo(0, -2);
    ctx.stroke();
    ctx.shadowColor = color;
    ctx.shadowBlur = projectile.weapon === "sniper" ? 10 : 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = projectile.weapon === "sniper" ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(0, streak);
    ctx.lineTo(0, -3);
    ctx.stroke();
    ctx.strokeStyle = "#fff4c5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    const velocity = Math.hypot(p.vx, p.vy);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.color;
    ctx.fillStyle = p.color;
    if (velocity > 75) {
      const length = Math.min(10, p.size + velocity * 0.025);
      const nx = p.vx / velocity;
      const ny = p.vy / velocity;
      ctx.lineWidth = Math.max(1, p.size * 0.48);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - nx * length, p.y - ny * length);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.ring) {
      const progress = 1 - p.life / p.maxLife;
      const radius = p.ringMax * progress;
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, 4 * (1 - progress));
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.size > 3.8) {
      ctx.globalAlpha = alpha * 0.22;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  for (const f of state.floaters) {
    ctx.globalAlpha = clamp(f.life / 0.35, 0, 1);
    text(f.value, f.x, f.y, 13, f.color);
  }
  ctx.globalAlpha = 1;
}

const enemyTypeNames = {
  grunt: "步兵", runner: "跑者", tank: "坦克", saboteur: "破坏者",
  healer: "治疗", shielded: "盾兵", berserker: "狂战",
  charger: "冲锋", splitter: "分裂", bomber: "爆破",
  necro: "法师", tunneler: "潜地", titan: "泰坦"
};
const enemyTypeColors = {
  grunt: "#6fc4b5", runner: "#5dd2c3", tank: "#87917b", saboteur: "#d49a58",
  healer: "#7ee0b3", shielded: "#6a9ac4", berserker: "#c45a5a",
  charger: "#e09848", splitter: "#5cc48a", bomber: "#cc5544",
  necro: "#9a5ab8", tunneler: "#a89060", titan: "#8099aa"
};

function drawWaveLabel() {
  const canSpawn = state.endless || state.wave < waveBook.length;
  if (!state.waveActive && canSpawn && state.waveTimer > 0) {
    fillRound(232, 122, 128, 28, 14, "rgba(23,35,28,0.78)");
    const label = state.endless ? "下一波" : currentStageWave() === 1 ? "关卡准备" : "下一波";
    text(label, 267, 136, 11, state.endless ? "#ff9d43" : "#9ac4a2");
    text(Math.max(1, Math.ceil(state.waveTimer)), 334, 136, 15, "#fff4c5");
    if (!state.endless && currentStageWave() === 1) {
      const lore = stageLore[currentStageNumber() - 1];
      if (lore) {
        fillRound(30, 192, W - 60, 52, 10, "rgba(23,35,28,0.88)");
        strokeRound(30, 192, W - 60, 52, 10, "#3b5042", 1.5);
        text(`第${currentStageNumber()}关 · ${lore.title}`, W / 2, 210, 12, "#fff4c5", "center", 800);
        text(lore.desc, W / 2, 230, 8, "#9ac4a2");
      }
    }
    if (state.wavePreview) {
      const entries = Object.entries(state.wavePreview).filter(([, c]) => c > 0);
      if (entries.length > 0) {
        const pw = Math.min(entries.length * 52 + 80, W - 20);
        const px = (W - pw) / 2;
        fillRound(px, 154, pw, 22, 8, "rgba(23,35,28,0.78)");
        text("侦察:", px + 30, 165, 8, "#9ac4a2");
        let cx = px + 56;
        for (const [t, c] of entries) {
          const name = enemyTypeNames[t] || t;
          const col = enemyTypeColors[t] || "#fff4c5";
          text(`${name}×${c}`, cx, 165, 7, col);
          cx += 44;
        }
      }
    }
    if (state.nextMutator) {
      const m = state.nextMutator;
      const mutColors = { swarm: "#ff9d43", armored: "#8899aa", sprint: "#5dd2c3", regen: "#7ee0b3", shield: "#6a9ac4", elite: "#c97dff", fog: "#a0a0a0" };
      const mc = mutColors[m.key] || "#fff4c5";
      fillRound(125, 178, 150, 18, 9, "rgba(23,35,28,0.88)");
      strokeRound(125, 178, 150, 18, 9, mc, 1.5);
      text(`词条: ${m.label} — ${m.desc}`, 200, 187, 7, mc);
    }
  }
  const currentWave = getWave(state.wave);
  if (currentWave?.type === "boss" && state.waveActive) {
    fillRound(232, 122, 128, 28, 14, "rgba(130,39,49,0.9)");
    text(currentWave.bossName, 296, 136, 12, "#fff4c5");
  }
  if (state.waveActive && currentWave?.mutator) {
    const m = currentWave.mutator;
    const mutColors = { swarm: "#ff9d43", armored: "#8899aa", sprint: "#5dd2c3", regen: "#7ee0b3", shield: "#6a9ac4", elite: "#c97dff", fog: "#a0a0a0" };
    const mc = mutColors[m.key] || "#fff4c5";
    fillRound(12, 104, 88, 18, 9, "rgba(23,35,28,0.85)");
    strokeRound(12, 104, 88, 18, 9, mc, 1.5);
    text(`${m.label}: ${m.desc}`, 56, 113, 7, mc);
  }
  if (state.fogPenalty > 0 && state.waveActive) {
    const fogY = PLAY_TOP + (GATE_Y - PLAY_TOP) * state.fogPenalty;
    const grad = ctx.createLinearGradient(0, PLAY_TOP, 0, fogY + 40);
    grad.addColorStop(0, "rgba(80,90,80,0.35)");
    grad.addColorStop(0.7, "rgba(80,90,80,0.12)");
    grad.addColorStop(1, "rgba(80,90,80,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(ROAD.x, PLAY_TOP, ROAD.w, fogY - PLAY_TOP + 40);
  }
}

function drawShopIcon(key, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#17231c";
  ctx.fillStyle = color;
  ctx.lineWidth = 3;

  if (key === "production") {
    for (let i = -1; i <= 1; i++) {
      fillRound(i * 7 - 3, -14, 6, 25, 2, "#ffc43d");
      strokeRound(i * 7 - 3, -14, 6, 25, 2, "#8d531a", 1.8);
    }
  } else if (key === "gunner") {
    ctx.fillStyle = "#ffd09b";
    ctx.beginPath();
    ctx.arc(0, -8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4c633d";
    ctx.beginPath();
    ctx.arc(0, -11, 8, Math.PI, Math.PI * 2);
    ctx.lineTo(8, -9);
    ctx.lineTo(-8, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#17231c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.lineTo(5, -19);
    ctx.stroke();
  } else if (key === "cannon") {
    fillRound(-7, -16, 14, 25, 4, color);
    strokeRound(-7, -16, 14, 25, 4, "#17231c", 3);
    ctx.beginPath();
    ctx.arc(0, 9, 13, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (key === "wall") {
    ctx.fillStyle = "#6a7a8a";
    fillRound(-14, -6, 28, 20, 3, "#6a7a8a");
    strokeRound(-14, -6, 28, 20, 3, "#17231c", 2.5);
    fillRound(-12, -14, 8, 10, 2, "#8899aa");
    fillRound(-2, -14, 8, 10, 2, "#8899aa");
    fillRound(4, -14, 8, 10, 2, "#8899aa");
    ctx.fillStyle = "#aabbcc";
    ctx.fillRect(-10, 0, 4, 6);
    ctx.fillRect(-2, 0, 4, 6);
    ctx.fillRect(6, 0, 4, 6);
  } else {
    ctx.fillStyle = "#ffd09b";
    ctx.beginPath();
    ctx.arc(0, -8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    roundedRect(-9, -1, 18, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 15);
    ctx.lineTo(-10, 22);
    ctx.moveTo(7, 15);
    ctx.lineTo(10, 22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShop() {
  ctx.fillStyle = "#17231c";
  ctx.fillRect(0, SHOP_TOP, W, H - SHOP_TOP);
  ctx.fillStyle = "#2b3c31";
  ctx.fillRect(0, SHOP_TOP, W, 6);

  shop.forEach((item, index) => {
    const columnWidth = W / shop.length;
    const x = 5 + index * columnWidth;
    const w = columnWidth - 10;
    const cost = item.cost();
    const maxed = item.maxed?.() || false;
    const affordable = !maxed && state.coins >= cost;
    const label = typeof item.label === "function" ? item.label() : item.label;
    const status = item.status ? item.status() : `LV.${item.level()}`;
    const buttonLabel = maxed ? "已满" : item.buttonLabel ? item.buttonLabel() : "升级";

    fillRound(x, SHOP_TOP + 13, w, 120, 7, affordable ? "#fff4c5" : "#b7b49e");
    strokeRound(x, SHOP_TOP + 13, w, 120, 7, "#0d1711", 3);
    ctx.fillStyle = item.color;
    ctx.fillRect(x + 3, SHOP_TOP + 16, w - 6, 36);
    drawShopIcon(item.key, x + 22, SHOP_TOP + 34, item.color);
    text(label, x + 62, SHOP_TOP + 28, 11, "#17231c");
    text(status, x + 62, SHOP_TOP + 42, 8, "#315340", "center", 800);
    if (item.desc && !maxed) {
      const descText = item.desc();
      if (descText.length > 12) {
        const mid = Math.ceil(descText.length / 2);
        const breakIdx = descText.lastIndexOf("，", mid);
        const splitAt = breakIdx > 0 ? breakIdx + 1 : mid;
        text(descText.slice(0, splitAt), x + w / 2, SHOP_TOP + 60, 8, "#4d5b52");
        text(descText.slice(splitAt), x + w / 2, SHOP_TOP + 71, 8, "#4d5b52");
      } else {
        text(descText, x + w / 2, SHOP_TOP + 64, 9, "#4d5b52");
      }
    }
    if (!maxed) drawCoin(x + 18, SHOP_TOP + 92, 7);
    text(maxed ? "MAX" : String(cost), x + 54, SHOP_TOP + 92, 13,
      affordable ? "#17231c" : "#6f7067");
    fillRound(x + 10, SHOP_TOP + 108, w - 20, 16, 8, affordable ? "#ffc43d" : "#7c7e74");
    text(buttonLabel, x + w / 2, SHOP_TOP + 116, 9, affordable ? "#17231c" : "#d5d2bd");

    const flash = state.shopFlash?.[index] || 0;
    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = flash * 2;
      fillRound(x, SHOP_TOP + 13, w, 120, 7, "#ffffff");
      ctx.restore();
      state.shopFlash[index] = Math.max(0, flash - 0.016);
    }
  });
}

function drawStatusPanel() {
  ctx.fillStyle = "rgba(13,23,17,0.88)";
  ctx.fillRect(0, 0, W, H);
  fillRound(15, 30, W - 30, H - 60, 12, "#1a2b22");
  strokeRound(15, 30, W - 30, H - 60, 12, "#3b5042", 2);
  text("—— 详细状态 ——", W / 2, 52, 14, "#fff4c5", "center", 800);
  fillRound(W - 60, 36, 36, 20, 6, "#ff8874");
  text("关闭", W - 42, 46, 9, "#17231c");

  let y = 74;
  const lx = 30, rx = W / 2 + 10;

  const cw = getWave(state.wave);
  if (cw) {
    text("【当前波次】", lx, y, 11, "#fff4c5", "left", 800);
    y += 16;
    const stageText = cw.stage ? (state.endless ? `无尽阶段 ${cw.stage} · ` : `第 ${cw.stage} 关`) : "";
    const waveText = state.endless ? `${cw.stageWave}/${WAVES_PER_STAGE}` : `第 ${cw.stageWave}/${WAVES_PER_STAGE} 波`;
    text(stageText + waveText + (cw.mutator ? ` · ${cw.mutator.label}` : ""), lx, y, 9, cw.mutator ? "#ff9d43" : "#9ac4a2", "left", 800);
    y += 14;
    const comp = waveComposition(cw);
    const entries = Object.entries(comp).filter(([, c]) => c > 0);
    let cx = lx;
    for (const [t, c] of entries) {
      const name = enemyTypeNames[t] || t;
      const col = enemyTypeColors[t] || "#fff4c5";
      const tw = ctx.measureText(name + "×" + c).width * 0.6;
      if (cx + tw + 8 > W - lx) { cx = lx; y += 14; }
      text(`${name}×${c}`, cx, y, 8, col, "left");
      cx += tw + 12;
    }
    y += 20;
  }

  text("【枪手】", lx, y, 11, "#ee6d55", "left", 800);
  y += 18;
  const gMult = 1 + (state.gunnerLevel - 1) * 0.1;
  const gDmg = Math.round((13 + state.productionLevel * 2 + state.gunnerLevel * 3) * 100) / 100;
  const gRate = gunCooldown();
  text(`数量: ${state.gunnerCount}/3`, lx, y, 9, "#d5d2bd", "left");
  text(`强化: LV.${state.gunnerLevel}`, rx, y, 9, "#d5d2bd", "left");
  y += 14;
  text(`基础伤害: ${gDmg}`, lx, y, 9, "#fff4c5", "left");
  text(`射速: ${gRate.toFixed(2)}s`, rx, y, 9, "#fff4c5", "left");
  y += 14;
  text(`暴击率: ${(state.critChance * 100).toFixed(0)}%`, lx, y, 9, "#ffc43d", "left");
  text(`暴击倍率: 1.75x`, rx, y, 9, "#ffc43d", "left");
  y += 14;
  text(`弹匣容量: ${state.gunnerMagCapacity}`, lx, y, 9, "#d5d2bd", "left");
  y += 20;

  text("【炮台】", lx, y, 11, "#ff9d43", "left", 800);
  y += 18;
  const cDmg = 54 + state.cannonLevel * 20;
  const cRate = cannonCooldown();
  const blastR = Math.round((48 + state.cannonLevel * 3) * (1 + state.blastRadiusBonus));
  text(`数量: ${state.cannonCount}/3`, lx, y, 9, "#d5d2bd", "left");
  text(`强化: LV.${state.cannonLevel}`, rx, y, 9, "#d5d2bd", "left");
  y += 14;
  text(`基础伤害: ${cDmg}`, lx, y, 9, "#fff4c5", "left");
  text(`射速: ${cRate.toFixed(2)}s`, rx, y, 9, "#fff4c5", "left");
  y += 14;
  text(`爆炸范围: ${blastR}px`, lx, y, 9, "#d8a3ff", "left");
  text(`弹匣容量: ${state.cannonMagCapacity}`, rx, y, 9, "#d5d2bd", "left");
  y += 14;
  text(`爆炸衰减: 中心100%→边缘35%`, lx, y, 9, "#d8a3ff", "left");
  y += 20;

  text("【城防】", lx, y, 11, "#8899aa", "left", 800);
  y += 18;
  const wallMax = WALL_MAX_HP + (state.wallLevel || 0) * 2;
  text(`城墙: ${state.wallHealth}/${wallMax}`, lx, y, 9, "#fff4c5", "left");
  text(`城防等级: LV.${state.wallLevel || 0}/5`, rx, y, 9, "#fff4c5", "left");
  y += 14;
  text(`基地生命: ${state.lives}/${state.gateMax}`, lx, y, 9, "#ff8874", "left");
  text(`维修加速: ${((state.defenseRepairBonus || 0) * 100).toFixed(0)}%`, rx, y, 9, "#65d18a", "left");
  y += 20;

  text("【生产】", lx, y, 11, "#69b9ff", "left", 800);
  y += 18;
  const ammoInterval = Math.max(0.28, 0.78 - state.productionLevel * 0.055);
  text(`产线等级: LV.${state.productionLevel}`, lx, y, 9, "#d5d2bd", "left");
  text(`产弹间隔: ${ammoInterval.toFixed(2)}s`, rx, y, 9, "#d5d2bd", "left");
  y += 14;
  text(`传送带速度: +${((state.beltSpeedBonus || 0) * 100).toFixed(0)}%`, lx, y, 9, "#fff4c5", "left");
  text(`弹药效率: +${((state.ammoEfficiency || 0) * 100).toFixed(0)}%`, rx, y, 9, "#fff4c5", "left");
  y += 14;
  text(`搬运工: ${state.workers.length}人`, lx, y, 9, "#65d18a", "left");
  y += 20;

  text("【增益】", lx, y, 11, "#ffc43d", "left", 800);
  y += 18;
  text(`伤害加成: +${((state.damageBonus || 0) * 100).toFixed(0)}%`, lx, y, 9, "#fff4c5", "left");
  text(`击杀奖励: +${((state.killCoinBonus || 0) * 100).toFixed(0)}%`, rx, y, 9, "#ffc43d", "left");
  y += 14;
  text(`燃烧延长: +${((state.burnDurationBonus || 0) * 100).toFixed(0)}%`, lx, y, 9, "#ff7048", "left");
  text(`波次修复: ${state.waveRepair || 0}`, rx, y, 9, "#65d18a", "left");
  y += 20;

  text("【漏怪惩罚】", lx, y, 11, "#ff8874", "left", 800);
  y += 18;
  text("步兵/跑者/坦克/盾兵: -1", lx, y, 9, "#d5d2bd", "left");
  y += 14;
  text("狂战/法师: -2  泰坦: -3", lx, y, 9, "#d5d2bd", "left");
  y += 14;
  text("Boss: -5", lx, y, 9, "#ff8874", "left");
}

function draw() {
  ctx.save();
  drawBackground();
  drawBelt();
  drawRoad();
  const ammoByDepth = [...state.ammoDrops].sort((a, b) => a.y - b.y);
  for (const ammo of ammoByDepth) drawAmmo(ammo);
  const enemiesByDepth = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const enemy of enemiesByDepth) drawEnemy(enemy);
  for (const projectile of state.projectiles) drawProjectile(projectile);
  drawDepot();
  for (const worker of state.workers) drawWorker(worker);
  for (let i = 0; i < state.gunnerCount; i++) {
    if (!gunnerSpecialAt(i)) drawGun(GUN_SLOTS[i], i);
  }
  drawExtraWeapons();
  for (let i = 0; i < state.cannonCount; i++) {
    const type = cannonSpecialAt(i) || "cannon";
    drawCannon(CANNON_SLOTS[i], i, type);
  }
  drawFocusedDefense();
  drawRepairProgress();
  drawBeltStatus();
  drawDefenseRows();
  drawWaveLabel();
  for (const zone of state.fireZones) {
    const alpha = clamp(zone.timer / zone.duration, 0, 1) * 0.35;
    const pulse = 1 + Math.sin(state.time * 8) * 0.1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius * pulse);
    grad.addColorStop(0, "#ff7048");
    grad.addColorStop(0.6, "rgba(255,112,72,0.5)");
    grad.addColorStop(1, "rgba(255,196,61,0)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }
  drawParticles();
  drawHeader();
  drawShop();
  if (state.upgradeBranch) {
    const ub = state.upgradeBranch;
    ctx.fillStyle = "rgba(13,23,17,0.7)";
    ctx.fillRect(0, SHOP_TOP - 80, W, 80);
    const bw = (W - 30) / 2;
    for (let i = 0; i < ub.branches.length; i++) {
      const b = ub.branches[i];
      const bx = 10 + i * (bw + 10);
      const by = SHOP_TOP - 74;
      fillRound(bx, by, bw, 68, 8, "#fff4c5");
      strokeRound(bx, by, bw, 68, 8, b.color, 3);
      ctx.fillStyle = b.color;
      ctx.fillRect(bx + 4, by + 3, bw - 8, 22);
      text(b.title, bx + bw / 2, by + 14, 12, "#17231c", "center", 800);
      text(b.desc, bx + bw / 2, by + 38, 10, "#4d5b52");
      fillRound(bx + 15, by + 50, bw - 30, 14, 7, b.color);
      text("选择", bx + bw / 2, by + 57, 9, "#17231c");
    }
    text("—— 选择强化路线 ——", W / 2, SHOP_TOP - 78, 9, "#fff4c5");
  }

  if (state.showStatusPanel) drawStatusPanel();
  statusButton.hidden = state.mode !== "playing";

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(238,90,72,${state.flash * 0.28})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.skillFlash) {
    const sf = state.skillFlash;
    const a = clamp(sf.timer * 4, 0, 1) * 0.18;
    ctx.fillStyle = sf.color;
    ctx.globalAlpha = a;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
