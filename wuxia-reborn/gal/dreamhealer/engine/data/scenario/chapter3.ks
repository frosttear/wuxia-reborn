[chara_hide_all time=0 wait=true]
[iscript]
f.chapter_assets = ["data/bgimage/bistro.webp","data/bgimage/coffee.webp","data/bgimage/fastfood.webp","data/bgimage/office.webp","data/bgimage/rain.webp","data/fgimage/li.webp"];
[endscript]
[preload storage=&f.chapter_assets wait=false]

*beat1
[cm]
[bg storage=office.webp time=140 wait=true position=center]
[chara_show name=chi left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":1,"scene":"office","discoveries":["rainfile"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="上午 10:51 · 警局办公室"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【迟欢 · 上午 10:51 · 警局办公室】[r]
迟欢端着泡面坐进办公室最里侧，翻出诊疗师三年前的委托档案。标题是一行发冷的字：福利院雨夜沉尸。[p]

*beat2
[cm]
[chara_hide name=chi time=0 wait=true pos_mode=false]
[call storage=rain-scene.ks target=*enter]
[iscript]
f.game_beat = {"n":2,"scene":"rain","discoveries":["li"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="三年前 · 五月二十八日"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【档案 · 三年前 · 五月二十八日】[r]
夜巡的李护工听见雨中有哭声。他确认过孩子都睡下了，一楼本应锁住的大门却留着条缝。[p]

*beat3
[cm]
[iscript]
f.game_beat = {"n":3,"scene":"rain","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="门口还是湖边"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【档案 · 门口还是湖边】[r]
手电筒扫到门旁的雨伞，哭声则从湖边传来。先留意哪里？
[glink x=165 y=364 width=320 size=30 text="清点门边雨伞" storage=chapter3.ks target="*umbrella" keyfocus="1"]
[glink x=530 y=364 width=320 size=30 text="循哭声看湖面" storage=chapter3.ks target="*lake" keyfocus="2"]
[s]
*umbrella
[cm]
[eval exp="f.rain_route='umbrella'"]
[iscript]
f.game_beat = {"n":3,"scene":"rain","discoveries":["whiteumbrella"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="雨夜档案 · 白伞"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【档案 · 雨夜档案 · 白伞】[r]
李护工数了一遍。白天清点过的伞，一把不少。角落里还多了一把白色折叠伞，他想不起是谁带来的。[p]
[jump target=*beat4]
*lake
[cm]
[eval exp="f.rain_route='lake'"]
[iscript]
f.game_beat = {"n":3,"scene":"rain","discoveries":["lakesound"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="雨夜档案 · 湖边"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【档案 · 雨夜档案 · 湖边】[r]
手电照向湖边，水里漂着个白影。哭声像是从白影身上传来。李护工看清那是一具浮尸，慌忙退回去。[p]
[jump target=*beat4]

*beat4
[cm]
[iscript]
f.game_beat = {"n":4,"scene":"rain","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="背后的声音"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【档案 · 背后的声音】[r]
李护工从湖边跑回院里，合上门的一刻，背后有人问他在做什么。[r]说话的孩子叫余筱玲。[p]

*beat5
[cm]
[call storage=rain-scene.ks target=*leave]
[chara_show name=chi left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":5,"scene":"office","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="档案到此为止"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【迟欢 · 档案到此为止】[r]
委托记录没有公开后续。迟欢将文件发给账号「QQ」，重新看了一遍标题。[p]

*beat6
[cm]
[chara_hide name=chi time=0 wait=true pos_mode=false]
[bg storage=bistro.webp time=140 wait=true position=center]
[chara_show name=yan storage=yan.webp left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":6,"scene":"bistro","discoveries":["threecases"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="上午 11:10 · 六号包间"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【颜歆 · 上午 11:10 · 六号包间】[r]
三年前、去年、今年，三桩事里都有余筱玲？去年为了从她梦里找线索，苏禹差一点没醒过来。[p]

*beat7
[cm]
[chara_hide name=yan time=0 wait=true pos_mode=false]
[chara_show name=chen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":7,"scene":"bistro","discoveries":["reaction"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="另一种死因"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【陈清 · 另一种死因】[r]
看起来像惊吓致死，也可能是深眠药剂引发的异常反应。陈清放下药瓶。苏禹问，如果涉案人也是同行呢？[p]

*beat8
[cm]
[chara_hide name=chen time=0 wait=true pos_mode=false]
[chara_show name=qin left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":8,"scene":"bistro","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="饭桌上的沉默"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【秦桥 · 饭桌上的沉默】[r]
秦桥低头切开牛排。他信任苏禹和颜歆，却还摸不清薛淼的底细。饭桌上的话渐渐少了。[p]

*beat9
[cm]
[chara_hide name=qin time=0 wait=true pos_mode=false]
[bg storage=fastfood.webp time=140 wait=true position=center]
[chara_show name=shen left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":9,"scene":"fastfood","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="同一时间 · 快餐店"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【沈义 · 同一时间 · 快餐店】[r]
余筱玲说小姨去年收养了她。她的描述让沈义感觉，小姨对女孩更多是害怕。[p]

*beat10
[cm]
[chara_hide name=shen time=0 wait=true pos_mode=false]
[chara_show name=yu left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":10,"scene":"fastfood","discoveries":["wristmark"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="左腕上的印记"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【余筱玲 · 左腕上的印记】[r]
沈义看见女孩左腕有一道像表带留下的浅痕。问起手表，她摇摇头，说平时从不戴东西。[p]

*beat11
[cm]
[chara_hide name=yu time=0 wait=true pos_mode=false]
[bg storage=coffee.webp time=140 wait=true position=center]
[chara_show name=su left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":11,"scene":"coffee","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="下午 2:14 · 舒颜咖啡"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【苏禹 · 下午 2:14 · 舒颜咖啡】[r]
苏禹摊开电脑。前两桩旧案，警方手上没有档案；这一次，关键目击者却先到了警方那里。[p]

*beat12
[cm]
[chara_hide name=su time=0 wait=true pos_mode=false]
[chara_show name=yan left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":12,"scene":"coffee","discoveries":["dreamlock"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="她的梦"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【颜歆 · 她的梦】[r]
我负责先连接，再把你接进去。她的梦跟别人不一样。进去几乎没有阻力，想离开时却像一扇从外反锁的门。[p]

*beat13
[cm]
[chara_hide name=yan time=0 wait=true pos_mode=false]
[chara_show name=su left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":13,"scene":"coffee","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="把两条调查线接起来"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
[iscript]
const lead = f.interview_route === "noise" ? "薛淼唯独没听见蝉鸣。" : "五号楼刚装修过，记下楼号。";
const rain = f.rain_route === "umbrella" ? "雨夜多出的白伞，要弄清楚是谁带来的。" : "湖边和小区都有人听到哭声，会是同一种异常吗？";
f.follow_up = lead + rain;
[endscript]
【苏禹 · 研判】[r]
两份记录都指向同一个人。余筱玲会不会是被人利用了？[r]
[emb exp="f.follow_up"][p]

*beat14
[cm]
[chara_hide name=su time=0 wait=true pos_mode=false]
[chara_show name=yan left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":14,"scene":"coffee","discoveries":["policepost"],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="一条新委托"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【颜歆 · 一条新委托】[r]
暗网的页面跳出一个新账号发的公开委托。原帖的措辞还在，但多了连薛淼都没提供的死者资料。[p]

*beat15
[cm]
[chara_hide name=yan time=0 wait=true pos_mode=false]
[chara_show name=su left=640 top=55 height=510 time=0 wait=true]
[iscript]
f.game_beat = {"n":15,"scene":"coffee","discoveries":[],"chapter":3};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="等谁先开口"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
【苏禹 · 等谁先开口】[r]
能拿到这些资料的人，很可能在警方内部。苏禹合上电脑，转身去沏一壶新茶。两条调查线终于碰上了。[p]
[cm]
[iscript]
f.game_beat = {"n":15,"scene":"coffee","discoveries":[],"chapter":3,"ended":true};
f.game_backlog = TYRANO.kag.variable.tf.system.backlog.slice();
[endscript]
[autosave title="第三章完"]
[eval exp="window.parent.dreamhealer.reached(f.game_beat)"]
第三章完[r]未结的委托，仍在等人接手。
[glink x=342 y=360 width=340 size=30 text="返回主界面" storage=chapter3.ks target="*returnTitle" keyfocus=1]
[s]
*returnTitle
[eval exp="window.parent.dreamhealer.home()"]
[s]
