; TyranoScript runs this hook when restoring a save.
[sysview type=backlog storage="./data/system/backlog.html"]
[message_config ch_speed_in_click=0 effect_speed_in_click=0ms]
[delay speed=26]
[iscript]
const scene = f.game_beat?.scene;
const background = TYRANO.kag.layer.getLayer("base", "fore").css("background-image") || "";
f.restore_background = scene && /^[a-z]+$/.test(scene) && !background.includes("/" + scene + ".webp")
    ? scene + ".webp" : "";
if (Array.isArray(f.game_backlog)) {
    TYRANO.kag.variable.tf.system.backlog = f.game_backlog.slice();
}
[endscript]
[if exp="f.restore_background"]
[bg storage=&f.restore_background time=140 wait=true position=center]
[endif]
[iscript]
const bridge = window.parent.dreamhealer;
// A browser can retain the previous title-page script between deploys.
if (typeof bridge?.restored === "function") bridge.restored(f.game_beat);
else if (f.game_beat && typeof bridge?.reached === "function") bridge.reached(f.game_beat);
[endscript]
[return]
