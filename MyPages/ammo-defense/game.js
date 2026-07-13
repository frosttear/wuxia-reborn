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
document.getElementById("restartButtonPause").addEventListener("click", resetGame);
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
updateContinueGameButton();

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "playing") pauseGame();
});

draw();
