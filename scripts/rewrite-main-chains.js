'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const eventsPath = path.join(ROOT, 'data/events.json');
const chainsPath = path.join(ROOT, 'data/chains.json');

const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const chainsData = JSON.parse(fs.readFileSync(chainsPath, 'utf8'));

// ── TIANMO_APPEARS (boss event) ───────────────────────────────────────────────

const tianmoEvent = eventsData.find(e => e.id === 'tianmo_appears');
tianmoEvent.text = [
  '二十岁生辰。',
  '',
  '你以为这天会和往常一样，直到一阵冷风拂过——他来了。',
  '',
  '天魔站在你面前，如同一道深渊。他没有派使者，没有递战书，只是静静地看着你，像在印证什么。许久，才开口道：「所以是你。」',
  '',
  '「我的人送来了很多关于你的消息，」他的声音平静，带着一种俯瞰的从容，「破坏据点，杀我的人，一路追着影堂的线索走到今天。」',
  '',
  '他顿了顿，目光微微收紧：「但这个——」他的手指虚指向你，「我没料到。噬魂真经这么多年，从未有人的气息能触动它。不是因为你的招式，不是因为你的修为——是某种我解释不了的东西。」',
  '',
  '那双眸子里，第一次出现了一丝真实的疑惑：「你究竟是什么人。」',
  '',
  '这一战，无可避免。',
].join('\n');

// ── TIANMO_HARBINGER ─────────────────────────────────────────────────────────

const harbinger = chainsData.chains.find(c => c.id === 'tianmo_harbinger');

harbinger.steps[0].text = [
  '出门时，你在城郊小巷发现一个倒在血泊中的年轻人，气息微弱。',
  '',
  '他显然不是普通人——身法和受伤的位置说明他与人激烈搏斗过，来不及撤退。你俯身察看，发现他攥着一枚令牌，令牌背面刻着一只展翅的乌鸦，笔画极细，像是暗号。',
  '',
  '他感觉到了你的存在，用最后一口力气将令牌塞进你手中，低声说了一个地名：「龙脊山。」',
  '',
  '然后，他失去了意识。',
].join('\n');

harbinger.steps[0].choices = [
  {
    id: 'investigate',
    text: '将伤者移至安全处，把令牌收好',
    effects: {
      attributes: { comprehension: 1, constitution: 1 },
      narrative: '你将他抬到附近的药铺，托人照料后离开。那枚令牌收在怀中，微微发凉。龙脊山——你决定去看看。\n\n一路奔波追查，你的体魄也因此得到了锻炼。',
    },
  },
  {
    id: 'sense_token',
    text: '以内力探察令牌上的残留气息',
    requirements: { minAttributes: { innerForce: 10 } },
    effects: {
      attributes: { innerForce: 2, comprehension: 1 },
      narrative: '令牌上有一股气息，很淡，但不正常——像是被什么东西过滤过，干净得反常。你将令牌收好，朝龙脊山的方向望了一眼。',
    },
  },
];

harbinger.steps[1].text = [
  '龙脊山。',
  '',
  '山路并不难走，但越往上，空气越沉，树上的鸟雀一只也没有。',
  '',
  '你留意到路边的泥地——有脚印朝山上走，数不清，从最近的到最远的，深浅不一，跨越数月。但没有一个脚印是朝山下走的。没有人回来过。',
  '',
  '山顶有一处废弃的石台，台面上是烧成灰烬的木炭，夹杂着碎骨——不是野兽，是人骨，被仔细碾碎后摊在台面上。台边缘刻着阵纹，用的是黑色矿石，纹路精细，不像随意刻划。',
  '',
  '石台旁竖着一根铁柱，顶端悬着一只倒扣的铁钟，铁钟底部连着一套转动的机关——是定时敲响的装置，仍在缓慢转动。',
  '',
  '这仪式，还在持续进行中。',
].join('\n');

