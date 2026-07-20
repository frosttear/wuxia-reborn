"use strict";

const helpButton = document.getElementById("helpButton");
const startHelpButton = document.getElementById("startHelpButton");
const helpOverlay = document.getElementById("helpOverlay");
const closeHelpButton = document.getElementById("closeHelpButton");
let modeBeforeHelp = "start";

function loop(now) {
  if (state.mode !== "playing") {
    draw();
    return;
  }
  const dt = Math.min(0.033, (now - state.last) / 1000 || 0);
  state.last = now;
  update(dt);
  draw();
  if (state.mode === "playing") requestAnimationFrame(loop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width * W,
    y: (event.clientY - rect.top) / rect.height * H
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing") return;
  const point = canvasPoint(event);
  if (point.x >= BELT.x && point.x <= BELT.x + BELT.w &&
      point.y >= BELT.y + 35 && point.y <= BELT.y + 68) {
    if (state.beltEvent !== "jam") {
      const priorities = ["balanced", "bullet", "shell"];
      state.priority = priorities[(priorities.indexOf(state.priority) + 1) % priorities.length];
      const labels = { balanced: "均衡生产", bullet: "子弹优先", shell: "炮弹优先" };
      addFloater(labels[state.priority], BELT.x + BELT.w / 2, 155, "#fff4c5");
    }
    return;
  }
  if (point.y >= SHOP_TOP) {
    const index = Math.floor(point.x / (W / shop.length));
    if (index >= 0 && index < shop.length) tryUpgrade(index);
    return;
  }
  if (point.y >= PLAY_TOP && point.y < SHOP_TOP && point.x >= ROAD.x) {
    let closest = null;
    let closestDist = 40;
    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.x - point.x, enemy.y - point.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    if (closest && closest === state.focusTarget) {
      state.focusTarget = null;
      addFloater("取消集火", closest.x, closest.y - 50, "#9ac4a2");
    } else if (closest) {
      state.focusTarget = closest;
      addFloater("集火目标", closest.x, closest.y - 50, "#ff8874");
      beep(440, 0.04, "triangle", 0.03);
    } else {
      if (state.focusTarget) addFloater("取消集火", point.x, point.y - 20, "#9ac4a2");
      state.focusTarget = null;
    }
    return;
  }
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "Escape") {
    event.preventDefault();
    if (state.mode === "playing") pauseGame();
    else if (state.mode === "paused") resumeGame();
  }
  if (state.mode !== "playing") return;
  if (event.code === "Digit1") {
    tryUpgrade(0);
  } else if (event.code === "Digit2") {
    tryUpgrade(1);
  } else if (event.code === "Digit3") {
    tryUpgrade(2);
  } else if (event.code === "Digit4") {
    tryUpgrade(3);
  }
});

document.getElementById("startButton").addEventListener("click", resetGame);
continueGameButton.addEventListener("click", continueSavedGame);
document.getElementById("restartButton").addEventListener("click", resetGame);
document.getElementById("retryStageButtonPause").addEventListener("click", () => {
  pauseOverlay.hidden = true;
  retryCurrentStage();
});
document.getElementById("restartButtonPause").addEventListener("click", resetGame);
document.getElementById("backToTitleButton").addEventListener("click", backToTitle);
document.getElementById("resumeButton").addEventListener("click", resumeGame);
nextStageButton.addEventListener("click", startNextStage);
pauseButton.addEventListener("click", pauseGame);
soundButton.addEventListener("click", () => {
  state.sound = !state.sound;
  soundButton.textContent = state.sound ? "♪" : "×";
  soundButton.setAttribute("aria-label", state.sound ? "关闭声音" : "开启声音");
  if (state.sound) beep(520, 0.07, "triangle", 0.04);
});

function openHelp() {
  if (state.mode === "help") return;
  modeBeforeHelp = state.mode;
  state.mode = "help";
  helpOverlay.hidden = false;
  pauseButton.hidden = true;
}

helpButton.addEventListener("click", openHelp);
startHelpButton.addEventListener("click", openHelp);

closeHelpButton.addEventListener("click", () => {
  helpOverlay.hidden = true;
  state.mode = modeBeforeHelp;
  if (state.mode === "playing") {
    state.last = performance.now();
    pauseButton.hidden = false;
    requestAnimationFrame(loop);
  } else if (state.mode === "paused") {
    pauseButton.hidden = true;
  }
});

