"use strict";

const backgroundSpecks = Array.from({ length: 90 }, (_, index) => {
  const xNoise = Math.sin(index * 91.73) * 43758.5453;
  const yNoise = Math.sin(index * 47.21 + 3.7) * 24634.6345;
  const sizeNoise = Math.sin(index * 18.17 + 8.3) * 19341.173;
  return {
    x: (xNoise - Math.floor(xNoise)) * W,
    y: 112 + (yNoise - Math.floor(yNoise)) * (SHOP_TOP - 112),
    size: 0.6 + (sizeNoise - Math.floor(sizeNoise)) * 1.8
  };
});

const roadsidePlants = Array.from({ length: 26 }, (_, index) => {
  const y = 132 + index * 12.7 + (index % 3) * 7;
  const bounds = roadBoundsAt(y);
  const onRight = index % 3 !== 0;
  return {
    x: onRight ? bounds.right + 9 + (index % 4) * 7 : bounds.left - 7 - (index % 2) * 5,
    y,
    size: 2.5 + (index % 4) * 0.9,
    onRight
  };
});

const roadCracks = [
  { lane: 0.26, y: 174, size: 9, flip: 1 },
  { lane: 0.72, y: 218, size: 12, flip: -1 },
  { lane: 0.43, y: 270, size: 15, flip: 1 },
  { lane: 0.82, y: 326, size: 18, flip: 1 },
  { lane: 0.18, y: 368, size: 16, flip: -1 },
  { lane: 0.58, y: 414, size: 20, flip: -1 }
];

function backgroundPolygon(points, fill, stroke = null, lineWidth = 1) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawDistantRuin(x, baseY, width, height, color, roofLoss = 0) {
  ctx.fillStyle = color;
  ctx.fillRect(x, baseY - height, width, height);
  ctx.fillStyle = "#17261e";
  for (let row = 0; row < Math.floor(height / 12); row++) {
    for (let col = 0; col < Math.floor(width / 10); col++) {
      if ((row + col + roofLoss) % 3 === 0) continue;
      ctx.fillRect(x + 4 + col * 10, baseY - height + 5 + row * 12, 3, 5);
    }
  }
  ctx.fillStyle = "#23382b";
  ctx.fillRect(x + width * 0.18, baseY - height - 8 - roofLoss, 3, 10 + roofLoss);
}

function drawSkyAndRuins() {
  const sky = ctx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, "#13231c");
  sky.addColorStop(0.58, "#314737");
  sky.addColorStop(1, "#68705a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 152);

  backgroundPolygon([
    { x: 0, y: 108 },
    { x: 42, y: 74 },
    { x: 82, y: 101 },
    { x: 128, y: 67 },
    { x: 177, y: 105 },
    { x: 231, y: 72 },
    { x: 284, y: 102 },
    { x: 333, y: 64 },
    { x: 386, y: 96 },
    { x: 430, y: 73 },
    { x: 430, y: 145 },
    { x: 0, y: 145 }
  ], "#263a2d");

  drawDistantRuin(10, 128, 32, 60, "#2f4334", 6);
  drawDistantRuin(52, 128, 25, 42, "#354a39", 2);
  drawDistantRuin(116, 126, 34, 67, "#2a3d30", 11);
  drawDistantRuin(344, 130, 31, 74, "#2a3d30", 5);
  drawDistantRuin(384, 130, 39, 52, "#324737", 9);

  ctx.strokeStyle = "rgba(151,161,126,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 126);
  ctx.lineTo(W, 126);
  ctx.stroke();
}

function drawTerrain() {
  const ground = ctx.createLinearGradient(0, 104, 0, SHOP_TOP);
  ground.addColorStop(0, "#6f755c");
  ground.addColorStop(0.55, "#59634f");
  ground.addColorStop(1, "#434e40");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 104, W, SHOP_TOP - 104);

  for (const speck of backgroundSpecks) {
    ctx.fillStyle = speck.x % 3 < 1
      ? "rgba(31,47,36,0.18)"
      : "rgba(183,166,111,0.12)";
    ctx.fillRect(speck.x, speck.y, speck.size * 1.8, speck.size);
  }
}

function drawRoadCrack(crack) {
  const x = roadPointForLane(crack.y, crack.lane);
  const scale = roadDepthScale(crack.y);
  const size = crack.size * scale;
  ctx.strokeStyle = "rgba(42,47,39,0.55)";
  ctx.lineWidth = Math.max(0.7, scale * 1.4);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, crack.y - size * 0.35);
  ctx.lineTo(x, crack.y);
  ctx.lineTo(x + size * 0.45 * crack.flip, crack.y + size * 0.55);
  ctx.moveTo(x, crack.y);
  ctx.lineTo(x - size * 0.35 * crack.flip, crack.y + size * 0.2);
  ctx.stroke();
}