harbinger.steps[1].choices = [
  {
    id: 'study_ruins',
    text: '仔细记录阵纹的形制，将拓印带走',
    effects: {
      attributes: { comprehension: 2, strength: 1 },
      narrative: '你将阵纹的形制一笔笔记下。那些符文的排列方式不是随意设计的——是某种系统，有规律，有目的。你感到不安，也感到好奇。\n\n反复攀爬山路，你的力量也随之增长。',
    },
  },
  {
    id: 'sense_qi',
    text: '以内力感知石台残留的气息，与令牌对照',
    requirements: { minAttributes: { innerForce: 12 } },
    effects: {
      attributes: { innerForce: 3, comprehension: 1 },
      narrative: '你将令牌贴近石台——那股气息，和令牌上的残余极度相似。这两件东西来自同一个地方，或者说，同一个人的手。你已经触碰到了某个东西的边缘。',
    },
  },
];

harbinger.steps[2].text = [
  '第二天傍晚，你重返龙脊山，想再查看那套计时机关的运转规律。',
  '',
  '还未靠近山顶，你听到了声音——几个人，正在收拾石台上的痕迹，动作熟练，一看就是受过训练的。',
  '',
  '你藏身暗处观察，为首的人弯腰检查地面，低声说：「有人来过，不是我们的人。」',
  '',
  '他们开始搜山。',
  '',
  '你按住呼吸，但最终还是被发现了。为首的人走到你藏身处前方十步，背对着你，平静开口：「出来吧。你第一次来这里，我们就知道了。」',
  '',
  '他转过身——黑衣，无面，眼神是一种完成任务的冷漠。「你不该查这件事的。」',
].join('\n');

harbinger.steps[2].choices = [
  {
    id: 'fight_vanguard',
    text: '迎战，决不退缩',
    effects: {
      combat: 'tianmo_vanguard',
      narrative: '你深吸一口气，握紧拳头。你打倒了他。在他倒下前的最后一刻，你从他怀中滑落出一张纸——上面列着十几个地名，龙脊山在其中，旁边打了一个叉。其他地名，也大多打了叉。还有几个，没有。\n\n这不是一个孤立的地点，而是一张计划表。',
    },
  },
  {
    id: 'evade_vanguard',
    text: '此人气息强于自己，借夜色脱身',
    requirements: { minAttributes: { agility: 15 } },
    effects: {
      attributes: { agility: 3, luck: 1 },
      narrative: '你压下心跳，借着地形三绕两绕甩开了追踪。藏进密林时，你隐约看到那人俯身捡起了什么——你不小心跌落的东西。\n\n你逃过了这一次，但你知道，有人开始注意你了。而这件事的规模——远比你以为的要大。',
    },
  },
];

harbinger.completionReward.narrative = '龙脊山的石台、那张打了叉的地名清单、那个无面的黑衣人——每一块碎片都在告诉你：这不是一个人的事，而是一张网，正在某处悄悄收拢。';

// ── JIANGHU_CHAOS ─────────────────────────────────────────────────────────────

const chaos = chainsData.chains.find(c => c.id === 'jianghu_chaos');

chaos.steps[0].text = [
  '一个商人找到你，神色慌张，声称商队在经过一处山口时遭到了莫名袭击——不是山贼，而是一群眼神空洞、举止反常的江湖武人。',
  '',
  '「他们像是……不认识人了，」商人说，「只知道攻击，完全没有理性。」',
  '',
  '随后你听说，类似的事在周边几个县已经发生了三次，受害者描述如出一辙。',
  '',
  '你让商人描述袭击者的特征。他停顿了一下：「有几个人腰间挂着什么，黑色的，像是令牌。」',
  '',
  '你心中微微一动。',
].join('\n');

