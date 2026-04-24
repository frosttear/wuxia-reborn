// gallery.js — Illustration gallery with unlock tracking

const GALLERY_DATA = [
    // 江湖奇遇
    { id: 'journey-dawn',                 name: '黎明远行',             hint: '踏入江湖，在某段旅途中邂逅',               category: 'scenes'  },
    { id: 'ancient-grotto',               name: '古洞天地',             hint: '偶入一处古洞，感受上古遗迹的气息',         category: 'scenes'  },
    { id: 'winter-seclusion',             name: '寒冬闭关',             hint: '于漫天风雪中独自苦修',                     category: 'scenes'  },
    { id: 'temple-visit',                 name: '庙中拜神',             hint: '于古刹中敬香，感悟天地之道',               category: 'scenes'  },
    { id: 'past-life-dream',              name: '前世梦境',             hint: '梦境与现实交织，往世记忆浮现',             category: 'scenes'  },
    // 武道传承
    { id: 'rebirth',                      name: '世界线回溯',           hint: '完成一世旅途，踏入轮回之门',               category: 'bosses' },
    { id: 'wuxiang-unlock',               name: '无相剑意',             hint: '完成「无相剑意」任务链',                   category: 'bosses' },
    { id: 'elder-true-form',              name: '设计者显形',           hint: '首次面对轮回的设计者——沈玄清的真实目的浮出水面', category: 'bosses', secret: true },
    // 传说瞬间
    { id: 'sword-soul-win',               name: '斩破剑魂',             hint: '击败千年剑意——剑魂',                     category: 'bosses'  },
    { id: 'sword-soul-lose',              name: '败于剑意',             hint: '在与剑魂的对决中落败',                     category: 'bosses'  },
    { id: 'tianmo-win',                   name: '天魔陨落',             hint: '击败天魔，完成二十岁的宿命',               category: 'bosses'  },
    { id: 'tianmo-lose',                  name: '魔焰吞噬',             hint: '在天魔降临时力战不敌',                     category: 'bosses'  },
    // 羁绊情缘 — 王铁
    { id: 'wang-tie-meet',               name: '王铁·酒馆初识',       hint: '小镇酒馆，初遇独酌的老镖师',               category: 'bonds'   },
    { id: 'wang-tie-bond-1',             name: '王铁·镖路往事',       hint: '听老镖师讲述三十年走镖旧事，接过传承铁牌', category: 'bonds'   },
    { id: 'wang-tie-bond-2',             name: '王铁·两肋插刀',       hint: '夜道追镖，二人背靠背对抗盗匪',             category: 'bonds'   },
    { id: 'wang-tie-bond-3',             name: '王铁·最后一课',       hint: '老镖师将三十年活命心法倾囊相授',           category: 'bonds'   },
    { id: 'wang-tie-bond-4',             name: '王铁·刀碑',           hint: '城郊荒坡，他在旧弟兄的木桩墓碑前倾诉往事', category: 'bonds'   },
    { id: 'wang-tie-ending',             name: '王铁·最后的镖路',     hint: '雪丘上跪别，他将铁牌轻放在最后一座墓碑旁，头颅无声低垂。', category: 'bonds' },
    { id: 'wang-tie-afterstory',         name: '王铁·遗愿·追踪',      hint: '他去世后，你独自潜伏于黑鹰寨外，摸清赵霸天的行踪', category: 'bonds' },
    { id: 'wang-tie-afterstory-ending',  name: '王铁·遗愿·告慰英灵',  hint: '赵霸天倒下后，你独自来到王铁坟前，将他最爱的烧刀子洒入土中', category: 'bonds' },
    // 羁绊情缘 — 李云舒
    { id: 'li-yunshu-meet',              name: '李云舒·城外巧遇',     hint: '城外路上，她被流氓骚扰却毫无惧色',         category: 'bonds'   },
    { id: 'li-yunshu-bond-1',            name: '李云舒·梅园问剑',     hint: '梅园对剑，她演示亡母梅影剑的传承剑法',     category: 'bonds'   },
    { id: 'li-yunshu-bond-2',            name: '李云舒·护家立剑',     hint: '地痞欺压家业，她挺身守护不退让',           category: 'bonds'   },
    { id: 'li-yunshu-bond-3',            name: '李云舒·月下长谈',     hint: '城墙上的深夜，她说出十五岁那次无法忘却的杀人', category: 'bonds' },
    { id: 'li-yunshu-bond-4',            name: '李云舒·异地之邀',     hint: '秋水剑宗来函相邀三年，她在去留之间两难',   category: 'bonds'   },
    { id: 'li-yunshu-ending',            name: '李云舒·一剑长歌',     hint: '风过时，剑鸣如歌——那是属于两个人的长歌。', category: 'bonds' },
    { id: 'li-yunshu-afterstory',        name: '李云舒·旧案浮现',     hint: '整理她留下的旧物，发现亡母遗信，旧案重见天日', category: 'bonds' },
    { id: 'li-yunshu-afterstory-ending', name: '李云舒·母亲的墓前',   hint: '旧案了结后，二人并肩立于李若兰墓前，无声告别', category: 'bonds' },
    // 羁绊情缘 — 燕赤行
    { id: 'yan-chixing-meet',            name: '燕赤行·刀疤剑客',     hint: '演武场边，疤脸冷面男子直接向你发问',       category: 'bonds'   },
    { id: 'yan-chixing-bond-1',          name: '燕赤行·刀下问剑',     hint: '以剑相试，接受疤脸剑客的考验',             category: 'bonds'   },
    { id: 'yan-chixing-bond-2',          name: '燕赤行·铁幕之夜',     hint: '夜巷遭伏，他左臂负伤，你赶到共击刺客',     category: 'bonds'   },
    { id: 'yan-chixing-bond-3',          name: '燕赤行·疤痕之下',     hint: '河边深夜，他第一次讲述含光门被灭的往事',   category: 'bonds'   },
    { id: 'yan-chixing-bond-4',          name: '燕赤行·旧仇归来',     hint: '仇人季沧海现身城南，多年夙愿终将了结',     category: 'bonds'   },
    { id: 'yan-chixing-ending',          name: '燕赤行·无名同行',     hint: '夜道同行，他走在前半步，暗处的风雪扑来，他侧身为你挡。', category: 'bonds' },
    { id: 'yan-chixing-afterstory',      name: '燕赤行·含光遗灯·归山', hint: '重返含光山废墟，为旧弟兄们寻回刻在墙上的名字', category: 'bonds' },
    { id: 'yan-chixing-afterstory-ending', name: '燕赤行·含光遗灯·立碑', hint: '他跪在亲手刻就的碑前，这是他第一次流泪',   category: 'bonds' },
    // 羁绊情缘 — 苏青
    { id: 'su-qing-meet',                name: '苏青·顺手之事',       hint: '镇口巧遇，她正蹲身为孩子包扎伤口',         category: 'bonds'   },
    { id: 'su-qing-bond-1',              name: '苏青·山道偶遇',       hint: '她为你疗伤，讲述失踪五年、以身试毒的师父', category: 'bonds'   },
    { id: 'su-qing-bond-2',              name: '苏青·青心草',         hint: '悬崖峭壁，她执意为病童采集青心草',         category: 'bonds'   },
    { id: 'su-qing-bond-3',              name: '苏青·别离之药',       hint: '她收拾药箱准备远行寻师，临走留下一瓶解毒药', category: 'bonds' },
    { id: 'su-qing-bond-4',              name: '苏青·师门寻踪',       hint: '师父被扣押于山寨，营救行动迫在眉睫',       category: 'bonds'   },
    { id: 'su-qing-ending',              name: '苏青·针灸传心',       hint: '她背对着门口，肩膀轻轻颤着——她的父亲向你深深弯腰。', category: 'bonds' },
    { id: 'su-qing-afterstory',          name: '苏青·济世堂往事·秘方', hint: '师父透露手中藏有天魔解毒药方——是救人之药，还是终结之剑', category: 'bonds' },
    { id: 'su-qing-afterstory-ending',   name: '苏青·济世堂往事·重开', hint: '重新挂起的招牌下，她站在门口，望着落日',    category: 'bonds'   },
    // 羁绊情缘 — 凌雪
    { id: 'ling-xue-meet',               name: '凌雪·运气不错',       hint: '山道遭袭，白衣剑客凌空三剑救下你',         category: 'bonds'   },
    { id: 'ling-xue-bond-1',             name: '凌雪·雪中之刃',       hint: '茶馆遭袭，与她背靠背并肩击退刺客',         category: 'bonds'   },
    { id: 'ling-xue-bond-2',             name: '凌雪·夜雨论道',       hint: '夜雨中，她首次流露出对「唯强者方能改变」的疑惑', category: 'bonds' },
    { id: 'ling-xue-bond-3',             name: '凌雪·白雪留痕',       hint: '她主动找来，第一次开口指点你练剑',         category: 'bonds'   },
    { id: 'ling-xue-bond-4',             name: '凌雪·刃下真言',       hint: '她以天魔门首席弟子身份来见，随即选择叛出', category: 'bonds'   },
    { id: 'ling-xue-ending',             name: '凌雪·凌霜剑域',       hint: '冻原风雪中，两把剑并肩而立——不需要回头，也知道彼此不会退。', category: 'bonds' },
    { id: 'ling-xue-afterstory',         name: '凌雪·凌霜化雪·追杀',  hint: '天魔门追杀令至，她看了一眼，平静开口：来了', category: 'bonds' },
    { id: 'ling-xue-afterstory-ending',  name: '凌雪·凌霜化雪·自由',  hint: '追杀令碎成漫天白纸，随风而散——从今天起，我只是凌雪', category: 'bonds' },
    // 羁绊情缘 — 神秘老者
    { id: 'mysterious-elder-meet',       name: '神秘老者·月夜现身',    hint: '月黑风高，练功时一位白发老人从黑暗中走来，问：你可知自己肩负着什么？', category: 'bonds' },
    { id: 'mysterious-elder-bond-1',     name: '神秘老者·茶馆问道',    hint: '茶馆一隅，他翻开掌心，星形烙印——那不是普通习武的代价', category: 'bonds' },
    { id: 'mysterious-elder-bond-2',     name: '神秘老者·内功指引',    hint: '他说：武道无捷径，走远了才是本事',            category: 'bonds'   },
    { id: 'mysterious-elder-bond-3',     name: '神秘老者·真名',        hint: '他摊开掌心，星形烙印说出了他的来历',          category: 'bonds'   },
    { id: 'mysterious-elder-bond-4',     name: '神秘老者·天魔本源',    hint: '刺客围困，他手持茶杯坐定，向你讲述弟子变魔的根源', category: 'bonds' },
    { id: 'mysterious-elder-ending',      name: '神秘老者·一线天命',   hint: '黄昏庭院，他摊开掌心——那是毕生修为最后的余温，他说：因为你让我相信，总有人能做到。', category: 'bonds' },
    { id: 'mysterious-elder-afterstory', name: '神秘老者·定渊遗剑·铜簪', hint: '老者取出一枚旧铜簪，讲述消失二十年的微尘',  category: 'bonds' },
    { id: 'mysterious-elder-afterstory-ending', name: '神秘老者·定渊遗剑·重逢', hint: '他颤抖的双手将旧铜簪重新别入女儿发间，二十年的分别就此落幕', category: 'bonds' },
    // 人物立绘 — src overrides default illustrations/ path; alwaysUnlocked skips lock gate
    { id: 'portrait-player',          name: '主角',       hint: '踏入江湖的无名剑客',         category: 'portraits', src: 'assets/characters/player.jpg',          alwaysUnlocked: true },
    { id: 'portrait-wang-tie',         name: '王铁',       hint: '走江湖数十年的老侠客，刀法刚猛，心怀义气。',                           category: 'portraits', src: 'assets/characters/wang-tie.jpg'        },
    { id: 'portrait-li-yunshu',        name: '李云舒',     hint: '性情明烈的年轻女侠，亡母的梅影剑法由她一人传承。',                       category: 'portraits', src: 'assets/characters/li-yunshu.jpg'       },
    { id: 'portrait-yan-chixing',      name: '燕赤行',     hint: '左颊一道深疤，冷眼看江湖，刀光里藏着不轻易示人的过去。',               category: 'portraits', src: 'assets/characters/yan-chixing.jpg'     },
    { id: 'portrait-su-qing',          name: '苏青',       hint: '背着药箱走山路的女医者，眼神温柔，眉间总带着一丝淡淡的忧愁。',         category: 'portraits', src: 'assets/characters/su-qing.jpg'         },
    { id: 'portrait-ling-xue',         name: '凌雪',       hint: '白衣剑客，出手如霜，来历成谜——她从不多说，也从不久留。',               category: 'portraits', src: 'assets/characters/ling-xue.jpg'        },
    { id: 'portrait-mysterious-elder', name: '神秘老者',   hint: '年岁极深却脊背笔直，眼神平静得像早已看见了结局。',                     category: 'portraits', src: 'assets/characters/mysterious-elder.jpg'},
];

