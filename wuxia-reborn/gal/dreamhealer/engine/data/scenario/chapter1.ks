[position layer=message0 left=48 top=451 width=928 height=240 marginl=25 marginr=25 margint=18 marginb=12 opacity=225 color=0x12121a]
[layopt layer=message0 visible=true]
[deffont face="sans-serif" size=38 color=0xfaf4eb]
[delay speed=26]
[chara_config pos_mode=false]
[iscript]
f.chapter_assets = ["data/bgimage/dream.webp","data/bgimage/case.webp","data/bgimage/coffee.webp","data/fgimage/yu.webp","data/fgimage/shen.webp","data/fgimage/bai.webp","data/fgimage/xue.webp","data/fgimage/yan.webp","data/fgimage/su.webp","data/fgimage/yucold.webp"];
[endscript]
[preload storage=&f.chapter_assets wait=false]
[chara_new name=yu storage="yu.webp" jname="余筱玲"]
[chara_new name=shen storage="shen.webp" jname="沈义"]
[chara_new name=bai storage="bai.webp" jname="白羽"]
[chara_new name=xue storage="xue.webp" jname="薛淼"]
[chara_new name=yan storage="yan.webp" jname="颜歆"]
[chara_new name=su storage="su.webp" jname="苏禹"]

*beat1
[cm]
[bg storage=dream.webp time=140 wait=true position=center]
[iscript]
f.game_beat = {"n":1,"scene":"dream","discoveries":["clock"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="失焦的时钟"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【女孩 · 失焦的时钟】[r]
作业终于写完了。我揉揉眼睛，桌上的电子钟却连一个数字也看不清。[p]

*beat2
[cm]
[iscript]
f.game_beat = {"n":2,"scene":"dream","discoveries":[]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="窗外"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【女孩 · 窗外】[r]
我拉开厚重的窗帘。太阳不见了，血红色的云铺满整片天空。[p]

*beat3
[cm]
[iscript]
f.game_beat = {"n":3,"scene":"dream","discoveries":[]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="打不开的门"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【女孩 · 打不开的门】[r]
门推不动。我一拳砸过去，手上的力气在碰到木板时散得一干二净。外面却传来了脚步声。
[glink x=165 y=364 width=320 size=30 text="回到窗边" storage=chapter1.ks target="*beat4" keyfocus="1"]
[glink x=530 y=364 width=320 size=30 text="再听一会儿" storage=chapter1.ks target="*beat4" keyfocus="2"]
[s]

*beat4
[cm]
[iscript]
f.game_beat = {"n":4,"scene":"dream","discoveries":["red"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="红裙"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【女孩 · 红裙】[r]
楼下有个穿红裙的女人。我把电子钟扔下去求救。碎裂声过后，她忽然回过头，直直地望向我。[p]

*beat5
[cm]
[chara_show name=yu left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":5,"scene":"dream","discoveries":["wrist"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="醒来"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【女孩 · 醒来】[r]
女人倒了下去。片刻后，身后传来一声脆响。[r]我猛地坐起来，摸到自己的脖子，还好好的。只是手腕有点酸。[p]

*beat6
[cm]
[chara_hide name=yu time=0 wait=true pos_mode=false]
[bg storage=case.webp time=140 wait=true position=center]
[chara_show name=shen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":6,"scene":"case","discoveries":["shen","black"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="扬城 · 7 月 26 日"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【沈义 · 扬城 · 7 月 26 日】[r]
我出示证件，跨过警戒线。老小区的路中央躺着一名黑裙女子，周围的人刻意避开她的脸。[p]

*beat7
[cm]
[chara_hide name=shen time=0 wait=true pos_mode=false]
[chara_show name=bai left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":7,"scene":"case","discoveries":["bai"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="初步勘验"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【白羽 · 初步勘验】[r]
沈叔，没找到刀伤或击打伤。她看起来是被吓死的。[p]

*beat8
[cm]
[chara_hide name=bai time=0 wait=true pos_mode=false]
[chara_show name=xue left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":8,"scene":"case","discoveries":["xue","time"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="报案人"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【薛淼 · 报案人】[r]
我叫薛淼。九点二十四分报的警。我下楼扔垃圾才看见她，之前戴着耳机，没听见尖叫。
[glink x=165 y=364 width=320 size=30 text="追问周围的人" storage=chapter1.ks target="*beat9" keyfocus="1"]
[glink x=530 y=364 width=320 size=30 text="记录报案时间" storage=chapter1.ks target="*beat9" keyfocus="2"]
[s]

*beat9
[cm]
[chara_hide name=xue time=0 wait=true pos_mode=false]
[chara_show name=shen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":9,"scene":"case","discoveries":["gao"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="死者身份"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【沈义 · 死者身份】[r]
高杉杉，二十六岁，实验小学的音乐老师。让人去趟学校，我留在现场。[p]

*beat10
[cm]
[chara_hide name=shen time=0 wait=true pos_mode=false]
[chara_show name=yu left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":10,"scene":"case","discoveries":["yu"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="警戒线外"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【余筱玲 · 警戒线外】[r]
叔叔，我想跟你们走。[r]我叫余筱玲。我……知道一点事情。[p]

*beat11
[cm]
[chara_hide name=yu time=0 wait=true pos_mode=false]
[chara_show name=shen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":11,"scene":"case","discoveries":["finger"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="小姨"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【沈义 · 小姨】[r]
自称小姨的女人起初要把筱玲拖回去，听说孩子要去做笔录，又忽然答应了。我接过她写的联系方式。她没有右手小指。[p]

*beat12
[cm]
[chara_hide name=shen time=0 wait=true pos_mode=false]
[chara_show name=yu storage=yucold.webp left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":12,"scene":"case","discoveries":[]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="一瞬间"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【沈义 · 一瞬间】[r]
我回头要叫住筱玲。就在我们视线碰上的一刻，她眼里掠过一丝冷意。[p]

*beat13
[cm]
[chara_hide name=yu time=0 wait=true pos_mode=false]
[bg storage=coffee.webp time=140 wait=true position=center]
[chara_show name=yan left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":13,"scene":"coffee","discoveries":["yan","post"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="舒颜咖啡 · 同一时间"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【颜歆 · 舒颜咖啡 · 同一时间】[r]
老苏，你看三水哥发的求助帖。前天半夜，对面楼传来哭声。昨天，门外隔几个小时就有脚步声和笑声。[p]

*beat14
[cm]
[iscript]
f.game_beat = {"n":14,"scene":"coffee","discoveries":[]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="刷新"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【颜歆 · 刷新】[r]
昨晚十一点半发的帖……等等，我刷新一下。[r]今天九点二十四分，他发现一具女尸，已经报警了。[p]

*beat15
[cm]
[chara_hide name=yan time=0 wait=true pos_mode=false]
[chara_show name=su left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":15,"scene":"coffee","discoveries":["su","device"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="要不要下去"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【苏禹 · 要不要下去】[r]
对梦境诊疗师而言，去现场才叫“下去”。入梦一型能把意识接到患者的梦境，警方也因此盯得紧。这次已经有人报警。[p]

*beat16
[cm]
[iscript]
f.game_beat = {"n":16,"scene":"coffee","discoveries":["fee"]};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="七十万"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
【苏禹 · 七十万】[r]
五万定金已经到账，办完一共七十万。等他做完笔录，我们亲自去那个小区。[r]三水哥开出这个价，这单恐怕有点危险。[p]

*ending
[cm]
[iscript]
f.game_beat = {n:16, scene:"coffee", discoveries:[], ended:true};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="第一章完"]
[iscript]
window.parent.dreamhealer.reached(f.game_beat);
[endscript]
第一章完[r]下一站，扬城警察局。
[glink x=342 y=360 width=340 size=30 text="继续第二章" storage=chapter2.ks keyfocus="1"]
[s]
*returnTitle
[eval exp="window.parent.dreamhealer.home()"]
[s]