chaos.steps[0].choices = [
  {
    id: 'accept_investigation',
    text: '接受委托，追查袭击事件的来源',
    effects: {
      attributes: { reputation: 1 },
      narrative: '你决定查清楚。不只是为那个商人，而是因为这件事的模式——有规律，有目的，太像是某种计划的一部分了。',
    },
  },
  {
    id: 'ask_around',
    text: '先凭声名广泛打听，收集更多线报',
    requirements: { minAttributes: { reputation: 12 } },
    effects: {
      attributes: { reputation: 2, comprehension: 1 },
      narrative: '消息纷沓而至：失踪者全部出现在三个月内，全都在同一条旧官道附近走失。更有意思的是——有人描述失踪前的武人们，都曾经前往一处废弃的山神庙附近。',
    },
  },
];

chaos.steps[1].text = [
  '你循着线索，追到了那处废弃的山神庙。',
  '',
  '庙里早已被清空，但墙上仍留着痕迹——用黑色颜料画过什么，被擦除了，但形状还在。阵纹的轮廓，隐约可辨。',
  '',
  '庙后有一条地道，地道尽头是一间密室，里面关着七八个被锁链缚住的武人，眼神空洞，灵魂尽失。他们的嘴里反复喃喃着同一句话，无意义的，像是在背什么。',
  '',
  '你尝试唤醒其中一人。他睁开眼，空洞地盯着你，片刻后，嘴唇动了动：「主上……旨意……」',
  '',
  '然后，他再次陷入沉默。',
].join('\n');

chaos.steps[1].choices = [
  {
    id: 'rescue_and_follow',
    text: '先将被困武人转移，再追查幕后之人',
    effects: {
      attributes: { reputation: 2, comprehension: 1 },
      narrative: '你带着获救的武人下山。回头时，发现密室里留着一样东西——一块黑色的令牌，背面是展翅的乌鸦。有人刚刚在这里，走了不久。幕后之人还没有走远。',
    },
  },
  {
    id: 'set_trap',
    text: '将密室伪装成原样，等待幕后之人归来，暗中跟踪',
    requirements: { minAttributes: { comprehension: 14 } },
    effects: {
      attributes: { comprehension: 2, agility: 1 },
      narrative: '你的计谋奏效了。你跟踪他到了另一处据点，亲眼看到他将一份文书交给另一个人。那文书上有一个印鉴——两个字，「影堂」。此外，没有任何名字，没有署名，只有「真主有令」四个字开头。',
    },
  },
];

chaos.steps[2].text = [
  '你终于锁定了主要据点——城郊一处看似废弃的庄园。',
  '',
  '庄园里有守卫，有规律，有纪律，不像是临时聚集的一伙人，更像是受过长期训练的组织。',
  '',
  '你找到了机会，独自潜入。',
  '',
  '里面有人在等着你。',
  '',
  '「你比我预计的要快，」堂主放下手中的杯子，站起身，拔出一柄阴黑的长刀，「但也就到这里了。你不知道你在妨碍什么。」',
  '',
  '他是影堂的核心武力，被某种力量强化过的武人，比任何你遇到过的敌人都要危险。',
].join('\n');

chaos.steps[2].choices = [
  {
    id: 'fight_shadow_boss',
    text: '迎战影堂堂主',
    effects: {
      combat: 'shadow_cult_leader',
      narrative: '你击倒了他。他倒下时，手中还握着一张文书——是一份调遣令，加急件，盖着「影堂」的印鉴，底部署名只有两个字：天魔。\n\n你第一次看到这个名字，写在纸上，郑重，清晰，像一道真实的重量压下来。',
    },
  },
  {
    id: 'expose_shadow_boss',
    text: '你已掌握足够证据，选择公开揭露而非正面交锋',
    requirements: { minAttributes: { reputation: 20 } },
    effects: {
      attributes: { reputation: 5, comprehension: 2 },
      narrative: '你将搜集的证据公之于众。证据中有一份调遣令，底部署名两字——天魔。江湖舆论哗然。那个名字，以这种方式传遍了四方。幕后的人知道自己已经暴露，无处遁形，最终被江湖正道联手清算。',
      flags: { jianghu_chaos_resolved: true },
    },
  },
];

