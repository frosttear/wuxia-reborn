# 剧情回想 (Story Replay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "剧情回想" gallery tab that lets the player replay completed bond chapters and chain quests as streaming narrative text inside the gallery modal, skipping combat and mechanical bonuses.

**Architecture:** New `'replay'` tab added to `CATEGORY_ORDER`/`CATEGORY_LABELS`. `switchTab()` branches to `_renderReplayList()` for this category (shows entry list in `#galleryGrid`). Clicking an entry hides the grid and shows `#galleryReplayPanel`; `_runReplay()` streams steps with 300 ms delays. Back button calls `_closeReplay()` which restores the entry list.

**Tech Stack:** Vanilla JS, CSS, HTML — no new dependencies. Data from `Engine.state.bonds` (object keyed by snake_case npcId) and `Engine.state.chains` (array of chain objects).

---

## File Map

| File | What changes |
|---|---|
| `css/styles.css` | Add 7 new CSS rules for replay list and panel |
| `index.html` | Add `#galleryReplayPanel` div inside `.gallery-box` |
| `js/gallery.js` | Add `'replay'` to constants; modify `init`, `_buildTabs`, `switchTab`; add 4 new methods |

---

### Task 1: CSS — Add replay panel styles

**Files:**
- Modify: `css/styles.css` (append near the end of the gallery section)

- [ ] **Step 1: Find the insertion point**

Open `css/styles.css` and search for `.gallery-close-btn` or `.gallery-tab-badge` to locate the gallery CSS block. Append the following block after the existing gallery rules:

```css
/* ── 剧情回想 tab ── */
.gallery-replay-list { list-style: none; padding: 0; margin: 0; }
.gallery-replay-list li { padding: 10px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.08); color: #ccc; transition: background 0.15s; }
.gallery-replay-list li:hover { background: rgba(255,255,255,0.06); }
.gallery-replay-section-header { padding: 6px 16px; font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 0.1em; cursor: default !important; }
.gallery-replay-section-header:hover { background: none !important; }

/* Replay sub-view panel */
.gallery-replay-panel { display: none; flex-direction: column; padding: 12px 16px; height: 100%; box-sizing: border-box; }
.gallery-replay-back { align-self: flex-start; margin-bottom: 10px; background: none; border: 1px solid rgba(255,255,255,0.2); color: #aaa; padding: 4px 14px; cursor: pointer; border-radius: 4px; font-size: 0.88em; }
.gallery-replay-back:hover { border-color: rgba(255,255,255,0.5); color: #fff; }
.gallery-replay-title { font-size: 0.85em; color: #888; margin-bottom: 10px; text-align: center; letter-spacing: 0.05em; }
.gallery-replay-log { flex: 1; overflow-y: auto; font-size: 0.92em; line-height: 1.8; }
.gallery-replay-log p { margin: 6px 0; color: #ccc; }
.log-replay-choice { color: #555 !important; font-style: italic; padding-left: 1em; }
.log-replay-choice::before { content: "▷ "; }
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all 344 tests pass (CSS changes don't affect tests).

---

### Task 2: HTML — Add replay panel element

**Files:**
- Modify: `index.html` around line 302 (the `#galleryGrid` div)

- [ ] **Step 1: Find the insertion point**

In `index.html`, locate this block (around line 299–303):

```html
        <div class="gallery-header">
            <span class="gallery-title">图　鉴</span>
            <div class="gallery-tabs" id="galleryTabs"></div>
            <button class="gallery-close-btn" onclick="Gallery.close()">✕</button>
        </div>
        <div class="gallery-grid" id="galleryGrid"></div>
```

- [ ] **Step 2: Add the replay panel div after `#galleryGrid`**

Replace the closing `</div>` of `.gallery-box` section so it reads:

