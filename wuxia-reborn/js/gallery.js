// gallery.js — Illustration gallery with unlock tracking

const GALLERY_DATA = [
    // 武道传承
    { id: 'rebirth',                      name: '世界线回溯',           hint: '完成一世旅途，踏入轮回之门',               category: 'bosses' },
    { id: 'wuxiang-unlock',               name: '无相剑意',             hint: '完成「无相剑意」任务链',                   category: 'bosses' },
    { id: 'zhushi-zhi-wo',               name: '诸世共鸣',             hint: '完成「诸世之我」任务链——所有轮回的自己，聚于一念', category: 'bosses' },
    { id: 'truth-shards',                name: '碎片真相·五物对证',    hint: '完成「碎片真相」任务链——将五人的记忆碎片，一一摆在老者面前', category: 'bosses' },
    { id: 'elder-true-form',              name: '剑魂·吞噬',            hint: '以力量击败剑魂，却在胜利的瞬间被那道千年剑意吞噬——余光中，白发身影强行启动了玉佩', category: 'bosses', secret: true },
    // 传说瞬间
    { id: 'tianmo-and-jianhun',           name: '天魔与剑魂',           hint: '击败天魔后，玉牌碎裂——更古老的存在从碎片中浮现', category: 'bosses' },
    { id: 'sword-soul-win',               name: '斩破剑魂',             hint: '击败千年剑意——剑魂',                       category: 'bosses'  },
    { id: 'sword-soul-lose',              name: '败于剑意',             hint: '在与剑魂的对决中落败',                       category: 'bosses'  },
    { id: 'designer-win',                 name: '九百年前·终结',        hint: '以信念和人间之力，在九百年前终结了剑魂的本源——长夜将尽，曙光初破', category: 'bosses', secret: true },
    { id: 'designer-lose',               name: '九百年前·败北',        hint: '在那道千年剑意的本源面前力竭倒下，尚未准备好', category: 'bosses', secret: true },
    { id: 'tianmo-win',                   name: '天魔陨落',             hint: '击败天魔，完成二十岁的宿命',                 category: 'bosses'  },
    { id: 'tianmo-lose',                  name: '魔焰吞噬',             hint: '在天魔降临时力战不敌',                       category: 'bosses'  },
    // 羁绊情缘 — 王铁
    { id: 'wang-tie-meet',               name: '王铁·酒馆初识',       hint: '小镇酒馆，初遇独酌的老镖师',               category: 'bonds'   },
    { id: 'wang-tie-bond-1',             name: '王铁·镖路往事',       hint: '听老镖师讲述三十年走镖旧事，接过传承铁牌', category: 'bonds'   },
    { id: 'wang-tie-bond-2',             name: '王铁·两肋插刀',       hint: '夜道追镖，二人背靠背对抗盗匪',             category: 'bonds'   },
    { id: 'wang-tie-bond-3',             name: '王铁·最后一课',       hint: '老镖师将三十年活命心法倾囊相授',           category: 'bonds'   },
    { id: 'wang-tie-bond-4',             name: '王铁·刀碑',           hint: '城郊荒坡，他在旧弟兄的木桩墓碑前倾诉往事', category: 'bonds'   },
    { id: 'wang-tie-ending',             name: '王铁·最后的镖路',     hint: '雪丘上跪别，他将铁牌轻放在最后一座墓碑旁，头颅无声低垂。', category: 'bonds' },
    { id: 'wang-tie-afterstory',         name: '王铁·遗愿·追踪',      hint: '他去世后，你独自潜伏于黑鹰寨外，摸清赵霸天的行踪', category: 'bonds' },
    { id: 'wang-tie-afterstory-ending',  name: '王铁·遗愿·告慰英灵',  hint: '赵霸天倒下后，你独自来到王铁坟前，将他最爱的烧刀子洒入土中', category: 'bonds' },
    { id: 'wang-tie-true-ending',        name: '王铁·刀路犹存',        hint: '旧镖局院子前，有人在练那一套三十年走镖走出来的刀法',           category: 'bonds', secret: true },
    // 羁绊情缘 — 李云舒
    { id: 'li-yunshu-meet',              name: '李云舒·城外巧遇',     hint: '城外路上，她被流氓骚扰却毫无惧色',         category: 'bonds'   },
    { id: 'li-yunshu-bond-1',            name: '李云舒·梅园问剑',     hint: '梅园对剑，她演示亡母梅影剑的传承剑法',     category: 'bonds'   },
    { id: 'li-yunshu-bond-2',            name: '李云舒·护家立剑',     hint: '地痞欺压家业，她挺身守护不退让',           category: 'bonds'   },
    { id: 'li-yunshu-bond-3',            name: '李云舒·月下长谈',     hint: '城墙上的深夜，她说出十五岁那次无法忘却的杀人', category: 'bonds' },
    { id: 'li-yunshu-bond-4',            name: '李云舒·异地之邀',     hint: '秋水剑宗来函相邀三年，她在去留之间两难',   category: 'bonds'   },
    { id: 'li-yunshu-ending',            name: '李云舒·一剑长歌',     hint: '风过时，剑鸣如歌——那是属于两个人的长歌。', category: 'bonds' },
    { id: 'li-yunshu-afterstory',        name: '李云舒·旧案浮现',     hint: '整理她留下的旧物，发现亡母遗信，旧案重见天日', category: 'bonds' },
    { id: 'li-yunshu-afterstory-ending', name: '李云舒·母亲的墓前',   hint: '旧案了结后，二人并肩立于李若兰墓前，无声告别', category: 'bonds' },
    { id: 'li-yunshu-special-bond-5',   name: '李云舒·承重之剑',      hint: '她把剑拔了出来——不是对所有人一样，是看清楚了再选择', category: 'bonds', secret: true },
    { id: 'li-yunshu-true-ending',       name: '李云舒·此后同行',      hint: '高台上，她将旧信收进怀里，二人同望远山——第一次，时间是自己的了', category: 'bonds', secret: true },
    // 羁绊情缘 — 燕赤行
    { id: 'yan-chixing-meet',            name: '燕赤行·刀疤剑客',     hint: '演武场边，疤脸冷面男子直接向你发问',       category: 'bonds'   },
    { id: 'yan-chixing-bond-1',          name: '燕赤行·刀下问剑',     hint: '以剑相试，接受疤脸剑客的考验',             category: 'bonds'   },
    { id: 'yan-chixing-bond-2',          name: '燕赤行·铁幕之夜',     hint: '夜巷遭伏，神秘刺客携乌鸦令牌，你赶到共击来人',     category: 'bonds'   },
    { id: 'yan-chixing-bond-3',          name: '燕赤行·疤痕之下',     hint: '河边深夜，他第一次讲述含光门被灭的往事',   category: 'bonds'   },
    { id: 'yan-chixing-bond-4',          name: '燕赤行·血债与谎言',   hint: '季沧海独闯天魔，负伤求见，多年仇恨一朝真相',     category: 'bonds'   },
    { id: 'yan-chixing-ending',          name: '燕赤行·无名同行',     hint: '夜道同行，他走在前半步，暗处的风雪扑来，他侧身为你挡。', category: 'bonds' },
    { id: 'yan-chixing-afterstory',      name: '燕赤行·含光遗灯·归山', hint: '重返含光山废墟，他拂过墙上每一个名字，手最后停在两个还活着的人的名字上', category: 'bonds' },
    { id: 'yan-chixing-afterstory-ending', name: '燕赤行·含光遗灯·立碑', hint: '碑背面刻下三十个离去者的名字，留下两格空白——两个活着的人，不该被放进这里', category: 'bonds' },
    { id: 'yan-chixing-true-ending',       name: '燕赤行·了却前尘',      hint: '山路上轻装而行，他第一次没有什么放不下的',                     category: 'bonds', secret: true },
    // 羁绊情缘 — 苏青
    { id: 'su-qing-meet',                name: '苏青·顺手之事',       hint: '镇口巧遇，她正蹲身为孩子包扎伤口',         category: 'bonds'   },
    { id: 'su-qing-bond-1',              name: '苏青·山道偶遇',       hint: '她为你疗伤，讲述失踪五年、以身试毒的师父', category: 'bonds'   },
    { id: 'su-qing-bond-2',              name: '苏青·青心草',         hint: '悬崖峭壁，她执意为病童采集青心草',         category: 'bonds'   },
    { id: 'su-qing-bond-3',              name: '苏青·别离之药',       hint: '她收拾药箱准备远行寻师，临走留下一瓶解毒药', category: 'bonds' },
    { id: 'su-qing-bond-4',              name: '苏青·师门寻踪',       hint: '师父被扣押于山寨，营救行动迫在眉睫',       category: 'bonds'   },
    { id: 'su-qing-ending',              name: '苏青·针灸传心',       hint: '她背对着门口，肩膀轻轻颤着——她的父亲向你深深弯腰。', category: 'bonds' },
    { id: 'su-qing-afterstory',          name: '苏青·济世堂往事·秘方', hint: '师父透露手中藏有天魔解毒药方——是救人之药，还是终结之剑', category: 'bonds' },
    { id: 'su-qing-afterstory-ending',   name: '苏青·济世堂往事·重开', hint: '重新挂起的招牌下，她站在门口，望着落日',    category: 'bonds'   },
    { id: 'su-qing-true-ending',         name: '苏青·问脉道别',         hint: '济世堂里，她把了最后一次脉，叮嘱了一句：以后不用再重来了',      category: 'bonds', secret: true },
    // 羁绊情缘 — 凌雪
    { id: 'ling-xue-meet',               name: '凌雪·运气不错',       hint: '山道遭袭，白衣剑客凌空三剑救下你',         category: 'bonds'   },
    { id: 'ling-xue-bond-1',             name: '凌雪·雪中之刃',       hint: '茶馆遭袭，与她背靠背并肩击退刺客',         category: 'bonds'   },
    { id: 'ling-xue-bond-2',             name: '凌雪·夜雨论道',       hint: '夜雨中，她首次流露出对「唯强者方能改变」的疑惑', category: 'bonds' },
    { id: 'ling-xue-bond-3',             name: '凌雪·白雪留痕',       hint: '她主动找来，第一次开口指点你练剑',         category: 'bonds'   },
    { id: 'ling-xue-bond-4',             name: '凌雪·刃下真言',       hint: '她以天魔门首席弟子身份来见，随即选择叛出', category: 'bonds'   },
    { id: 'ling-xue-ending',             name: '凌雪·凌霜剑域',       hint: '冻原风雪中，两把剑并肩而立——不需要回头，也知道彼此不会退。', category: 'bonds' },
    { id: 'ling-xue-afterstory',         name: '凌雪·凌霜化雪·追杀',  hint: '天魔门追杀令至，她看了一眼，平静开口：来了', category: 'bonds' },
    { id: 'ling-xue-afterstory-ending',  name: '凌雪·凌霜化雪·自由',  hint: '追杀令碎成漫天白纸，随风而散——从今天起，我只是凌雪', category: 'bonds' },
    { id: 'ling-xue-afterstory-memory',  name: '凌雪·那一杯水',         hint: '她第一次知道，原来自己还是个可以被人这样对待的人', category: 'bonds', secret: true },
    { id: 'ling-xue-true-ending',        name: '凌雪·各走天涯',         hint: '山路拐角，她回头看了一眼，然后转身走进了薄雾里',               category: 'bonds', secret: true },
    // 羁绊情缘 — 神秘老者
    { id: 'mysterious-elder-meet',       name: '神秘老者·月夜现身',    hint: '月黑风高，练功时一位白发老人从黑暗中走来，问：你可知自己肩负着什么？', category: 'bonds' },
    { id: 'mysterious-elder-bond-1',     name: '神秘老者·茶馆问道',    hint: '茶馆一隅，他翻开掌心，星形烙印——那不是普通习武的代价', category: 'bonds' },
    { id: 'mysterious-elder-bond-2',     name: '神秘老者·内功指引',    hint: '他说：武道无捷径，走远了才是本事',            category: 'bonds'   },
    { id: 'mysterious-elder-bond-3',     name: '神秘老者·真名',        hint: '他摊开掌心，星形烙印说出了他的来历',          category: 'bonds'   },
    { id: 'mysterious-elder-bond-4',     name: '神秘老者·天魔本源',    hint: '刺客围困，他手持茶杯坐定，向你讲述弟子变魔的根源', category: 'bonds' },
    { id: 'mysterious-elder-ending',      name: '神秘老者·一线天命',   hint: '黄昏庭院，他摊开掌心——那是毕生修为最后的余温，他说：因为你让我相信，总有人能做到。', category: 'bonds' },
    { id: 'mysterious-elder-afterstory', name: '神秘老者·定渊遗剑·铜簪', hint: '老者取出一枚旧铜簪，讲述消失二十年的微尘',  category: 'bonds' },
    { id: 'mysterious-elder-afterstory-ending', name: '神秘老者·定渊遗剑·重逢', hint: '他颤抖的双手将旧铜簪重新别入女儿发间，二十年的分别就此落幕', category: 'bonds' },
    { id: 'mysterious-elder-true-ending', name: '神秘老者·长夜将晓',    hint: '九百年的枷锁散尽，沈微尘站在门口，第一次叫了一声：爹',         category: 'bonds', secret: true },
    // 人物立绘 — src overrides default illustrations/ path; alwaysUnlocked skips lock gate
    { id: 'portrait-player',          name: '主角',       hint: '踏入江湖的无名剑客',         category: 'portraits', src: 'assets/characters/player.jpg',          alwaysUnlocked: true },
    { id: 'portrait-wang-tie',         name: '王铁',       hint: '走江湖数十年的老侠客，刀法刚猛，心怀义气。',                           category: 'portraits', src: 'assets/characters/wang-tie.jpg'        },
    { id: 'portrait-li-yunshu',        name: '李云舒',     hint: '性情明烈的年轻女侠，亡母的梅影剑法由她一人传承。',                       category: 'portraits', src: 'assets/characters/li-yunshu.jpg'       },
    { id: 'portrait-yan-chixing',      name: '燕赤行',     hint: '左颊一道深疤，冷眼看江湖，刀光里藏着不轻易示人的过去。',               category: 'portraits', src: 'assets/characters/yan-chixing.jpg'     },
    { id: 'portrait-su-qing',          name: '苏青',       hint: '背着药箱走山路的女医者，眼神温柔，眉间总带着一丝淡淡的忧愁。',         category: 'portraits', src: 'assets/characters/su-qing.jpg'         },
    { id: 'portrait-ling-xue',         name: '凌雪',       hint: '白衣剑客，出手如霜，来历成谜——她从不多说，也从不久留。',               category: 'portraits', src: 'assets/characters/ling-xue.jpg'        },
    { id: 'portrait-mysterious-elder', name: '神秘老者',   hint: '年岁极深却脊背笔直，眼神平静得像早已看见了结局。',                     category: 'portraits', src: 'assets/characters/mysterious-elder.jpg'},
    { id: 'portrait-tianmo',           name: '天魔',       hint: '击败天魔后解锁。魔道宗师，武功通天——他说，每一世，他都在等你。',         category: 'portraits', src: 'assets/characters/tianmo.jpg'          },
    { id: 'portrait-jianhun',          name: '剑魂',       hint: '击败剑魂后解锁。千年剑意化形，没有面容，没有五官，只有一道纯粹的压迫。', category: 'portraits', src: 'assets/characters/jianhun.jpg'         },
];