chaos.completionReward.narrative = '影堂在这片地区的据点覆灭了。那些被控制的武人陆续苏醒，但他们记得的只有「主上旨意」四个字，什么都说不出来。你的名字再次被人提起——不是以英雄，而是以一个知道自己在对抗什么的人的身份。天魔。那个名字，从今天起，你知道了它是真实的。';

// ── HERO_PATH ─────────────────────────────────────────────────────────────────

const hero = chainsData.chains.find(c => c.id === 'hero_path');

hero.steps[0].text = [
  '南方水患，大批灾民涌入城中。官府赈灾不力，城中粮商趁火打劫，囤积居奇，哄抬粮价。',
  '',
  '灾民饥寒交迫，有老人跪在路边哭泣。你路过时，几名灾民认出了你——「那是剑客！求您帮帮我们！」',
  '',
  '你望向那间粮行紧闭的大门，心中已有了决定。',
  '',
  '就在你动身之际，你注意到人群的边缘有几个人行事奇怪——他们并不争粮，只是在人群中扫视，目光落在那些单身的、衣衫破败的、身边无人的灾民身上。',
].join('\n');

hero.steps[0].choices = [
  {
    id: 'confront_merchant',
    text: '直接找粮商交涉，要求平价售粮',
    effects: {
      attributes: { reputation: 2 },
      narrative: '粮商在你的威势下不得不让步，消息传开，灾民纷纷感恩。但混乱中，你留意到那几个在人群边缘游荡的人，已经不见了踪影——连同三四个单身的灾民。事后无人追问。你心中有个说不清的疑虑。',
    },
  },
  {
    id: 'organize_relief',
    text: '召集江湖朋友，组织民间赈灾',
    requirements: { minAttributes: { reputation: 14 } },
    effects: {
      attributes: { reputation: 3, comprehension: 1 },
      narrative: '你的号召力超出自己的想象——短短数日，各路侠客纷纷响应。那几个在人群边缘游荡的人，显然察觉到这里不是好下手的地方，提前离开了。你没有扣住他们，但你记住了他们的眼神——那种扫视人群的方式，和物色猎物的猎人一模一样。',
    },
  },
];

hero.steps[1].text = [
  '你的善行引来了更多的求助。一个小镇的里长带着乡亲们找到你，说镇上来了一伙恶人，为首的是一个自号「铁面判官」的武人，烧杀抢掠，无恶不作。',
  '',
  '官兵不敢管，其他侠客不愿趟这浑水。里长跪在你面前：「只有您能救我们了。」',
  '',
  '你带剑赶到小镇，铁面判官已经在镇中广场上公然设擂，扬言「谁不服，上来领死」。你留意到他身边有两个随从始终盯着人群边缘，眼神锐利——不像护卫，更像在物色什么。',
  '',
  '擂台前，铁面判官看到你走来，眼神里闪过一丝意外，随即恢复了傲慢：「又一个送死的。」',
].join('\n');

hero.steps[1].choices = [
  {
    id: 'fight_iron_judge',
    text: '登台迎战铁面判官',
    effects: {
      combat: 'iron_judge',
      narrative: '你击倒了他。他倒在擂台上，沉默片刻，挤出一句：「你不知道你在妨碍什么……」\n\n那两个随从早已消失在人群中，无影无踪。\n\n你带走了铁面判官的一块腰牌，上面有个印鉴——「影堂」。一个你已经开始熟悉的名字。',
    },
  },
  {
    id: 'track_handlers',
    text: '先不正面硬上，暗中跟踪其随从',
    requirements: { minAttributes: { agility: 18 } },
    effects: {
      attributes: { agility: 2, comprehension: 2 },
      narrative: '你绕开擂台，跟上了那两个随从。他们走进一条小巷，与另外一个人接头，交换了一枚乌鸦令牌。\n\n你看清楚了——那枚令牌和你见过的如出一辙。\n\n你回到广场，登台击败铁面判官，将他押送官府。他倒地前说：「你不知道你在妨碍什么……」\n\n这次，你比他更清楚。',
    },
  },
];