function drawPerspectiveRoad() {
  const stops = [112, 150, 194, 246, 306, 374, GATE_Y];
  const slabColors = ["#797a68", "#737563", "#7d7c69", "#6f725f", "#777765", "#6b6d5d"];

  for (let i = 0; i < stops.length - 1; i++) {
    const top = roadBoundsAt(stops[i]);
    const bottom = roadBoundsAt(stops[i + 1]);
    backgroundPolygon([
      { x: top.left, y: stops[i] },
      { x: top.right, y: stops[i] },
      { x: bottom.right, y: stops[i + 1] },
      { x: bottom.left, y: stops[i + 1] }
    ], slabColors[i], "rgba(51,57,47,0.34)", 1);
  }

  const horizon = roadBoundsAt(112);
  const gate = roadBoundsAt(GATE_Y);
  ctx.strokeStyle = "#485342";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(horizon.left, 112);
  ctx.lineTo(gate.left, GATE_Y);
  ctx.moveTo(horizon.right, 112);
  ctx.lineTo(gate.right, GATE_Y);
  ctx.stroke();

  const dashRows = [
    [146, 164],
    [192, 216],
    [252, 283],
    [323, 363],
    [400, 444]
  ];
  for (const lane of [0.38, 0.7]) {
    for (const [topY, bottomY] of dashRows) {
      const topX = roadPointForLane(topY, lane);
      const bottomX = roadPointForLane(bottomY, lane);
      const widthTop = 1.5 + roadProgress(topY) * 2;
      const widthBottom = 1.5 + roadProgress(bottomY) * 2.5;
      backgroundPolygon([
        { x: topX - widthTop, y: topY },
        { x: topX + widthTop, y: topY },
        { x: bottomX + widthBottom, y: bottomY },
        { x: bottomX - widthBottom, y: bottomY }
      ], "rgba(218,210,164,0.52)");
    }
  }

  roadCracks.forEach(drawRoadCrack);
}