const CATEGORY_LABELS = {
    bosses:   '传说瞬间',
    bonds:    '羁绊情缘',
    portraits: '人物立绘',
    replay:   '剧情回想',
};
const CATEGORY_ORDER = ['bosses', 'bonds', 'portraits', 'replay'];

// kebab NPC id → meet event id
const MEET_EVENT_IDS = {
    'wang-tie':         'meet_wang_tie',
    'li-yunshu':        'meet_li_yunshu',
    'yan-chixing':      'meet_yan_chixing',
    'su-qing':          'meet_su_qing',
    'ling-xue':         'meet_lingxue',
    'mysterious-elder': 'meet_mysterious_elder',
};
// meet event id → gallery illustration id
const MEET_ILL_IDS = {
    'meet_wang_tie':         'wang-tie-meet',
    'meet_li_yunshu':        'li-yunshu-meet',
    'meet_yan_chixing':      'yan-chixing-meet',
    'meet_su_qing':          'su-qing-meet',
    'meet_lingxue':          'ling-xue-meet',
    'meet_mysterious_elder': 'mysterious-elder-meet',
};
// snake NPC id → NPC-specific afterstory chain id
const NPC_AFTERSTORY_CHAIN = {
    'wang_tie':         'wang_revenge',
    'li_yunshu':        'li_yunshu_afterstory',
    'su_qing':          'su_qing_afterstory',
    'ling_xue':         'lingxue_afterstory',
    'mysterious_elder': 'elder_afterstory',
    'yan_chixing':      'yan_afterstory',
};