```html
        <div class="gallery-header">
            <span class="gallery-title">图　鉴</span>
            <div class="gallery-tabs" id="galleryTabs"></div>
            <button class="gallery-close-btn" onclick="Gallery.close()">✕</button>
        </div>
        <div class="gallery-grid" id="galleryGrid"></div>
        <div class="gallery-replay-panel" id="galleryReplayPanel">
            <button class="gallery-replay-back" id="galleryReplayBack">← 返回</button>
            <div class="gallery-replay-title" id="galleryReplayTitle"></div>
            <div class="gallery-replay-log" id="galleryReplayLog"></div>
        </div>
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all 344 tests pass.

---

### Task 3: gallery.js — Constants, init, _buildTabs, switchTab

**Files:**
- Modify: `js/gallery.js`

- [ ] **Step 1: Add `'replay'` to CATEGORY_ORDER (line 89)**

Find:
```javascript
const CATEGORY_ORDER = ['scenes', 'bosses', 'bonds', 'portraits'];
```

Replace with:
```javascript
const CATEGORY_ORDER = ['scenes', 'bosses', 'bonds', 'portraits', 'replay'];
```

- [ ] **Step 2: Add `replay` label to CATEGORY_LABELS (lines 83–88)**

Find:
```javascript
const CATEGORY_LABELS = {
    scenes:   '江湖奇遇',
    bosses:   '传说瞬间',
    bonds:    '羁绊情缘',
    portraits: '人物立绘',
};
```

Replace with:
```javascript
const CATEGORY_LABELS = {
    scenes:   '江湖奇遇',
    bosses:   '传说瞬间',
    bonds:    '羁绊情缘',
    portraits: '人物立绘',
    replay:   '剧情回想',
};
```

- [ ] **Step 3: Cache `_replayPanel`, `_replayTitle`, `_replayLog` in `init()` (around line 109)**

Find these lines inside `init()`:
```javascript
        this._contents[0] = document.getElementById('galleryLbContent0');
        this._contents[1] = document.getElementById('galleryLbContent1');
        this._contents[2] = document.getElementById('galleryLbContent2');
```

Insert immediately before them:
```javascript
        this._replayPanel = document.getElementById('galleryReplayPanel');
        this._replayTitle = document.getElementById('galleryReplayTitle');
        this._replayLog   = document.getElementById('galleryReplayLog');
        document.getElementById('galleryReplayBack').onclick = () => this._closeReplay();
```

- [ ] **Step 4: Update `_buildTabs()` to handle replay tab badge**

Find this block inside `_buildTabs()`:
```javascript
        btn.innerHTML = CATEGORY_LABELS[cat] +
            `<span class="gallery-tab-badge">${unlockedCount}/${items.length}</span>`;
```

Replace with:
```javascript
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
```

- [ ] **Step 5: Update `switchTab()` to branch for replay**

Find:
```javascript
    switchTab(category) {
        this._activeTab = category;
        for (const btn of this._tabsEl.querySelectorAll('.gallery-tab')) {
            btn.classList.toggle('active', btn.dataset.cat === category);
        }
        this._renderGrid(category);
    },
```

Replace with:
```javascript
    switchTab(category) {
        this._activeTab = category;
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
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: all 344 tests pass.

---

### Task 4: gallery.js — _renderReplayList

**Files:**
- Modify: `js/gallery.js` (add method to the Gallery object, after `_renderGrid`)

- [ ] **Step 1: Add `_renderReplayList()` method**

Locate the closing brace of `_renderGrid(category) { ... },` and add the following method immediately after it:

```javascript
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
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all 344 tests pass.

---

### Task 5: gallery.js — _openReplay, _runReplay, _closeReplay

**Files:**
- Modify: `js/gallery.js` (add three methods after `_renderReplayList`)

- [ ] **Step 1: Add `_openReplay()`, `_runReplay()`, `_closeReplay()` methods**

Immediately after `_renderReplayList() { ... },` add:

```javascript
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
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all 344 tests pass.

---

### Task 6: Version bump and commit

**Files:**
- Modify: `sw.js`, `index.html` (all `?v=` query strings), `README.md`, `PROGRESS.md`

- [ ] **Step 1: Bump version**

Current version is `0.21.69`. New version: `0.21.70`.

Update all occurrences (use sed or find-replace):
- `sw.js` line 3: `const CACHE_NAME = 'wuxia-v0.21.70';`
- `index.html`: all `?v=0.21.69` → `?v=0.21.70` (9 occurrences)
- `README.md` line 1: `# 轮回江湖（开发中）v0.21.70`
- `PROGRESS.md` line 3: `## 当前版本：v0.21.70`

- [ ] **Step 2: Add PROGRESS.md entry** (newest at top, after the `## 当前版本` line)

```markdown
### v0.21.70（2026-04-24）

**新增：剧情回想**
- 图鉴新增"剧情回想"标签页，列出所有已完成的羁绊章节与支线任务
- 点击条目在图鉴内以流式文字回放剧情，300ms 间隔逐条显示
- 跳过纯战斗步骤，仅展示叙事文本与灰色选项标签，不显示属性奖励

---
```

- [ ] **Step 3: Run final tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add css/styles.css index.html js/gallery.js sw.js README.md PROGRESS.md
git commit -m "feat: add 剧情回想 gallery tab for story replay of bonds and chains"
```