function drawRoadsideDetails() {
  for (const plant of roadsidePlants) {
    if (!plant.onRight && plant.x < BELT.x + BELT.w + 2) continue;
    ctx.fillStyle = plant.onRight ? "#455d39" : "#3e5636";
    ctx.beginPath();
    ctx.arc(plant.x, plant.y, plant.size, 0, Math.PI * 2);
    ctx.arc(plant.x + plant.size * 0.8, plant.y + 1, plant.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#73804b";
    ctx.fillRect(plant.x - 1, plant.y - plant.size, 2, plant.size * 1.5);
  }

  for (let y = 150; y < GATE_Y; y += 52) {
    const bounds = roadBoundsAt(y);
    const scale = roadDepthScale(y);
    ctx.fillStyle = "#555d4f";
    ctx.fillRect(bounds.right + 5, y, 12 * scale, 7 * scale);
    ctx.fillStyle = "#c69d39";
    ctx.fillRect(bounds.right + 7, y + 1, 4 * scale, 2 * scale);
  }
}

function conveyorOuterBoundsAt(y) {
  const progress = beltProgress(y);
  return {
    left: lerp(26, 10, progress),
    right: lerp(151, 160, progress)
  };
}

function drawConveyorRoller(x, y, radius, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "#39443e";
  ctx.strokeStyle = "#16231d";
  ctx.lineWidth = Math.max(1, radius * 0.24);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#8f927f";
  ctx.lineWidth = Math.max(0.8, radius * 0.16);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 0.7, 0);
    ctx.stroke();
  }
  ctx.fillStyle = "#d19a32";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawConveyor() {
  const topY = PLAY_TOP;
  const bottomY = DEPOT.y - 20;
  const topOuter = conveyorOuterBoundsAt(topY);
  const bottomOuter = conveyorOuterBoundsAt(bottomY);
  const topBelt = beltBoundsAt(topY);
  const bottomBelt = beltBoundsAt(bottomY);

  backgroundPolygon([
    { x: topOuter.left, y: topY },
    { x: topOuter.right, y: topY },
    { x: bottomOuter.right, y: bottomY },
    { x: bottomOuter.left, y: bottomY }
  ], "#414b43", "#1c2a23", 3);

  backgroundPolygon([
    { x: topBelt.left, y: topY },
    { x: topBelt.right, y: topY },
    { x: bottomBelt.right, y: bottomY },
    { x: bottomBelt.left, y: bottomY }
  ], "#252e2a", "#111b16", 2);

  const slatOffset = state.beltOffset % 24;
  for (let y = PLAY_TOP - 24 + slatOffset; y < bottomY; y += 24) {
    const belt = beltBoundsAt(y);
    const depth = beltDepthScale(y);
    ctx.strokeStyle = "#626b64";
    ctx.lineWidth = Math.max(1.5, depth * 3);
    ctx.beginPath();
    ctx.moveTo(belt.left + 2, y);
    ctx.lineTo(belt.right - 2, y);
    ctx.stroke();
  }

  for (const side of ["left", "right"]) {
    ctx.strokeStyle = "#92947f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(topBelt[side], topY);
    ctx.lineTo(bottomBelt[side], bottomY);
    ctx.stroke();
    ctx.strokeStyle = "#1c2922";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const markerOffset = state.beltOffset % 66;
  for (let y = PLAY_TOP - 66 + markerOffset; y < bottomY; y += 66) {
    const belt = beltBoundsAt(y);
    const depth = beltDepthScale(y);
    const center = (belt.left + belt.right) / 2;
    const halfWidth = 7 * depth;
    ctx.strokeStyle = state.beltEvent === "jam"
      ? "rgba(213,90,72,0.55)"
      : state.beltEvent === "overload"
        ? "rgba(255,211,77,0.92)"
        : "rgba(209,154,50,0.58)";
    ctx.lineWidth = Math.max(1.2, depth * 2);
    ctx.beginPath();
    ctx.moveTo(center - halfWidth, y - 3 * depth);
    ctx.lineTo(center, y + 4 * depth);
    ctx.lineTo(center + halfWidth, y - 3 * depth);
    ctx.stroke();
  }

  for (const y of [174, 286, 398, 510]) {
    const outer = conveyorOuterBoundsAt(y);
    const belt = beltBoundsAt(y);
    const depth = beltDepthScale(y);
    const radius = 5.5 * depth;
    const rotation = state.beltOffset * 0.075 / Math.max(0.55, depth);
    drawConveyorRoller((outer.left + belt.left) / 2, y, radius, rotation);
    drawConveyorRoller((outer.right + belt.right) / 2, y, radius, rotation);
  }

  for (let y = 112; y < bottomY; y += 66) {
    const outer = conveyorOuterBoundsAt(y);
    const belt = beltBoundsAt(y);
    const depth = beltDepthScale(y);
    ctx.fillStyle = "#d59b2d";
    ctx.save();
    ctx.translate(outer.left + (belt.left - outer.left) * 0.45, y);
    ctx.rotate(-0.55);
    ctx.fillRect(-5 * depth, -2 * depth, 10 * depth, 4 * depth);
    ctx.restore();
    ctx.save();
    ctx.translate(belt.right + (outer.right - belt.right) * 0.55, y);
    ctx.rotate(-0.55);
    ctx.fillRect(-5 * depth, -2 * depth, 10 * depth, 4 * depth);
    ctx.restore();
  }
}

function drawDefenseDeck() {
  const deckGradient = ctx.createLinearGradient(160, GATE_Y, W, SHOP_TOP);
  deckGradient.addColorStop(0, "#6d7065");
  deckGradient.addColorStop(0.55, "#5d645d");
  deckGradient.addColorStop(1, "#4c5651");
  ctx.fillStyle = deckGradient;
  ctx.fillRect(160, GATE_Y + 12, W - 160, SHOP_TOP - GATE_Y - 12);

  ctx.strokeStyle = "rgba(47,53,47,0.48)";
  ctx.lineWidth = 1;
  for (let x = 177; x < W; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, GATE_Y + 12);
    ctx.lineTo(x, SHOP_TOP);
    ctx.stroke();
  }
  for (let y = GATE_Y + 48; y < SHOP_TOP; y += 55) {
    ctx.beginPath();
    ctx.moveTo(160, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(210,190,121,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(166, 487);
  ctx.lineTo(184, 477);
  ctx.lineTo(198, 489);
  ctx.moveTo(405, 644);
  ctx.lineTo(388, 632);
  ctx.lineTo(376, 640);
  ctx.stroke();

  ctx.fillStyle = "#303b36";
  ctx.fillRect(160, GATE_Y + 13, 7, SHOP_TOP - GATE_Y - 13);
  ctx.fillStyle = "#c4912f";
  for (let y = GATE_Y + 22; y < SHOP_TOP; y += 28) {
    ctx.save();
    ctx.translate(164, y);
    ctx.rotate(-0.55);
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();
  }

  for (const point of [
    { x: 190, y: 522 }, { x: 405, y: 524 },
    { x: 190, y: 618 }, { x: 405, y: 618 }
  ]) {
    ctx.fillStyle = "#d3a23c";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,216,92,0.18)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGate() {
  const missingSegments = WALL_MAX_HP - state.wallHealth;
  const damageRatio = 1 - state.wallHealth / WALL_MAX_HP;
  ctx.fillStyle = "#26332e";
  ctx.fillRect(158, GATE_Y - 7, W - 158, 18);
  ctx.fillStyle = "#101a16";
  ctx.fillRect(158, GATE_Y + 7, W - 158, 6);

  for (let x = 166; x < W; x += 30) {
    ctx.save();
    ctx.translate(x, GATE_Y + 1);
    ctx.rotate(-0.58);
    ctx.fillStyle = (x / 30) % 2 < 1 ? "#d0942f" : "#38433c";
    ctx.fillRect(-8, -4, 17, 8);
    ctx.restore();
  }

  for (let index = 0; index < missingSegments; index++) {
    const gapX = 184 + index * 46;
    ctx.fillStyle = "#4d564b";
    ctx.fillRect(gapX, GATE_Y - 8, 18, 20);
    ctx.fillStyle = "#252f29";
    ctx.fillRect(gapX + 4, GATE_Y + 7, 12, 6);
  }

  for (const x of [165, 292, 412]) {
    fillRound(x - 10, GATE_Y - 15, 20, 29, 3, "#43524a");
    strokeRound(x - 10, GATE_Y - 15, 20, 29, 3, "#17231c", 2);
    ctx.fillStyle = "#d49b32";
    ctx.fillRect(x - 3, GATE_Y - 9, 6, 6);
  }

  if (damageRatio > 0) {
    ctx.strokeStyle = `rgba(238,90,72,${0.35 + damageRatio * 0.55})`;
    ctx.lineWidth = 2;
    const cracks = Math.ceil(damageRatio * 8);
    for (let index = 0; index < cracks; index++) {
      const x = 188 + index * 28;
      ctx.beginPath();
      ctx.moveTo(x, GATE_Y - 7);
      ctx.lineTo(x - 5, GATE_Y + 1);
      ctx.lineTo(x + 2, GATE_Y + 9);
      ctx.stroke();
    }
  }
}

function drawHome() {
  const x = 296;
  const baseY = SHOP_TOP - 2;
  ctx.fillStyle = "rgba(14,24,18,0.32)";
  ctx.beginPath();
  ctx.ellipse(x, baseY - 1, 58, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  backgroundPolygon([
    { x: x - 48, y: baseY - 36 },
    { x, y: baseY - 66 },
    { x: x + 48, y: baseY - 36 },
    { x: x + 40, y: baseY - 30 },
    { x, y: baseY - 53 },
    { x: x - 40, y: baseY - 30 }
  ], state.lives > 2 ? "#7f5b39" : "#79443b", "#17231c", 3);

  fillRound(x - 41, baseY - 35, 82, 35, 3, state.lives > 0 ? "#526452" : "#3b403b");
  strokeRound(x - 41, baseY - 35, 82, 35, 3, "#17231c", 3);
  ctx.fillStyle = "#25352b";
  ctx.fillRect(x - 10, baseY - 24, 20, 24);
  ctx.fillStyle = state.lives > 0 ? "#ffc43d" : "#5a4037";
  ctx.fillRect(x - 31, baseY - 26, 12, 10);
  ctx.fillRect(x + 19, baseY - 26, 12, 10);
  for (let index = 0; index < HOME_MAX_HP; index++) {
    fillRound(
      x - 24 + index * 10,
      baseY - 10,
      7,
      4,
      1.5,
      index < state.lives ? "#ee5a48" : "#29352f"
    );
  }
  fillRound(x - 31, baseY - 48, 62, 15, 4, "rgba(23,35,28,0.88)");
  text(`基地 +${baseCoinAmount()}`, x, baseY - 40.5, 8, "#fff4c5");
  const incomeProgress = 1 - clamp(state.baseCoinTimer / BASE_COIN_INTERVAL, 0, 1);
  fillRound(x - 28, baseY - 32, 56, 3, 1.5, "#29352f");
  fillRound(x - 28, baseY - 32, 56 * incomeProgress, 3, 1.5, "#ffc43d");

  ctx.strokeStyle = "#17231c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 29, baseY - 42);
  ctx.lineTo(x + 39, baseY - 70);
  ctx.stroke();
  ctx.fillStyle = state.lives > 0 ? "#66d9ff" : "#5a4037";
  ctx.beginPath();
  ctx.arc(x + 40, baseY - 72, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(102,217,255,0.48)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 40, baseY - 72, 8 + Math.sin(state.time * 3) * 1.5, -0.8, 0.8);
  ctx.stroke();
}

function drawDefensePad(position, large = false, index = 0) {
  const rx = large ? 33 : 29;
  const ry = large ? 25 : 21;
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.fillStyle = "rgba(23,31,27,0.34)";
  ctx.beginPath();
  ctx.ellipse(3, 5, rx + 3, ry + 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const padGradient = ctx.createLinearGradient(-rx, -ry, rx, ry);
  padGradient.addColorStop(0, large ? "#717a75" : "#767b6f");
  padGradient.addColorStop(0.55, large ? "#555e5a" : "#5e665e");
  padGradient.addColorStop(1, "#3f4945");
  ctx.fillStyle = padGradient;
  ctx.strokeStyle = "#343d37";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI / 8 + i * Math.PI / 4;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(230,203,103,0.58)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 8, ry - 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#d0a13b";
  for (const point of [
    { x: -rx + 7, y: 0 }, { x: rx - 7, y: 0 },
    { x: 0, y: -ry + 6 }, { x: 0, y: ry - 6 }
  ]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  fillRound(-12, ry - 8, 24, 8, 2, "rgba(24,34,29,0.72)");
  text(`${large ? "C" : "G"}${index + 1}`, 0, ry - 4, 5.5, "#e8d99e");
  ctx.restore();
}

function drawDepotBuilding() {
  backgroundPolygon([
    { x: 5, y: 578 },
    { x: 29, y: 546 },
    { x: 136, y: 546 },
    { x: 159, y: 578 },
    { x: 159, y: SHOP_TOP },
    { x: 5, y: SHOP_TOP }
  ], "#29443f", "#14241e", 3);

  ctx.fillStyle = "#47746d";
  ctx.fillRect(16, 562, 132, 19);
  ctx.strokeStyle = "#172a24";
  ctx.lineWidth = 2;
  for (let x = 22; x < 146; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 563);
    ctx.lineTo(x - 8, 580);
    ctx.stroke();
  }

  fillRound(21, 585, 126, 87, 4, "#17251f");
  ctx.fillStyle = "#735d35";
  ctx.fillRect(30, 626, 38, 25);
  ctx.fillStyle = "#956d35";
  ctx.fillRect(72, 637, 42, 14);
  for (const x of [34, 48, 92, 105, 122]) {
    ctx.fillStyle = x < 70 ? "#d7a63a" : "#8d5d38";
    ctx.beginPath();
    ctx.moveTo(x, 622);
    ctx.lineTo(x + 4, 609);
    ctx.lineTo(x + 8, 622);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#d09b32";
  ctx.fillRect(8, 660, 148, 6);
  ctx.fillStyle = "#263a33";
  ctx.fillRect(118, 590, 24, 50);
  ctx.strokeStyle = "#102019";
  ctx.lineWidth = 2;
  ctx.strokeRect(118, 590, 24, 50);
  for (let y = 597; y < 635; y += 9) {
    ctx.fillStyle = y % 18 < 9 ? "#c9922f" : "#4d5b51";
    ctx.fillRect(121, y, 18, 4);
  }
  fillRound(25, 590, 72, 17, 3, "#28453d");
  strokeRound(25, 590, 72, 17, 3, "#102019", 2);
  text("弹药仓", 61, 598.5, 8, "#e7d79b");
}

function drawWorldBackground() {
  drawSkyAndRuins();
  drawTerrain();
  drawPerspectiveRoad();
  drawRoadsideDetails();
  drawConveyor();
  drawDefenseDeck();
  drawGate();
  drawHome();
  GUN_SLOTS.forEach((slot, index) => drawDefensePad(slot, false, index));
  CANNON_SLOTS.forEach((slot, index) => drawDefensePad(slot, true, index));
  drawDepotBuilding();

  const shade = ctx.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, "rgba(9,17,13,0.16)");
  shade.addColorStop(0.48, "rgba(9,17,13,0)");
  shade.addColorStop(1, "rgba(9,17,13,0.13)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, SHOP_TOP);
}
