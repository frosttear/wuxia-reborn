// gallery.js — Illustration gallery with unlock tracking

const GALLERY_DATA = [
    // 江湖奇遇
    { id: 'journey-dawn',                 name: '黎明远行',             hint: '踏入江湖，在某段旅途中邂逅',               category: 'scenes'  },
    { id: 'ancient-grotto',               name: '古洞天地',             hint: '偶入一处古洞，感受上古遗迹的气息',         category: 'scenes'  },
    { id: 'winter-seclusion',             name: '寒冬闭关',             hint: '于漫天风雪中独自苦修',                     category: 'scenes'  },
    { id: 'temple-visit',                 name: '庙中拜神',             hint: '于古刹中敬香，感悟天地之道',               category: 'scenes'  },
    { id: 'past-life-dream',              name: '前世梦境',             hint: '梦境与现实交织，往世记忆浮现',             category: 'scenes'  },
    // 武道传承
    { id: 'rebirth',                      name: '世界线回溯',           hint: '完成一世旅途，踏入轮回之门',               category: 'martial' },
    { id: 'wuxiang-unlock',               name: '无相剑意',             hint: '完成「无相剑意」任务链',                   category: 'martial' },
    { id: 'mysterious-elder-ending',      name: '神秘老者·真相',       hint: '与神秘老者羁绊圆满，揭开设计者之谜',       category: 'martial' },
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
    { id: 'wang-tie-ending',             name: '王铁·最后的镖路',     hint: '与王铁羁绊圆满',                           category: 'bonds'   },
    // 羁绊情缘 — 李云舒
    { id: 'li-yunshu-meet',              name: '李云舒·城外巧遇',     hint: '城外路上，她被流氓骚扰却毫无惧色',         category: 'bonds'   },
    { id: 'li-yunshu-bond-1',            name: '李云舒·梅园问剑',     hint: '梅园对剑，她演示亡母梅影剑的传承剑法',     category: 'bonds'   },
    { id: 'li-yunshu-bond-2',            name: '李云舒·护家立剑',     hint: '地痞欺压家业，她挺身守护不退让',           category: 'bonds'   },
    { id: 'li-yunshu-bond-3',            name: '李云舒·月下长谈',     hint: '城墙上的深夜，她说出十五岁那次无法忘却的杀人', category: 'bonds' },
    { id: 'li-yunshu-bond-4',            name: '李云舒·异地之邀',     hint: '秋水剑宗来函相邀三年，她在去留之间两难',   category: 'bonds'   },
    { id: 'li-yunshu-ending',            name: '李云舒·一剑长歌',     hint: '与李云舒羁绊圆满',                         category: 'bonds'   },
    { id: 'li-yunshu-afterstory',        name: '李云舒·旧案浮现',     hint: '整理她留下的旧物，发现亡母遗信，旧案重见天日', category: 'bonds' },
    // 羁绊情缘 — 燕赤行
    { id: 'yan-chixing-meet',            name: '燕赤行·刀疤剑客',     hint: '演武场边，疤脸冷面男子直接向你发问',       category: 'bonds'   },
    { id: 'yan-chixing-bond-1',          name: '燕赤行·刀下问剑',     hint: '以剑相试，接受疤脸剑客的考验',             category: 'bonds'   },
    { id: 'yan-chixing-bond-2',          name: '燕赤行·铁幕之夜',     hint: '夜巷遭伏，他左臂负伤，你赶到共击刺客',     category: 'bonds'   },
    { id: 'yan-chixing-bond-3',          name: '燕赤行·疤痕之下',     hint: '河边深夜，他第一次讲述含光门被灭的往事',   category: 'bonds'   },
    { id: 'yan-chixing-bond-4',          name: '燕赤行·旧仇归来',     hint: '仇人季沧海现身城南，多年夙愿终将了结',     category: 'bonds'   },
    { id: 'yan-chixing-ending',          name: '燕赤行·无名同行',     hint: '与燕赤行羁绊圆满',                         category: 'bonds'   },
    { id: 'yan-chixing-afterstory',      name: '燕赤行·山上的名字',   hint: '重返含光山废墟，为旧弟兄们寻回刻在墙上的名字', category: 'bonds' },
    // 羁绊情缘 — 苏青
    { id: 'su-qing-meet',                name: '苏青·顺手之事',       hint: '镇口巧遇，她正蹲身为孩子包扎伤口',         category: 'bonds'   },
    { id: 'su-qing-bond-1',              name: '苏青·山道偶遇',       hint: '她为你疗伤，讲述失踪五年、以身试毒的师父', category: 'bonds'   },
    { id: 'su-qing-bond-2',              name: '苏青·青心草',         hint: '悬崖峭壁，她执意为病童采集青心草',         category: 'bonds'   },
    { id: 'su-qing-bond-3',              name: '苏青·别离之药',       hint: '她收拾药箱准备远行寻师，临走留下一瓶解毒药', category: 'bonds' },
    { id: 'su-qing-bond-4',              name: '苏青·师门寻踪',       hint: '师父被扣押于山寨，营救行动迫在眉睫',       category: 'bonds'   },
    { id: 'su-qing-ending',              name: '苏青·针灸传心',       hint: '与苏青羁绊圆满',                           category: 'bonds'   },
    { id: 'su-qing-afterstory',          name: '苏青·师父的秘密',     hint: '师父透露当年被扣押之谜——手中藏有天魔解毒药方', category: 'bonds' },
    // 羁绊情缘 — 凌雪
    { id: 'ling-xue-meet',               name: '凌雪·运气不错',       hint: '山道遭袭，白衣剑客凌空三剑救下你',         category: 'bonds'   },
    { id: 'ling-xue-bond-1',             name: '凌雪·雪中之刃',       hint: '茶馆遭袭，与她背靠背并肩击退刺客',         category: 'bonds'   },
    { id: 'ling-xue-bond-2',             name: '凌雪·夜雨论道',       hint: '夜雨中，她首次流露出对「唯强者方能改变」的疑惑', category: 'bonds' },
    { id: 'ling-xue-bond-3',             name: '凌雪·白雪留痕',       hint: '她主动找来，第一次开口指点你练剑',         category: 'bonds'   },
    { id: 'ling-xue-bond-4',             name: '凌雪·刃下真言',       hint: '她以天魔门首席弟子身份来见，随即选择叛出', category: 'bonds'   },
    { id: 'ling-xue-ending',             name: '凌雪·凌霜剑域',       hint: '与凌雪羁绊圆满',                           category: 'bonds'   },
    { id: 'ling-xue-afterstory',         name: '凌雪·追杀令',         hint: '天魔门追杀令至，她看了一眼，平静开口：来了', category: 'bonds' },
    // 羁绊情缘 — 神秘老者
    { id: 'mysterious-elder-afterstory', name: '神秘老者·微尘之踪',   hint: '老者取出一枚旧铜簪，讲述消失二十年的微尘',   category: 'bonds' },
];