hero.steps[2].text = [
  '你的事迹传遍了江湖——义救灾民、除暴安良、击败铁面判官。这些事迹被说书人编成段子，在各个酒楼茶馆流传。',
  '',
  '一日，数位德高望重的江湖前辈联袂来访。为首的白发老者抱拳道：「阁下武艺超群，更难得的是心怀天下。我等商议已久，愿联名举荐阁下为江湖侠义联盟的座上宾。」',
  '',
  '他身后的几位前辈纷纷点头。这不是一般的邀请——这意味着，你已经得到了整个武林的认可。',
  '',
  '你接受时，不经意抬眼，看到街道对面的茶馆门口站着一个白发老人。他不是来凑热闹的——那种站姿太安静了，像是专程来看这一幕。你的目光与他相遇，他转身，步入了茶馆深处，消失不见。',
].join('\n');

hero.steps[2].choices = [
  {
    id: 'accept_honor',
    text: '抱拳回礼，欣然接受',
    effects: {
      attributes: { reputation: 4, innerForce: 1 },
      narrative: '众前辈抚掌大笑。消息传出，江湖上下无不敬服。你不再只是一个剑客——你是被武林公认的侠士。\n\n那个白发老人，你再没见到他。但那一眼的目光让你记了很久——是一种审视，也是一种什么别的东西，你说不清楚。',
    },
  },
  {
    id: 'humble_accept',
    text: '谦虚推辞一番后接受',
    effects: {
      attributes: { comprehension: 2, innerForce: 1, luck: 1 },
      narrative: '你的谦逊反而让前辈们更加赞赏。「有实力而不骄傲，难得。」这份认可，来得恰如其分。\n\n你回想起那个白发老人的身影——他走时的步伐稳健，一点也不像是随便路过的行人。江湖中，懂得隐藏自己的人往往有更深的来历。',
    },
  },
];

// ── SWORD_PATH ────────────────────────────────────────────────────────────────

const sword = chainsData.chains.find(c => c.id === 'sword_path');

// Step 1: add a small touch to the draw_sword narrative (vision hint)
const drawSwordChoice = sword.steps[0].choices.find(c => c.id === 'draw_sword');
drawSwordChoice.effects.narrative = '当你内力灌入剑身的瞬间，锈斑簌簌脱落，露出剑身上隐约的花纹。剑身微微震鸣，像在回应你。你有一刹那的错觉——这把剑好像认识你，或者说，好像在等某个人。';

// Step 2: add 老剑师's lost disciple and raven token
sword.steps[1].text = [
  '古剑冢的经历让你心中萌生了一个念头——你需要一位真正的剑道前辈指点。',
  '',
  '你四处打听，终于得知城外青岩峰上住着一位隐居多年的老剑师。据说他年轻时是江湖上赫赫有名的高手，后因一场变故归隐山林。',
  '',
  '你攀上青岩峰，在一间简陋的茅屋前见到了他——白发苍苍，背脊却挺得笔直，手边一柄长剑，锋刃未钝。',
  '',
  '他看了你一眼：「你是来学剑的？先让我看看你的底子。」',
  '',
  '你说起古剑冢的事。老人神色微微一顿，随后走进茅屋，片刻后拿着一样东西走出来，放在桌上。',
  '',
  '是一枚令牌，背面刻着一只展翅的乌鸦。',
  '',
  '「这是在我弟子房中找到的，」他说，「二十余年前，他收到一封信，独自离去，此后再无音讯。这枚令牌，他走时没有带走。」',
  '',
  '老人没有再多说什么。他只是重新坐下，看着你：「你来这里学剑，我先看看你值不值得教。」',
].join('\n');