const Gallery = {
    _activeTab: 'bosses',
    _lightboxItems: [],
    _lightboxIdx: 0,
    _overlay: null,
    _lightbox: null,
    _grid: null,
    _tabsEl: null,
    _contents: [],      // [content0, content1, content2]
    _slotLeft: null,    // pre-loaded prev panel
    _slotCenter: null,  // visible panel
    _slotRight: null,   // pre-loaded next panel
    _animating: false,

    init() {
        this._overlay  = document.getElementById('galleryOverlay');
        this._lightbox = document.getElementById('galleryLightbox');
        this._grid     = document.getElementById('galleryGrid');
        this._tabsEl   = document.getElementById('galleryTabs');
        this._replayPanel = document.getElementById('galleryReplayPanel');
        this._replayTitle = document.getElementById('galleryReplayTitle');
        this._replayLog   = document.getElementById('galleryReplayLog');
        this._lbStage     = document.getElementById('galleryLbStage');
        this._replayToLb  = document.getElementById('galleryReplayToLb');
        document.getElementById('galleryReplayBack').onclick = () => this._closeReplay();
        this._contents = [
            document.getElementById('galleryLbContent0'),
            document.getElementById('galleryLbContent1'),
            document.getElementById('galleryLbContent2'),
        ];

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (this._lightbox && this._lightbox.classList.contains('active')) { this.closeLightbox(); return; }
                if (this._overlay  && this._overlay.classList.contains('active'))  this.close();
            }
            if (this._lightbox && this._lightbox.classList.contains('active')) {
                if (e.key === 'ArrowLeft')  this.navigateLightboxAnimated(-1);
                if (e.key === 'ArrowRight') this.navigateLightboxAnimated(1);
            }
        });

        let _touchStartX = 0;
        let _swiping = false;
        let _touchEl = null;

        const _cancelSwipe = () => {
            if (!_swiping) return;
            _swiping = false;
            if (_touchEl) { _touchEl.style.transition = 'transform 0.15s ease'; _touchEl.style.transform = ''; }
        };

        this._lightbox.addEventListener('touchstart', e => {
            if (this._animating) return;
            if (e.touches.length > 1) { _cancelSwipe(); return; }
            _touchStartX = e.touches[0].clientX;
            _swiping = true;
            _touchEl = this._slotCenter;
            if (_touchEl) _touchEl.style.transition = 'none';
        }, { passive: true });

        this._lightbox.addEventListener('touchmove', e => {
            if (!_swiping || !_touchEl || !this._lightbox.classList.contains('active')) return;
            if (e.touches.length > 1) { _cancelSwipe(); return; }
            const dx = e.touches[0].clientX - _touchStartX;
            _touchEl.style.transform = `translateX(${dx}px)`;
        }, { passive: true });

        this._lightbox.addEventListener('touchend', e => {
            if (!_swiping || !this._lightbox.classList.contains('active')) return;
            _swiping = false;
            const dx = e.changedTouches[0].clientX - _touchStartX;
            if (Math.abs(dx) > 50) {
                const goNext = dx < 0;
                const exitX = goNext ? -window.innerWidth : window.innerWidth;
                if (_touchEl) {
                    _touchEl.style.transition = 'transform 0.22s ease';
                    _touchEl.style.transform = `translateX(${exitX}px)`;
                }
                setTimeout(() => {
                    this._navigateRaw(goNext ? 1 : -1);
                    if (_touchEl) {
                        _touchEl.style.transition = 'none';
                        _touchEl.style.transform = `translateX(${-exitX}px)`;
                        void _touchEl.offsetWidth;
                        _touchEl.style.transition = 'transform 0.22s ease';
                        _touchEl.style.transform = '';
                        _touchEl.addEventListener('transitionend', () => this._initFlanks(), { once: true });
                    }
                }, 220);
            } else {
                if (_touchEl) { _touchEl.style.transition = 'transform 0.22s ease'; _touchEl.style.transform = ''; }
            }
        }, { passive: true });
    },

    unlockIllustration(id) {
        const char = (typeof Engine !== 'undefined') && Engine.state && Engine.state.char;
        if (!char) return;
        if (!char.unlockedIllustrations) char.unlockedIllustrations = [];
        if (!char.unlockedIllustrations.includes(id)) {
            char.unlockedIllustrations.push(id);
            if (typeof Engine !== 'undefined') Engine.saveGame();
        }
    },

    _getUnlocked() {
        const char = (typeof Engine !== 'undefined') && Engine.state && Engine.state.char;
        return (char && char.unlockedIllustrations) || [];
    },

    _unlockCondition(item) {
        if (item.secret) return '???';
        const id = item.id;
        const npcName = npcId => {
            const portrait = GALLERY_DATA.find(d => d.id === 'portrait-' + npcId);
            return portrait ? portrait.name : npcId;
        };
        let m;
        if ((m = id.match(/^portrait-(.+)$/)))            return `与${npcName(m[1])}相遇后解锁`;
        if ((m = id.match(/^(.+)-meet$/)))               return `与${npcName(m[1])}初遇后解锁`;
        if ((m = id.match(/^(.+)-afterstory-ending$/)))  return `完成${npcName(m[1])}后日谈后解锁`;
        if ((m = id.match(/^(.+)-afterstory$/)))         return `开启${npcName(m[1])}后日谈后解锁`;
        if ((m = id.match(/^(.+)-ending$/)))             return `${npcName(m[1])}羁绊圆满后解锁`;
        if ((m = id.match(/^(.+)-bond-(\d+)$/)))         return `达成${npcName(m[1])}第${m[2]}章羁绊后解锁`;
        return item.hint;
    },

    _isUnlocked(d, unlocked) {
        if (d.alwaysUnlocked) return true;
        if (unlocked.includes(d.id)) return true;
        if (d.category === 'portraits' && d.id.startsWith('portrait-')) {
            const npcId = d.id.replace('portrait-', '').replace(/-/g, '_');
            const npcs = (typeof Engine !== 'undefined') && Engine.state && Engine.state.npcs;
            return !!(npcs && npcs.some(n => n.id === npcId));
        }
        return false;
    },

    open() {
        if (!this._overlay) return;
        this._overlay.classList.add('active');
        this._buildTabs();
        this.switchTab(this._activeTab);
    },

    close() {
        if (this._overlay) this._overlay.classList.remove('active');
    },

    _buildTabs() {
        const unlocked = this._getUnlocked();
        this._tabsEl.innerHTML = '';
        for (const cat of CATEGORY_ORDER) {
            const items = GALLERY_DATA.filter(d => d.category === cat);
            const unlockedCount = items.filter(d => this._isUnlocked(d, unlocked)).length;
            const btn = document.createElement('button');
            btn.className = 'gallery-tab' + (cat === this._activeTab ? ' active' : '');
            btn.dataset.cat = cat;
            if (cat === 'replay') {
                const char = (typeof Engine !== 'undefined') && Engine.state && Engine.state.char;
                const bl  = (char && char.bondLevels)         || {};
                const lbl = (char && char.lifetimeBondLevels) || {};
                const cp  = (char && char.chainProgress)      || {};
                const lcd = (char && char.lifetimeChainsDone) || [];
                // Merge current + lifetime for badge count
                const mergedBl = { ...lbl };
                for (const [id, lvl] of Object.entries(bl)) mergedBl[id] = Math.max(mergedBl[id] || 0, Number(lvl) || 0);
                const allDoneChains = new Set([...lcd, ...Object.keys(cp).filter(k => cp[k] === 'done')]);
                const n = Object.values(mergedBl).reduce((s, v) => s + (Number(v) || 0), 0) + allDoneChains.size;
                btn.innerHTML = CATEGORY_LABELS[cat] + (n > 0 ? `<span class="gallery-tab-badge">${n}</span>` : '');
            } else {
                btn.innerHTML = CATEGORY_LABELS[cat] +
                    `<span class="gallery-tab-badge">${unlockedCount}/${items.length}</span>`;
            }
            btn.onclick = () => this.switchTab(cat);
            this._tabsEl.appendChild(btn);
        }
    },

    switchTab(category) {
        this._activeTab = category;
        // Update tab active state
        for (const btn of this._tabsEl.querySelectorAll('.gallery-tab')) {
            btn.classList.toggle('active', btn.dataset.cat === category);
        }
        this._replayPanel.style.display = 'none';
        if (category === 'replay') {
            this._renderReplayList();
        } else {
            this._grid.style.display = '';
            this._renderGrid(category);
        }
    },

    _renderGrid(category) {
        const unlocked = this._getUnlocked();
        const items = GALLERY_DATA.filter(d => d.category === category);
        this._grid.innerHTML = '';
        this._grid.classList.remove('has-pinned');

        items.forEach((item, i) => {
            const isUnlocked = this._isUnlocked(item, unlocked);
            const card = document.createElement('div');
            card.className = 'gallery-card' + (isUnlocked ? '' : ' locked');

            // Inner element receives tilt transform so the card's grid boundary never moves
            const inner = document.createElement('div');
            inner.className = 'gallery-card-inner';

            const img = document.createElement('img');
            img.alt = item.name;
            if (isUnlocked) {
                const hqSrc = item.src || `assets/illustrations/${item.id}.jpg`;
                loadProgressiveImg(img, hqSrc, 'assets/illustrations/placeholder.svg');
            } else {
                img.src = 'assets/illustrations/placeholder.svg';
            }
            inner.appendChild(img);

            if (!isUnlocked) {
                const lock = document.createElement('div');
                lock.className = 'gallery-card-lock-icon';
                lock.textContent = '🔒';
                inner.appendChild(lock);

                const hint = document.createElement('div');
                hint.className = 'gallery-card-hint';
                hint.textContent = this._unlockCondition(item);
                inner.appendChild(hint);

                card.onclick = () => {
                    const wasVisible = card.classList.contains('hint-visible');
                    this._grid.querySelectorAll('.hint-visible').forEach(c => c.classList.remove('hint-visible'));
                    if (!wasVisible) {
                        card.classList.add('hint-visible');
                        this._grid.classList.add('has-pinned');
                    } else {
                        this._grid.classList.remove('has-pinned');
                    }
                };
            }

            const label = document.createElement('div');
            label.className = 'gallery-card-label';
            label.textContent = isUnlocked ? item.name : '???';
            inner.appendChild(label);

            card.appendChild(inner);

            if (isUnlocked) {
                card.onclick = () => this.openLightbox(item.id, category);
                card.addEventListener('mousemove', e => {
                    const r = card.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width  - 0.5;
                    const y = (e.clientY - r.top)  / r.height - 0.5;
                    inner.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
                });
                card.addEventListener('mouseleave', () => {
                    inner.style.transform = '';
                });
            }

            this._grid.appendChild(card);

            // Staggered entrance
            setTimeout(() => card.classList.add('entered'), i * 55);
        });
    },

    _renderReplayList() {
        this._grid.style.display = '';
        this._grid.innerHTML = '';

        const char = (typeof Engine !== 'undefined') && Engine.state && Engine.state.char;
        const bondLevels         = (char && char.bondLevels)         || {};
        const lifetimeBondLevels = (char && char.lifetimeBondLevels) || {};
        const chainProgress      = (char && char.chainProgress)      || {};
        const lifetimeChainsDone = (char && char.lifetimeChainsDone) || [];
        const unlockedIlls       = (char && char.unlockedIllustrations) || [];
        const chains             = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.chains) || [];

        const mergedBondLevels = { ...lifetimeBondLevels };
        for (const [id, lvl] of Object.entries(bondLevels)) {
            mergedBondLevels[id] = Math.max(mergedBondLevels[id] || 0, Number(lvl) || 0);
        }
        const allDoneChainIds = new Set([
            ...lifetimeChainsDone,
            ...Object.keys(chainProgress).filter(k => chainProgress[k] === 'done')
        ]);
        const npcChainIds = new Set(Object.values(NPC_AFTERSTORY_CHAIN));

        const CHAPTER = ['一', '二', '三', '四', '五'];
        const container = document.createElement('div');
        container.className = 'gallery-replay-list';

        // ── NPC order derived from bond-1 entries in GALLERY_DATA ──
        const seenNpcs = new Set();
        const npcOrder = [];
        for (const d of GALLERY_DATA) {
            if (d.category !== 'bonds') continue;
            const m = d.id.match(/^([a-z-]+)-bond-\d+$/);
            if (!m) continue;
            const kebab = m[1];
            if (!seenNpcs.has(kebab)) { seenNpcs.add(kebab); npcOrder.push(kebab); }
        }

        let hasBondSection = false;
        for (const kebab of npcOrder) {
            const snakeId = kebab.replace(/-/g, '_');
            const maxLevel = Number(mergedBondLevels[snakeId] || 0);
            const meetUnlocked = unlockedIlls.includes(kebab + '-meet');
            const npcChainId = NPC_AFTERSTORY_CHAIN[snakeId];
            const npcChain = (npcChainId && allDoneChainIds.has(npcChainId))
                ? chains.find(c => c.id === npcChainId) : null;

            if (!meetUnlocked && maxLevel < 1 && !npcChain) continue;

            if (!hasBondSection) {
                const mainHdr = document.createElement('div');
                mainHdr.className = 'gallery-replay-main-header';
                mainHdr.textContent = '羁绊情缘';
                container.appendChild(mainHdr);
                hasBondSection = true;
            }

            const portrait = GALLERY_DATA.find(d => d.id === 'portrait-' + kebab);
            const displayName = portrait ? portrait.name : kebab;

            const details = document.createElement('details');
            details.className = 'gallery-replay-npc-group';
            details.open = true;
            const summary = document.createElement('summary');
            summary.className = 'gallery-replay-npc-header';
            summary.textContent = displayName;
            details.appendChild(summary);

            const ul = document.createElement('ul');
            ul.className = 'gallery-replay-npc-items';

            if (meetUnlocked) {
                const meetEventId = MEET_EVENT_IDS[kebab];
                if (meetEventId) {
                    const li = document.createElement('li');
                    li.textContent = '初遇';
                    li.onclick = () => this._openReplay('meet', meetEventId, null, `${displayName}·初遇`);
                    ul.appendChild(li);
                }
            }
            for (let lvl = 1; lvl <= maxLevel; lvl++) {
                const li = document.createElement('li');
                li.textContent = `第${CHAPTER[lvl - 1] || lvl}章`;
                li.onclick = () => this._openReplay('bond', snakeId, lvl, `${displayName}·第${CHAPTER[lvl - 1] || lvl}章`);
                ul.appendChild(li);
            }
            if (npcChain) {
                const li = document.createElement('li');
                li.textContent = npcChain.name;
                li.onclick = () => this._openReplay('chain', npcChain.id, null, npcChain.name);
                ul.appendChild(li);
                const endingIllId = kebab + '-afterstory-ending';
                const endingMeta = GALLERY_DATA.find(d => d.id === endingIllId);
                if (endingMeta) {
                    const li2 = document.createElement('li');
                    li2.textContent = endingMeta.name.split('·').pop();
                    const startStep = Math.max(0, npcChain.steps.length - 1);
                    li2.onclick = () => this._openReplay('chain', npcChain.id, null, endingMeta.name, null, startStep, endingIllId);
                    ul.appendChild(li2);
                }
            }

            details.appendChild(ul);
            container.appendChild(details);
        }

        // ── Non-NPC completed chains → 支线传说 ──
        const standaloneChains = chains.filter(c => allDoneChainIds.has(c.id) && !npcChainIds.has(c.id));
        if (standaloneChains.length > 0) {
            const mainHdr = document.createElement('div');
            mainHdr.className = 'gallery-replay-main-header';
            mainHdr.textContent = '支线传说';
            container.appendChild(mainHdr);
            const ul = document.createElement('ul');
            ul.className = 'gallery-replay-npc-items';
            for (const chain of standaloneChains) {
                const li = document.createElement('li');
                li.textContent = chain.name;
                li.onclick = () => this._openReplay('chain', chain.id, null, chain.name);
                ul.appendChild(li);
            }
            container.appendChild(ul);
        }

        if (!hasBondSection && standaloneChains.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'gallery-replay-main-header';
            empty.textContent = '暂无可回想的剧情';
            container.appendChild(empty);
        }

        this._grid.appendChild(container);
    },

    _openReplay(type, id, level, title, fromLb, startStep = 0, customIllId = null) {
        this._grid.style.display = 'none';
        this._replayTitle.textContent = title || '';
        this._replayLog.innerHTML = '';
        this._replayPanel.style.display = 'flex';
        this._replaySeq = (this._replaySeq || 0) + 1;
        const token = this._replaySeq;
        this._replaySkip = null;
        if (this._replayToLb) {
            if (fromLb) {
                this._replayToLb.style.display = '';
                this._replayToLb.onclick = () => {
                    this._closeReplay();
                    this.switchTab(fromLb.category);
                    this.openLightbox(fromLb.id, fromLb.category);
                };
            } else {
                this._replayToLb.style.display = 'none';
            }
        }
        this._runReplay(type, id, level, token, startStep, customIllId);
    },

    _segmentText(text, minLen = 70) {
        const result = [];
        for (const hard of text.split('▼')) {
            const paras = hard.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
            if (!paras.length) continue;
            let group = [], groupLen = 0;
            for (const para of paras) {
                group.push(para);
                groupLen += para.length;
                if (groupLen >= minLen) {
                    result.push(group.join('\n\n'));
                    group = []; groupLen = 0;
                }
            }
            if (group.length) result.push(group.join('\n\n'));
        }
        return result.length ? result : [text];
    },

    _runReplay(type, id, level, token, startStep = 0, customIllId = null) {
        const bonds  = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.bonds)  || {};
        const chains = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.chains) || [];

        let steps = [];
        let completionNarrative = null;

        if (type === 'bond') {
            const levelArr = bonds[id] || [];
            const levelData = levelArr.find(b => b.level === level);
            steps = (levelData && levelData.steps) || [];
        } else if (type === 'meet') {
            const events = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.events) || [];
            const ev = events.find(e => e.id === id);
            if (ev) steps = [{ text: ev.text, choices: ev.choices || [] }];
        } else {
            const chain = chains.find(c => c.id === id);
            steps = ((chain && chain.steps) || []).slice(startStep);
            if (chain && chain.completionReward && chain.completionReward.narrative) {
                completionNarrative = chain.completionReward.narrative;
            }
        }

        // Derive illustration ID
        let illId = customIllId || null;
        if (!illId) {
            if (type === 'bond') {
                const maxLevel = (bonds[id] || []).length;
                illId = level >= maxLevel
                    ? id.replace(/_/g, '-') + '-ending'
                    : id.replace(/_/g, '-') + '-bond-' + level;
            } else if (type === 'meet') {
                illId = MEET_ILL_IDS[id] || null;
            } else {
                const kebab = id.replace(/_/g, '-');
                if (GALLERY_DATA.find(d => d.id === kebab)) illId = kebab;
            }
        }

        // Build ordered list of {text, cls} items to stream
        const items = [];
        items.push({ text: '── 剧情回想 ──', cls: 'sep' });

        for (const step of steps) {
            const choices = step.choices || [];
            const combatChoices = choices.filter(c => c.effects && c.effects.combat);
            // Skip step if ALL choices are combat (pure combat gate, no story text worth showing)
            if (choices.length > 0 && combatChoices.length === choices.length) continue;

            if (step.text) this._segmentText(step.text).forEach(t => items.push({ text: t, cls: 'narrative' }));

            const nonCombat = choices.filter(c => !(c.effects && c.effects.combat));
            for (const choice of nonCombat) {
                items.push({ text: choice.text, cls: 'choice' });
                const narr = choice.effects && choice.effects.narrative;
                if (narr) this._segmentText(narr).forEach(t => items.push({ text: t, cls: 'narrative' }));
            }
        }

        if (completionNarrative) this._segmentText(completionNarrative).forEach(t => items.push({ text: t, cls: 'narrative' }));
        // Illustration appears after all text so the reader finishes the story first
        if (illId) items.push({ cls: 'illustration', illId });
        items.push({ text: '── 回想结束 ──', cls: 'sep' });

        const log = this._replayLog;

        const scrollIntoView = (el) => {
            const logRect = log.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            if (elRect.bottom > logRect.bottom - 8) {
                log.scrollTop = log.scrollHeight;
            }
        };

        // Single timeout ID — cleared on every skip so old ticks never re-queue.
        let tickId = null;
        const cancelTick = () => { clearTimeout(tickId); tickId = null; };

        const advance = (i) => {
            if (token !== this._replaySeq) return;
            cancelTick();
            render(i);
        };

        const render = (i) => {
            if (token !== this._replaySeq) return;
            if (i >= items.length) {
                const blank = document.createElement('p');
                blank.className = 'log-replay-narrative';
                blank.innerHTML = '&nbsp;';
                log.appendChild(blank);
                this._replaySkip = null;
                return;
            }
            const { text, cls, illId } = items[i];
            if (cls === 'illustration') {
                const img = document.createElement('img');
                img.className = 'gallery-replay-illustration';
                img.alt = '';
                loadProgressiveImg(img, `assets/illustrations/${illId}.jpg`, null);
                log.appendChild(img);
                scrollIntoView(img);
                this._replaySkip = () => advance(i + 1);
                tickId = setTimeout(() => advance(i + 1), 2000);
                return;
            }
            const p = document.createElement('p');
            if (cls === 'choice') p.className = 'log-replay-choice';
            else if (cls === 'sep') p.className = 'log-replay-sep';
            else p.className = 'log-replay-narrative';
            log.appendChild(p);

            // sep: appear instantly, advance on next tick
            if (cls === 'sep') {
                p.textContent = text;
                this._replaySkip = () => advance(i + 1);
                tickId = setTimeout(() => advance(i + 1), 0);
                return;
            }

            if (cls === 'narrative') {
                const subParas = text.split('\n\n');
                const cumPos = [];
                let pos = 0;
                for (const sp of subParas) { cumPos.push(pos); pos += sp.length + 2; }
                let curParaIdx = 0;
                let curP = p;

                const updateRender = (j) => {
                    let pi = 0;
                    while (pi < subParas.length - 1 && j >= cumPos[pi + 1]) pi++;
                    while (curParaIdx < pi) {
                        curP.textContent = subParas[curParaIdx];
                        curParaIdx++;
                        curP = document.createElement('p');
                        curP.className = 'log-replay-narrative';
                        log.appendChild(curP);
                    }
                    const posInPara = Math.min(j - cumPos[pi], subParas[pi].length);
                    curP.textContent = subParas[pi].slice(0, Math.max(0, posInPara));
                };

                const finalizeAll = () => {
                    while (curParaIdx < subParas.length - 1) {
                        curP.textContent = subParas[curParaIdx];
                        curParaIdx++;
                        curP = document.createElement('p');
                        curP.className = 'log-replay-narrative';
                        log.appendChild(curP);
                    }
                    curP.textContent = subParas[subParas.length - 1];
                };

                const showHint = () => {
                    finalizeAll();
                    const hint = document.createElement('span');
                    hint.className = 'gallery-replay-continue-hint';
                    hint.textContent = ' ▼';
                    curP.appendChild(hint);
                    scrollIntoView(curP);
                    this._replaySkip = () => { hint.remove(); advance(i + 1); };
                };

                let j = 0;
                this._replaySkip = () => { cancelTick(); showHint(); };

                const tick = () => {
                    if (token !== this._replaySeq) return;
                    updateRender(++j);
                    if (j > 1) scrollIntoView(curP);
                    if (j < text.length) { tickId = setTimeout(tick, 28); }
                    else { showHint(); }
                };
                tick();
            } else {
                // choice: auto-advance after typing
                let j = 0;
                this._replaySkip = () => {
                    cancelTick();
                    p.textContent = text;
                    scrollIntoView(p);
                    this._replaySkip = () => advance(i + 1);
                    tickId = setTimeout(() => advance(i + 1), 200);
                };
                const tick = () => {
                    if (token !== this._replaySeq) return;
                    p.textContent = text.slice(0, ++j);
                    if (j > 1) scrollIntoView(p);
                    if (j < text.length) {
                        tickId = setTimeout(tick, 28);
                    } else {
                        this._replaySkip = () => advance(i + 1);
                        tickId = setTimeout(() => advance(i + 1), 200);
                    }
                };
                tick();
            }
        };

        this._replayLog.onclick = () => {
            if (this._replaySkip) this._replaySkip();
        };
        render(0);
    },

    _closeReplay() {
        this._replaySeq = (this._replaySeq || 0) + 1;
        this._replaySkip = null;
        this._replayNext = null;
        this._replayPanel.style.display = 'none';
        this._replayLog.innerHTML = '';
        if (this._replayToLb) this._replayToLb.style.display = 'none';
        this._renderReplayList();
    },

    openLightbox(id, category) {
        const cat = category || this._activeTab;
        this._lightboxItems = GALLERY_DATA.filter(d => d.category === cat).map(d => d.id);
        this._lightboxIdx = this._lightboxItems.indexOf(id);
        if (this._lightboxIdx < 0) return;
        this._animating = false;
        // Park all slots far off-screen before showing so they don't flash
        for (const c of this._contents) {
            c.style.transition = 'none';
            c.style.transform  = 'translate3d(-9999px, 0, 0)';
            c.style.zIndex     = '';
        }
        this._lightbox.classList.add('active');
        void this._contents[0].offsetWidth; // flush: lightbox is now rendered, offsetWidth is real
        this._initSlots();
        const vp = document.querySelector('meta[name="viewport"]');
        if (vp) vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
    },

    closeLightbox() {
        if (this._lightbox) this._lightbox.classList.remove('active');
        this._animating = false;
        const vp = document.querySelector('meta[name="viewport"]');
        if (vp) {
            // Force browser to snap back to scale 1 by locking scale momentarily,
            // then restore normal scrollable viewport on the next frame.
            vp.content = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';
            requestAnimationFrame(() => {
                vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
            });
        }
    },

    // ── Slot helpers ────────────────────────────────────────────────────────

    _getReplayInfo(meta) {
        if (meta.category !== 'bonds') return null;
        const id = meta.id;
        const CHAPTER = ['一', '二', '三', '四', '五'];
        // Afterstory/afterstory-ending → chain replay
        const AFTERSTORY_CHAIN = {
            'wang-tie-afterstory':              'wang_revenge',
            'wang-tie-afterstory-ending':       'wang_revenge',
            'li-yunshu-afterstory':             'li_yunshu_afterstory',
            'li-yunshu-afterstory-ending':      'li_yunshu_afterstory',
            'su-qing-afterstory':               'su_qing_afterstory',
            'su-qing-afterstory-ending':        'su_qing_afterstory',
            'ling-xue-afterstory':              'lingxue_afterstory',
            'ling-xue-afterstory-ending':       'lingxue_afterstory',
            'ling-xue-afterstory-memory':       'lingxue_afterstory',
            'mysterious-elder-afterstory':      'elder_afterstory',
            'mysterious-elder-afterstory-ending': 'elder_afterstory',
            'yan-chixing-afterstory':           'yan_afterstory',
            'yan-chixing-afterstory-ending':    'yan_afterstory',
        };
        if (AFTERSTORY_CHAIN[id]) {
            const chainId = AFTERSTORY_CHAIN[id];
            const chains = (typeof Engine !== 'undefined') && Engine.state && Engine.state.chains || [];
            const chain = chains.find(c => c.id === chainId);
            if (!chain) return null;
            const isEnding = id.endsWith('-afterstory-ending');
            if (isEnding) {
                const startStep = Math.max(0, chain.steps.length - 1);
                const endingMeta = GALLERY_DATA.find(d => d.id === id);
                const title = endingMeta ? endingMeta.name : chain.name;
                return { type: 'chain', id: chainId, level: null, title, startStep, customIllId: id };
            }
            return { type: 'chain', id: chainId, level: null, title: chain.name, startStep: 0, customIllId: null };
        }
        let m;
        if ((m = id.match(/^(.+)-meet$/))) {
            const npcKebab = m[1];
            const eventId = MEET_EVENT_IDS[npcKebab];
            if (!eventId) return null;
            const events = (typeof Engine !== 'undefined') && Engine.state && Engine.state.events || [];
            const ev = events.find(e => e.id === eventId);
            if (!ev) return null;
            const portrait = GALLERY_DATA.find(d => d.id === `portrait-${npcKebab}`);
            const npcName = portrait ? portrait.name : npcKebab;
            return { type: 'meet', id: eventId, level: null, title: `${npcName}·初遇` };
        }
        if ((m = id.match(/^(.+)-bond-(\d+)$/))) {
            const npcKebab = m[1];
            const level = parseInt(m[2]);
            const npcSnake = npcKebab.replace(/-/g, '_');
            const portrait = GALLERY_DATA.find(d => d.id === `portrait-${npcKebab}`);
            const npcName = portrait ? portrait.name : npcKebab;
            return { type: 'bond', id: npcSnake, level, title: `${npcName} · 第${CHAPTER[level - 1] || level}章` };
        }
        if ((m = id.match(/^(.+)-ending$/))) {
            const npcKebab = m[1];
            const npcSnake = npcKebab.replace(/-/g, '_');
            const bonds = (typeof Engine !== 'undefined') && Engine.state && Engine.state.bonds || {};
            const maxLevel = (bonds[npcSnake] || []).length;
            if (!maxLevel) return null;
            const portrait = GALLERY_DATA.find(d => d.id === `portrait-${npcKebab}`);
            const npcName = portrait ? portrait.name : npcKebab;
            return { type: 'bond', id: npcSnake, level: maxLevel, title: `${npcName} · 第${CHAPTER[maxLevel - 1] || maxLevel}章` };
        }
        return null;
    },

    _fillSlot(el, idx) {
        if (!el) return;
        if (idx < 0) { el.style.visibility = 'hidden'; return; }
        el.style.visibility = '';
        const id = this._lightboxItems[idx];
        const meta = GALLERY_DATA.find(d => d.id === id) || { name: id, hint: '', category: 'bosses' };
        const hqSrc = meta.src || `assets/illustrations/${id}.jpg`;
        const img = el.querySelector('.gallery-lb-img');
        img.onerror = null;  // prevent stale handler from firing when src is cleared
        img.src = '';  // clear stale image before progressive load starts
        loadProgressiveImg(img, hqSrc, 'assets/illustrations/placeholder.svg', { skipThumb: true });
        el.querySelector('.gallery-lb-name').textContent = meta.name;
        el.querySelector('.gallery-lb-category').textContent = CATEGORY_LABELS[meta.category] || '';
        el.querySelector('.gallery-lb-hint').textContent = meta.hint;
        const replayBtn = el.querySelector('.gallery-lb-replay');
        if (replayBtn) {
            const info = this._getReplayInfo(meta);
            if (info) {
                replayBtn.style.display = '';
                replayBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.closeLightbox();
                    this._activeTab = 'replay';
                    for (const btn of this._tabsEl.querySelectorAll('.gallery-tab')) {
                        btn.classList.toggle('active', btn.dataset.cat === 'replay');
                    }
                    this._openReplay(info.type, info.id, info.level, info.title, { id: meta.id, category: meta.category }, info.startStep || 0, info.customIllId || null);
                };
            } else {
                replayBtn.style.display = 'none';
            }
        }
    },

    // visible=true only for the center slot; flanks are always hidden
    _placeSlot(el, x, visible = false) {
        if (!el) return;
        el.style.transition = 'none';
        el.style.transform = visible ? 'none' : `translate3d(${x}px, 0, 0)`;
        el.style.visibility = visible ? 'visible' : 'hidden';
    },

    _initSlots() {
        // Assign: content0=left, content1=center, content2=right
        [this._slotLeft, this._slotCenter, this._slotRight] = this._contents;
        this._fillSlot(this._slotCenter, this._lightboxIdx);
        this._placeSlot(this._slotCenter, 0, true);
        this._initFlanks();
    },

    _initFlanks() {
        const dist = (this._lbStage && this._lbStage.offsetWidth)
            || (this._slotCenter && this._slotCenter.offsetWidth)
            || Math.min(1100, window.innerWidth * 0.98)
            || 500;
        const prevIdx = this._findNextUnlockedFrom(this._lightboxIdx, -1);
        const nextIdx = this._findNextUnlockedFrom(this._lightboxIdx,  1);
        // Assign the two non-center elements to left/right
        const others = this._contents.filter(c => c !== this._slotCenter);
        this._slotLeft  = others[0];
        this._slotRight = others[1];
        this._fillSlot(this._slotLeft,  prevIdx);
        this._fillSlot(this._slotRight, nextIdx);
        this._placeSlot(this._slotLeft,  prevIdx >= 0 ? -dist : -9999, false);
        this._placeSlot(this._slotRight, nextIdx >= 0 ?  dist :  9999, false);
        const prev = document.getElementById('galleryLbPrev');
        const next = document.getElementById('galleryLbNext');
        if (prev) prev.disabled = prevIdx < 0;
        if (next) next.disabled = nextIdx < 0;
    },

    // ── Navigation ──────────────────────────────────────────────────────────

    _findNextUnlockedFrom(fromIdx, delta) {
        const unlocked = this._getUnlocked();
        let i = fromIdx + delta;
        while (i >= 0 && i < this._lightboxItems.length) {
            const d = GALLERY_DATA.find(x => x.id === this._lightboxItems[i]);
            if (d && this._isUnlocked(d, unlocked)) return i;
            i += delta;
        }
        return -1;
    },

    _findNextUnlocked(delta) {
        return this._findNextUnlockedFrom(this._lightboxIdx, delta);
    },

    // Raw navigate used by touch code — fills center slot, defers flank setup
    _navigateRaw(delta) {
        const next = this._findNextUnlocked(delta);
        if (next < 0) return;
        this._lightboxIdx = next;
        this._fillSlot(this._slotCenter, next);
        this._placeSlot(this._slotCenter, 0, true);
    },

    // Animated navigate for keyboard / buttons — simultaneous two-panel slide
    navigateLightboxAnimated(delta) {
        if (this._animating) return;
        const nextIdx = this._findNextUnlocked(delta);
        if (nextIdx < 0) return;
        this._animating = true;

        const goRight = delta > 0;
        const entering = goRight ? this._slotRight : this._slotLeft;
        const exiting  = this._slotCenter;
        const dist = (this._lbStage && this._lbStage.offsetWidth) || exiting.offsetWidth || 500;

        // Reveal entering slot just before animating (flanks are hidden by default)
        entering.style.visibility = 'visible';
        // Entering must always render on top regardless of DOM order
        entering.style.zIndex = '2';
        exiting.style.zIndex  = '1';

        void exiting.offsetWidth; // flush
        const ease = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
        exiting.style.willChange  = 'transform';
        entering.style.willChange = 'transform';
        exiting.style.transition  = ease;
        exiting.style.transform   = `translate3d(${goRight ? -dist : dist}px, 0, 0)`;
        entering.style.transition = ease;
        entering.style.transform  = 'translate3d(0, 0, 0)';

        entering.addEventListener('transitionend', () => {
            exiting.style.willChange = '';
            entering.style.willChange = '';
            entering.style.zIndex = '';
            exiting.style.zIndex  = '';
            // Canonicalize entering slot to transform:none (not translate3d(0,0,0))
            // so subsequent _placeSlot calls start from a clean baseline.
            entering.style.transition = 'none';
            entering.style.transform  = 'none';
            this._lightboxIdx = nextIdx;
            this._slotCenter  = entering;
            // Defer _initFlanks by one rAF so the browser demotes will-change layers
            // before we reposition the exiting slot, preventing compositor-layer flash.
            requestAnimationFrame(() => {
                this._initFlanks();
                this._animating = false;
            });
        }, { once: true });
    },

    // Keep navigateLightbox as alias used by older touch path (no-op now, raw is used)
    navigateLightbox(delta) { this._navigateRaw(delta); },
};

if (typeof module !== 'undefined') module.exports = { Gallery };