const CATEGORY_LABELS = {
    scenes:  '江湖奇遇',
    martial: '武道传承',
    bosses:  '传说瞬间',
    bonds:   '羁绊情缘',
};
const CATEGORY_ORDER = ['scenes', 'martial', 'bosses', 'bonds'];

const Gallery = {
    _activeTab: 'scenes',
    _lightboxItems: [],
    _lightboxIdx: 0,
    _overlay: null,
    _lightbox: null,
    _grid: null,
    _tabsEl: null,

    init() {
        this._overlay  = document.getElementById('galleryOverlay');
        this._lightbox = document.getElementById('galleryLightbox');
        this._grid     = document.getElementById('galleryGrid');
        this._tabsEl   = document.getElementById('galleryTabs');
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (this._lightbox && this._lightbox.classList.contains('active')) { this.closeLightbox(); return; }
                if (this._overlay  && this._overlay.classList.contains('active'))  this.close();
            }
            if (this._lightbox && this._lightbox.classList.contains('active')) {
                if (e.key === 'ArrowLeft')  this.navigateLightbox(-1);
                if (e.key === 'ArrowRight') this.navigateLightbox(1);
            }
        });

        let _touchStartX = 0;
        let _swiping = false;
        const lbContent = this._lightbox.querySelector('.gallery-lb-content');

        const _cancelSwipe = () => {
            if (!_swiping) return;
            _swiping = false;
            if (lbContent) { lbContent.style.transition = 'transform 0.15s ease'; lbContent.style.transform = ''; }
        };

        this._lightbox.addEventListener('touchstart', e => {
            if (e.touches.length > 1) { _cancelSwipe(); return; }
            _touchStartX = e.touches[0].clientX;
            _swiping = true;
            if (lbContent) lbContent.style.transition = 'none';
        }, { passive: true });

        this._lightbox.addEventListener('touchmove', e => {
            if (!_swiping || !lbContent || !this._lightbox.classList.contains('active')) return;
            if (e.touches.length > 1) { _cancelSwipe(); return; }
            const dx = e.touches[0].clientX - _touchStartX;
            lbContent.style.transform = `translateX(${dx}px)`;
        }, { passive: true });

        this._lightbox.addEventListener('touchend', e => {
            if (!_swiping || !this._lightbox.classList.contains('active')) return;
            _swiping = false;
            const dx = e.changedTouches[0].clientX - _touchStartX;
            if (Math.abs(dx) > 50) {
                const goNext = dx < 0;
                const exitX = goNext ? -window.innerWidth : window.innerWidth;
                if (lbContent) {
                    lbContent.style.transition = 'transform 0.22s ease';
                    lbContent.style.transform = `translateX(${exitX}px)`;
                }
                setTimeout(() => {
                    this.navigateLightbox(goNext ? 1 : -1);
                    if (lbContent) {
                        lbContent.style.transition = 'none';
                        lbContent.style.transform = `translateX(${-exitX}px)`;
                        requestAnimationFrame(() => requestAnimationFrame(() => {
                            lbContent.style.transition = 'transform 0.22s ease';
                            lbContent.style.transform = '';
                        }));
                    }
                }, 220);
            } else {
                if (lbContent) {
                    lbContent.style.transition = 'transform 0.22s ease';
                    lbContent.style.transform = '';
                }
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
            const unlockedCount = items.filter(d => unlocked.includes(d.id)).length;
            const btn = document.createElement('button');
            btn.className = 'gallery-tab' + (cat === this._activeTab ? ' active' : '');
            btn.dataset.cat = cat;
            btn.innerHTML = CATEGORY_LABELS[cat] +
                `<span class="gallery-tab-badge">${unlockedCount}/${items.length}</span>`;
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
        this._renderGrid(category);
    },

    _renderGrid(category) {
        const unlocked = this._getUnlocked();
        const items = GALLERY_DATA.filter(d => d.category === category);
        this._grid.innerHTML = '';
        this._grid.classList.remove('has-pinned');

        items.forEach((item, i) => {
            const isUnlocked = unlocked.includes(item.id);
            const card = document.createElement('div');
            card.className = 'gallery-card' + (isUnlocked ? '' : ' locked');

            // Inner element receives tilt transform so the card's grid boundary never moves
            const inner = document.createElement('div');
            inner.className = 'gallery-card-inner';

            const img = document.createElement('img');
            img.alt = item.name;
            loadProgressiveImg(img, `assets/illustrations/${item.id}.jpg`, 'assets/illustrations/placeholder.svg');
            inner.appendChild(img);

            if (!isUnlocked) {
                const lock = document.createElement('div');
                lock.className = 'gallery-card-lock-icon';
                lock.textContent = '🔒';
                inner.appendChild(lock);

                const hint = document.createElement('div');
                hint.className = 'gallery-card-hint';
                hint.textContent = item.hint;
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

    openLightbox(id, category) {
        const cat = category || this._activeTab;
        const unlocked = this._getUnlocked();
        this._lightboxItems = GALLERY_DATA
            .filter(d => d.category === cat && unlocked.includes(d.id))
            .map(d => d.id);
        this._lightboxIdx = this._lightboxItems.indexOf(id);
        if (this._lightboxIdx < 0) this._lightboxIdx = 0;
        this._renderLightbox();
        this._lightbox.classList.add('active');
        // Allow pinch-zoom inside lightbox (some browsers respect maximum-scale)
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
    },

    closeLightbox() {
        if (this._lightbox) this._lightbox.classList.remove('active');
        // Snap viewport zoom back to 1.0 by constraining maximum-scale
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
    },

    navigateLightbox(delta) {
        const next = this._lightboxIdx + delta;
        if (next < 0 || next >= this._lightboxItems.length) return;
        this._lightboxIdx = next;
        this._renderLightbox();
    },

    _renderLightbox() {
        const id = this._lightboxItems[this._lightboxIdx];
        const meta = GALLERY_DATA.find(d => d.id === id) || { name: id, hint: '', category: 'scenes' };
        const lbImg = document.getElementById('galleryLbImg');
        loadProgressiveImg(lbImg, `assets/illustrations/${id}.jpg`, 'assets/illustrations/placeholder.svg');
        document.getElementById('galleryLbName').textContent = meta.name;
        document.getElementById('galleryLbCategory').textContent = CATEGORY_LABELS[meta.category] || '';
        document.getElementById('galleryLbHint').textContent = meta.hint;

        const prev = document.getElementById('galleryLbPrev');
        const next = document.getElementById('galleryLbNext');
        if (prev) prev.disabled = this._lightboxIdx === 0;
        if (next) next.disabled = this._lightboxIdx === this._lightboxItems.length - 1;
    },
};

if (typeof module !== 'undefined') module.exports = { Gallery };