const CATEGORY_LABELS = {
    scenes:   '江湖奇遇',
    bosses:   '传说瞬间',
    bonds:    '羁绊情缘',
    portraits: '人物立绘',
    replay:   '剧情回想',
};
const CATEGORY_ORDER = ['scenes', 'bosses', 'bonds', 'portraits', 'replay'];

const Gallery = {
    _activeTab: 'scenes',
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
                const bl = (char && char.bondLevels) || {};
                const cp = (char && char.chainProgress) || {};
                const n = Object.values(bl).reduce((s, v) => s + (Number(v) || 0), 0)
                        + Object.values(cp).filter(v => v === 'done').length;
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
        const bondLevels    = (char && char.bondLevels)    || {};
        const chainProgress = (char && char.chainProgress) || {};
        const chains        = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.chains) || [];

        const CHAPTER = ['一', '二', '三', '四', '五'];
        const ul = document.createElement('ul');
        ul.className = 'gallery-replay-list';

        // ── Bond chapters (NPC order from GALLERY_DATA) ──
        const seenNpcs = new Set();
        const npcOrder = [];
        for (const d of GALLERY_DATA) {
            if (d.category !== 'bonds') continue;
            const m = d.id.match(/^([a-z-]+)-bond-\d+$/);
            if (!m) continue;
            const kebab = m[1];
            if (!seenNpcs.has(kebab)) { seenNpcs.add(kebab); npcOrder.push(kebab); }
        }

        let hasBonds = false;
        for (const kebab of npcOrder) {
            const snakeId = kebab.replace(/-/g, '_');
            const maxLevel = Number(bondLevels[snakeId] || 0);
            if (maxLevel < 1) continue;
            if (!hasBonds) {
                const hdr = document.createElement('li');
                hdr.className = 'gallery-replay-section-header';
                hdr.textContent = '羁绊情缘';
                ul.appendChild(hdr);
                hasBonds = true;
            }
            const portrait = GALLERY_DATA.find(d => d.id === 'portrait-' + kebab);
            const displayName = portrait ? portrait.name : kebab;
            for (let lvl = 1; lvl <= maxLevel; lvl++) {
                const li = document.createElement('li');
                li.textContent = `${displayName} · 第${CHAPTER[lvl - 1] || lvl}章`;
                li.onclick = () => this._openReplay('bond', snakeId, lvl, li.textContent);
                ul.appendChild(li);
            }
        }

        // ── Completed chains ──
        const doneChains = chains.filter(c => chainProgress[c.id] === 'done');
        if (doneChains.length > 0) {
            const hdr = document.createElement('li');
            hdr.className = 'gallery-replay-section-header';
            hdr.textContent = '支线传说';
            ul.appendChild(hdr);
            for (const chain of doneChains) {
                const li = document.createElement('li');
                li.textContent = chain.name;
                li.onclick = () => this._openReplay('chain', chain.id, null, chain.name);
                ul.appendChild(li);
            }
        }

        if (!hasBonds && doneChains.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'gallery-replay-section-header';
            empty.textContent = '暂无可回想的剧情';
            ul.appendChild(empty);
        }

        this._grid.appendChild(ul);
    },

    _openReplay(type, id, level, title) {
        this._grid.style.display = 'none';
        this._replayTitle.textContent = title || '';
        this._replayLog.innerHTML = '';
        this._replayPanel.style.display = 'flex';
        this._runReplay(type, id, level);
    },

    _runReplay(type, id, level) {
        const bonds  = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.bonds)  || {};
        const chains = ((typeof Engine !== 'undefined') && Engine.state && Engine.state.chains) || [];

        let steps = [];
        let completionNarrative = null;

        if (type === 'bond') {
            const levelArr = bonds[id] || [];
            const levelData = levelArr.find(b => b.level === level);
            steps = (levelData && levelData.steps) || [];
        } else {
            const chain = chains.find(c => c.id === id);
            steps = (chain && chain.steps) || [];
            if (chain && chain.completionReward && chain.completionReward.narrative) {
                completionNarrative = chain.completionReward.narrative;
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

            if (step.text) items.push({ text: step.text, cls: 'narrative' });

            const nonCombat = choices.filter(c => !(c.effects && c.effects.combat));
            for (const choice of nonCombat) {
                items.push({ text: choice.text, cls: 'choice' });
                const narr = choice.effects && choice.effects.narrative;
                if (narr) items.push({ text: narr, cls: 'narrative' });
            }
        }

        if (completionNarrative) items.push({ text: completionNarrative, cls: 'narrative' });
        items.push({ text: '── 回想结束 ──', cls: 'sep' });

        // Stream items into log with 300 ms gap
        const log = this._replayLog;
        const stream = (i) => {
            if (i >= items.length) return;
            const { text, cls } = items[i];
            const p = document.createElement('p');
            if (cls === 'choice') {
                p.className = 'log-replay-choice';
            } else if (cls === 'sep') {
                p.style.cssText = 'color:#555;text-align:center;margin:10px 0;';
            }
            p.textContent = text;
            log.appendChild(p);
            log.scrollTop = log.scrollHeight;
            setTimeout(() => stream(i + 1), 300);
        };
        stream(0);
    },

    _closeReplay() {
        this._replayPanel.style.display = 'none';
        this._replayLog.innerHTML = '';
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
        if (vp) vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
    },

    // ── Slot helpers ────────────────────────────────────────────────────────

    _fillSlot(el, idx) {
        if (!el) return;
        if (idx < 0) { el.style.visibility = 'hidden'; return; }
        el.style.visibility = '';
        const id = this._lightboxItems[idx];
        const meta = GALLERY_DATA.find(d => d.id === id) || { name: id, hint: '', category: 'scenes' };
        const hqSrc = meta.src || `assets/illustrations/${id}.jpg`;
        loadProgressiveImg(el.querySelector('.gallery-lb-img'), hqSrc, 'assets/illustrations/placeholder.svg');
        el.querySelector('.gallery-lb-name').textContent = meta.name;
        el.querySelector('.gallery-lb-category').textContent = CATEGORY_LABELS[meta.category] || '';
        el.querySelector('.gallery-lb-hint').textContent = meta.hint;
    },

    _placeSlot(el, x) {
        if (!el) return;
        el.style.transition = 'none';
        el.style.transform = x === 0 ? 'none' : `translate3d(${x}px, 0, 0)`;
    },

    _initSlots() {
        // Assign: content0=left, content1=center, content2=right
        [this._slotLeft, this._slotCenter, this._slotRight] = this._contents;
        this._fillSlot(this._slotCenter, this._lightboxIdx);
        this._placeSlot(this._slotCenter, 0);
        this._initFlanks();
    },

    _initFlanks() {
        const dist = (this._slotCenter && this._slotCenter.offsetWidth) || 500;
        const prevIdx = this._findNextUnlockedFrom(this._lightboxIdx, -1);
        const nextIdx = this._findNextUnlockedFrom(this._lightboxIdx,  1);
        // Assign the two non-center elements to left/right
        const others = this._contents.filter(c => c !== this._slotCenter);
        this._slotLeft  = others[0];
        this._slotRight = others[1];
        this._fillSlot(this._slotLeft,  prevIdx);
        this._fillSlot(this._slotRight, nextIdx);
        this._placeSlot(this._slotLeft,  prevIdx >= 0 ? -dist : -9999);
        this._placeSlot(this._slotRight, nextIdx >= 0 ?  dist :  9999);
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
        this._placeSlot(this._slotCenter, 0);
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
        const dist = exiting.offsetWidth || 500;

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
            this._lightboxIdx = nextIdx;
            this._slotCenter  = entering;
            this._initFlanks();
            this._animating = false;
        }, { once: true });
    },

    // Keep navigateLightbox as alias used by older touch path (no-op now, raw is used)
    navigateLightbox(delta) { this._navigateRaw(delta); },
};

if (typeof module !== 'undefined') module.exports = { Gallery };