refreshChoicesButton.addEventListener("click", refreshChoices);

const techButton = document.getElementById("techButton");
const techOverlay = document.getElementById("techOverlay");
const closeTechButton = document.getElementById("closeTechButton");

function renderTechTree() {
  document.getElementById("techPrestige").textContent = "声望点：" + state.prestige;
  const list = document.getElementById("techList");
  list.innerHTML = "";
  for (const def of techDefs) {
    const lv = getTechLevel(def.id);
    const maxed = lv >= def.max;
    const cost = maxed ? 0 : def.cost[lv];
    const affordable = !maxed && state.prestige >= cost;
    const div = document.createElement("div");
    div.style.cursor = affordable ? "pointer" : "default";
    div.style.opacity = maxed ? "0.55" : "1";
    if (affordable) div.style.background = "rgba(255, 196, 61, 0.18)";
    div.innerHTML =
      `<strong>${def.label}` +
      ` <span style="color:#d06b2f;font-size:11px">LV.${lv}/${def.max}</span>` +
      `</strong>` +
      `<span>${def.desc}` +
      (maxed ? " ✓ 已满" : `　需要 ${cost} 声望`) +
      `</span>`;
    if (affordable) {
      div.addEventListener("click", () => {
        if (upgradeTech(def.id)) {
          beep(660, 0.08, "triangle", 0.04);
          renderTechTree();
        }
      });
    }
    list.appendChild(div);
  }
}

techButton.addEventListener("click", () => {
  renderTechTree();
  techOverlay.hidden = false;
});

closeTechButton.addEventListener("click", () => {
  techOverlay.hidden = true;
});

const resetProgressButton = document.getElementById("resetProgressButton");
let resetConfirmTimer = null;

resetProgressButton.addEventListener("click", () => {
  if (resetProgressButton.dataset.confirm === "1") {
    localStorage.removeItem(STAGE_PROGRESS_KEY());
    localStorage.removeItem(PRESTIGE_KEY());
    localStorage.removeItem(TECH_KEY());
    localStorage.removeItem(BEST_WAVE_KEY());
    state.prestige = 0;
    state.tech = {};
    state.bestWave = 0;
    resetProgressButton.textContent = "重置存档";
    resetProgressButton.dataset.confirm = "0";
    clearTimeout(resetConfirmTimer);
    updateContinueGameButton();
    beep(220, 0.15, "square", 0.05);
  } else {
    resetProgressButton.dataset.confirm = "1";
    resetProgressButton.textContent = "确认重置？不可恢复！";
    resetConfirmTimer = setTimeout(() => {
      resetProgressButton.textContent = "重置存档";
      resetProgressButton.dataset.confirm = "0";
    }, 3000);
  }
});

document.getElementById("endlessTitleButton").addEventListener("click", () => {
  state.endless = false;
  state.endlessWave = 0;
  state.pendingLegacy = null;
  state.legacySnapshot = null;
  startGameAtStage(TOTAL_STAGES);
  state.endless = true;
  state.endlessWave = 0;
  state.wave = TOTAL_WAVES;
  state.waveTimer = 2.5;
  announce("无尽模式开始");
});

document.getElementById("exportSaveButton").addEventListener("click", () => {
  const json = exportSaveData();
  navigator.clipboard.writeText(json).then(() => {
    const btn = document.getElementById("exportSaveButton");
    btn.textContent = "已复制!";
    setTimeout(() => { btn.textContent = "导出存档"; }, 1500);
  }).catch(() => {
    prompt("复制以下内容保存：", json);
  });
});

document.getElementById("importSaveButton").addEventListener("click", () => {
  const json = prompt("粘贴存档数据：");
  if (json && importSaveData(json)) {
    beep(660, 0.08, "triangle", 0.04);
    const btn = document.getElementById("importSaveButton");
    btn.textContent = "导入成功!";
    setTimeout(() => { btn.textContent = "导入存档"; }, 1500);
  } else if (json) {
    alert("存档数据无效");
  }
});

for (let s = 1; s <= 3; s++) {
  document.getElementById(`slot${s}Button`).addEventListener("click", () => {
    switchSlot(s);
    updateContinueGameButton();
    beep(440, 0.04, "triangle", 0.03);
  });
}

updateContinueGameButton();

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "playing") pauseGame();
});

draw();
