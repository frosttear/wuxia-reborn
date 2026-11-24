[chara_hide_all time=0 wait=true]
[iscript]
f.chapter_assets = ["data/bgimage/bistro.webp","data/bgimage/hall.webp","data/bgimage/interview.webp","data/fgimage/chi.webp","data/fgimage/chen.webp","data/fgimage/qin.webp","data/fgimage/xueinterview.webp","data/fgimage/yansmile.webp"];
[endscript]
[preload storage=&f.chapter_assets wait=false]
[chara_new name=chi storage=chi.webp jname="迟欢"]
[chara_new name=chen storage=chen.webp jname="陈清"]
[chara_new name=qin storage=qin.webp jname="秦桥"]
[chara_face name=xue face=interview storage=xueinterview.webp]

*beat1
[cm]
[bg storage=interview.webp time=140 wait=true position=center]
[chara_show name=chi left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":1,"scene":"interview","discoveries":["chi"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="上午 10:22 · 扬城警察局"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【迟欢 · 上午 10:22 · 扬城警察局】[r]
迟欢把一份权利告知书推到桌边。[r]「薛淼是吧？别紧张，只是做个笔录。」[p]

*beat2
[cm]
[chara_hide name=chi time=0 wait=true pos_mode=false]
[chara_show name=xue face=interview left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":2,"scene":"interview","discoveries":[],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="报案笔录"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【薛淼 · 报案笔录】[r]
我是个小说作者，平时少出门。扔垃圾的时候，路上没有其他人。死者我也不认识。[p]

*beat3
[cm]
[chara_hide name=xue time=0 wait=true pos_mode=false]
[chara_show name=chi left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":3,"scene":"interview","discoveries":[],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="决定追问方向"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【迟欢 · 决定追问方向】[r]
迟欢把手放回键盘上。下一句，可以顺着声音问，也可以问小区最近有什么变化。
[glink x=165 y=364 width=320 size=30 text="追问异常声响" storage=chapter2.ks target="*noise" keyfocus="1"]
[glink x=530 y=364 width=320 size=30 text="追问新住户" storage=chapter2.ks target="*building" keyfocus="2"]
[s]
*noise
[cm]
[eval exp="f.interview_route='noise'"]
[chara_hide name=chi time=0 wait=true pos_mode=false]
[chara_show name=xue face=interview left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":3,"scene":"interview","discoveries":["cicadas"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="笔录 · 声响"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【薛淼 · 笔录 · 声响】[r]
「有人说蝉鸣特别响。」迟欢试探着问。薛淼说那里没几棵树，只记得夜里的哭声。两人的证词和他的说法并不完全重合。[p]
[jump target=*beat4]
*building
[cm]
[eval exp="f.interview_route='building'"]
[chara_hide name=chi time=0 wait=true pos_mode=false]
[chara_show name=xue face=interview left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":3,"scene":"interview","discoveries":["buildingfive"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="笔录 · 五号楼"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【薛淼 · 笔录 · 五号楼】[r]
薛淼想起有人前阵子刚搬来，装修声很大。好像就在他家前面那幢，五号楼。迟欢把门牌号记了下来。[p]
[jump target=*beat4]

*beat4
[cm]
[iscript]
f.game_beat = {"n":4,"scene":"interview","discoveries":["adoption"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="走廊里的女孩"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【薛淼 · 走廊里的女孩】[r]
薛淼临走前提到余筱玲。他说，曾听见她的小姨在路边冲她发火，提到了领养。[p]

*beat5
[cm]
[chara_hide name=xue time=0 wait=true pos_mode=false]
[bg storage=hall.webp time=140 wait=true position=center]
[chara_show name=yu storage=yu.webp left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":5,"scene":"hall","discoveries":["dreamstatement"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="同一时间 · 讯问室外"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【余筱玲 · 同一时间 · 讯问室外】[r]
沈叔叔，我在梦里见过那个阿姨。她就站在今天那个地方。梦里的天是红的，她的衣服也是红的。[p]

*beat6
[cm]
[iscript]
f.game_beat = {"n":6,"scene":"hall","discoveries":[],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="梦里的动作"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【余筱玲 · 梦里的动作】[r]
她想喊，却自己掐住了脖子。后来她揪着衣领，倒下去了。剩下的事，我记不太清了。[p]

*beat7
[cm]
[chara_hide name=yu time=0 wait=true pos_mode=false]
[chara_show name=shen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":7,"scene":"hall","discoveries":[],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="夜里的哭声"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【沈义 · 夜里的哭声】[r]
余筱玲说她醒后下过楼，还小声承认，前天夜里哭的人也许就是她。沈义记下了这句话，答应中午带她去吃肯德基。[p]

*beat8
[cm]
[chara_hide name=shen time=0 wait=true pos_mode=false]
[bg storage=interview.webp time=140 wait=true position=center]
[chara_show name=chi left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":8,"scene":"interview","discoveries":[],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="两份口供"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【迟欢 · 两份口供】[r]
迟欢给几处细节标了红。旧小区的监控帮不上忙，两份口供却都把警方带回了前天夜里。沈义让他先整理笔录，等尸检。[p]

*beat9
[cm]
[chara_hide name=chi time=0 wait=true pos_mode=false]
[bg storage=bistro.webp time=140 wait=true position=center]
[chara_show name=chen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":9,"scene":"bistro","discoveries":["chen"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="上午 10:55 · 蒸汽时代"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【陈清 · 上午 10:55 · 蒸汽时代】[r]
齿轮嵌进水泥墙，包厢门做成了金库的样子。陈清笑着给两人指路。[r]「六号包间，等一下小秦。」[p]

*beat10
[cm]
[chara_hide name=chen time=0 wait=true pos_mode=false]
[chara_show name=yan storage=yansmile.webp left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":10,"scene":"bistro","discoveries":["deep35"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="威士忌的暗号"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【颜歆 · 威士忌的暗号】[r]
进了包间，颜歆才明白苏禹点的是入梦药剂「深眠35」。她笑着朝桌边打招呼：「三水哥，好久不见。」[p]

*beat11
[cm]
[chara_hide_all time=0 wait=true]
[chara_show name=xue face=interview left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":11,"scene":"bistro","discoveries":["alias"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="三水哥"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【薛淼 · 三水哥】[r]
包间里等着他们的正是薛淼。他打开一段短录音，女孩报出了自己的名字：余筱玲。[p]

*beat12
[cm]
[chara_hide name=xue time=0 wait=true pos_mode=false]
[chara_show name=yan storage=yan.webp left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":12,"scene":"bistro","discoveries":[],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="去年的委托"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【颜歆 · 去年的委托】[r]
去年福利院那桩案子的目击者？薛淼点了点头。他出七十万，正是想让他们调查这个女孩。[p]

*beat13
[cm]
[chara_hide name=yan time=0 wait=true pos_mode=false]
[chara_show name=qin left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":13,"scene":"bistro","discoveries":["qin"],"chapter":2};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="人齐了"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【秦桥 · 人齐了】[r]
秦桥推门进来。他负责设备支持，平时不参与入梦。陈清收起笑容。[r]「边吃边说吧，小秦找到了些东西。」[p]
[jump storage=chapter3.ks]
