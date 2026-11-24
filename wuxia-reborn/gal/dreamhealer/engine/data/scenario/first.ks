[title name="梦境诊疗师 · 第一章"]
[hidemenubutton]
[sysview type=backlog storage="./data/system/backlog.html"]
[message_config ch_speed_in_click=0 effect_speed_in_click=0ms]
[layopt layer=message0 visible=false]
[iscript]
// The virtual cursor has not been hidden yet. Its initial zero would block early clicks.
if (TYRANO.kag.key_mouse.vmouse.last_hide_time === 0) TYRANO.kag.key_mouse.vmouse.last_hide_time = -1000;
queueMicrotask(() => window.parent.dreamhealer.ready(window));
[endscript]
[s]
