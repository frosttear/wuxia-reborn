// gallery.js — Illustration gallery with unlock tracking

const GALLERY_DATA = [
    // 江湖奇遇
    { id: 'journey-dawn',            name: '黎明远行',         hint: '踏入江湖，在某段旅途中邂逅',             category: 'scenes'  },
    { id: 'ancient-grotto',          name: '古洞天地',         hint: '偶入一处古洞，感受上古遗迹的气息',       category: 'scenes'  },
    { id: 'winter-seclusion',        name: '寒冬闭关',         hint: '于漫天风雪中独自苦修',                   category: 'scenes'  },
    { id: 'temple-visit',            name: '庙中拜神',         hint: '于古刹中敬香，感悟天地之道',             category: 'scenes'  },
    { id: 'past-life-dream',         name: '前世梦境',         hint: '梦境与现实交织，往世记忆浮现',           category: 'scenes'  },
    // 武道传承
    { id: 'rebirth',                 name: '世界线回溯',       hint: '完成一世旅途，踏入轮回之门',             category: 'martial' },
    { id: 'wuxiang-unlock',          name: '无相剑意',         hint: '完成「无相剑意」任务链',                 category: 'martial' },
    { id: 'mysterious-elder-ending', name: '神秘老者·真相',   hint: '与神秘老者羁绊圆满，揭开设计者之谜',     category: 'martial' },
    // 传说瞬间
    { id: 'sword-soul-win',          name: '斩破剑魂',         hint: '击败千年剑意——剑魂',                   category: 'bosses'  },
    { id: 'sword-soul-lose',         name: '败于剑意',         hint: '在与剑魂的对决中落败',                   category: 'bosses'  },
    { id: 'tianmo-win',              name: '天魔陨落',         hint: '击败天魔，完成二十岁的宿命',             category: 'bosses'  },
    { id: 'tianmo-lose',             name: '魔焰吞噬',         hint: '在天魔降临时力战不敌',                   category: 'bosses'  },
    // 羁绊情缘 — 初遇
    { id: 'wang-tie-meet',           name: '王铁·萍水相逢',   hint: '与王铁初次相识',                         category: 'bonds'   },
    { id: 'li-yunshu-meet',          name: '李云舒·初遇',     hint: '与李云舒初次相遇',                       category: 'bonds'   },
    { id: 'yan-chixing-meet',        name: '燕赤行·结识',     hint: '与燕赤行萍水相逢',                       category: 'bonds'   },
    { id: 'su-qing-meet',            name: '苏青·一面之缘',   hint: '与苏青初次邂逅',                         category: 'bonds'   },
    { id: 'ling-xue-meet',           name: '凌雪·初见',       hint: '与凌雪初次相见',                         category: 'bonds'   },
    // 羁绊情缘 — 第一章
    { id: 'wang-tie-bond-1',         name: '王铁·结义之始',     hint: '与王铁完成第一章羁绊',                 category: 'bonds'   },
    { id: 'li-yunshu-bond-1',        name: '李云舒·情缘初章',   hint: '与李云舒完成第一章羁绊',               category: 'bonds'   },
    { id: 'yan-chixing-bond-1',      name: '燕赤行·侠义第一章', hint: '与燕赤行完成第一章羁绊',               category: 'bonds'   },
    { id: 'su-qing-bond-1',          name: '苏青·剑缘初启',     hint: '与苏青完成第一章羁绊',                 category: 'bonds'   },
    { id: 'ling-xue-bond-1',         name: '凌雪·冰心初融',     hint: '与凌雪完成第一章羁绊',                 category: 'bonds'   },
    // 羁绊情缘 — 第二章
    { id: 'wang-tie-bond-2',         name: '王铁·同甘共苦',     hint: '与王铁完成第二章羁绊',                 category: 'bonds'   },
    { id: 'li-yunshu-bond-2',        name: '李云舒·情深一章',   hint: '与李云舒完成第二章羁绊',               category: 'bonds'   },
    { id: 'yan-chixing-bond-2',      name: '燕赤行·肝胆相照',   hint: '与燕赤行完成第二章羁绊',               category: 'bonds'   },
    { id: 'su-qing-bond-2',          name: '苏青·并肩而行',     hint: '与苏青完成第二章羁绊',                 category: 'bonds'   },
    { id: 'ling-xue-bond-2',         name: '凌雪·雪中相伴',     hint: '与凌雪完成第二章羁绊',                 category: 'bonds'   },
    // 羁绊情缘 — 圆满
    { id: 'wang-tie-ending',         name: '王铁·义薄云天',     hint: '与王铁羁绊圆满',                       category: 'bonds'   },
    { id: 'li-yunshu-ending',        name: '李云舒·情缘终章',   hint: '与李云舒羁绊圆满',                     category: 'bonds'   },
    { id: 'yan-chixing-ending',      name: '燕赤行·侠骨柔情',   hint: '与燕赤行羁绊圆满',                     category: 'bonds'   },
    { id: 'su-qing-ending',          name: '苏青·剑心相知',     hint: '与苏青羁绊圆满',                       category: 'bonds'   },
    { id: 'ling-xue-ending',         name: '凌雪·冰心一诺',     hint: '与凌雪羁绊圆满',                       category: 'bonds'   },
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

        items.forEach((item, i) => {
            const isUnlocked = unlocked.includes(item.id);
            const card = document.createElement('div');
            card.className = 'gallery-card' + (isUnlocked ? '' : ' locked');

            const img = document.createElement('img');
            img.src = `assets/illustrations/${item.id}.png`;
            img.alt = item.name;
            img.loading = 'lazy';

            const label = document.createElement('div');
            label.className = 'gallery-card-label';
            label.textContent = isUnlocked ? item.name : '???';

            card.appendChild(img);

            if (!isUnlocked) {
                const lock = document.createElement('div');
                lock.className = 'gallery-card-lock-icon';
                lock.textContent = '🔒';
                card.appendChild(lock);

                const hint = document.createElement('div');
                hint.className = 'gallery-card-hint';
                hint.textContent = item.hint;
                card.appendChild(hint);

                card.onclick = () => {
                    const wasVisible = card.classList.contains('hint-visible');
                    this._grid.querySelectorAll('.hint-visible').forEach(c => c.classList.remove('hint-visible'));
                    if (!wasVisible) card.classList.add('hint-visible');
                };
            }

            card.appendChild(label);

            if (isUnlocked) {
                card.onclick = () => this.openLightbox(item.id, category);
                // Tilt effect
                card.addEventListener('mousemove', e => {
                    const r = card.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width  - 0.5;
                    const y = (e.clientY - r.top)  / r.height - 0.5;
                    card.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
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
    },

    closeLightbox() {
        if (this._lightbox) this._lightbox.classList.remove('active');
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
        document.getElementById('galleryLbImg').src = `assets/illustrations/${id}.png`;
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