sword.steps[1].choices = [
  {
    id: 'show_skill',
    text: '当场演练一套你最拿手的招式',
    effects: {
      attributes: { strength: 1, agility: 1 },
      narrative: '老人看完，沉吟片刻：「根基不错，但剑路太散。你有力量，有速度，却没有剑心。」他指了指山下：「去找真正的对手，赢了再来见我。」',
    },
  },
  {
    id: 'speak_honestly',
    text: '提起古剑冢中最锈的那柄剑，询问老人是否识得',
    requirements: { minAttributes: { comprehension: 12 } },
    effects: {
      attributes: { comprehension: 3 },
      narrative: '老人的手微微一顿。「最锈的那柄，」他重复了一遍，没有立刻回答，「你能拔起它？」\n\n你说你试过，剑身有回应。\n\n老人沉默了很久，才开口：「那是我弟子的剑。他走时，剑留在了那里。」\n\n他站起身，背对着你，目光望向山下：「你去找一个真正的对手，用剑赢下来，再回来见我。」',
    },
  },
];

// Step 3: 青衣剑客 is investigating raven token / 老剑师's lost disciple
sword.steps[2].text = [
  '按照老剑师的指示，你回到江湖中寻找真正的对手。',
  '',
  '几天后，一个青衣剑客在酒馆中主动向你挑战：「听说你在青岩峰拜了师？那老头已经很多年不收弟子了。」',
  '',
  '他站起身，拔剑而立，剑光凛然——这是一个真正精通剑术的人。',
  '',
  '「我去过青岩峰，」他说，「他不肯见我。」这话说得很平，但你听出了另一层意思——他并非随机挑战，他专程找的你。',
  '',
  '「拔剑吧。你赢了，我告诉你一件事。」',
].join('\n');

sword.steps[2].choices = [
  {
    id: 'fight_sword_trial',
    text: '拔剑迎战，以实战证明自己的剑道',
    effects: {
      combat: 'sword_trial_challenger',
      narrative: '剑光交错，你在这场对决中拼尽全力，赢了。\n\n青衣剑客收剑，平静地坐回椅子上：「那老头的弟子，二十多年前，是我师兄。我一直在找他的下落。」\n\n他从腰间取出一枚令牌，放在桌上——展翅的乌鸦，和你见过的一模一样。「我找了三年，找到了这个。我不知道意味着什么，但……」他停顿了一下，「我不信任你，但我们知道同一件事。」\n\n他离开前，低声说：「告诉那老头，他弟子的线索，还没断。」',
    },
  },
];

// Step 4: polish the ending, add weight/history, no star mark
sword.steps[3].text = [
  '你带着一身战斗的痕迹回到青岩峰。老剑师看着你，没有问你是赢是输，只说了一句：「你的眼神变了。」',
  '',
  '那天，他第一次认真地教你剑法——不是招式，而是如何将你的信念、你的经历、你对剑道的理解，全部贯注到每一剑之中。',
  '',
  '「剑客不是靠招式强的，」他说，「是靠一颗不退缩的心。记住这句话。」',
  '',
  '他将自己的佩剑解下，递到你手中：「这把剑跟了我四十年。从今天起，它是你的了。」',
  '',
  '你双手接过。剑不重，但你握住它的时候，感到了某种很难描述的东西——不只是一把武器，而是一个人的一生，连同他未竟的事，一并交到了你手里。',
  '',
  '老人没有再多说话。他坐回石阶上，目光望向山下，很久都没有动。',
].join('\n');

sword.steps[3].choices = [
  {
    id: 'accept_legacy',
    text: '郑重拜谢，将剑系在腰间',
    effects: {
      attributes: { strength: 2, agility: 2, innerForce: 2 },
      narrative: '剑身入手，一股温热的剑意从柄端涌入，与你自身的内力融为一体。你知道，从这一刻起，你已经站到了剑道的巅峰——剑宗之名，实至名归。\n\n你下山时，老人说了一句话，声音很轻：「若你日后遇见什么……不该独自承担的事，记得，还有人在峰上。」',
    },
  },
];

// ── WRITE OUTPUT ──────────────────────────────────────────────────────────────

fs.writeFileSync(eventsPath, JSON.stringify(eventsData, null, 2), 'utf8');
fs.writeFileSync(chainsPath, JSON.stringify(chainsData, null, 2), 'utf8');

console.log('events.json and chains.json updated successfully.');
