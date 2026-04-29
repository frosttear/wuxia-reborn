# One-Week Polish Plan: Audio, Illustrations, Events & Talents

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete audio system (BGM + SFX), 5 new illustrations, 10 new events, and 3 new legacy talents to significantly deepen the player experience within one week.

**Architecture:** Audio is handled by a new `js/audio.js` module (`GameAudio`) with no dependencies; it is loaded before `engine.js` so engine and ui can call it freely. New illustrations are generated via the existing `scripts/generate-illustrations.mjs` AI Horde pipeline. New events are pure JSON additions to `data/events.json`. New talents are additions to the `TALENTS` array in `js/rebirth.js` plus small targeted hooks in `js/character.js` and `js/combat.js`.

**Tech Stack:** Vanilla HTML5 Audio API, AI Horde (existing), Jest (existing tests), plain JSON

---

## File Map

| File | Change |
|------|--------|
| `js/audio.js` | **Create** — GameAudio module (BGM + SFX) |
| `index.html` | Modify — add `<script src="js/audio.js">`, mute button, `GameAudio.init()` call |
| `js/engine.js` | Modify — call `GameAudio.playBGM` and `GameAudio.playSFX` at ~8 hook points |
| `js/ui.js` | Modify — call `GameAudio.playSFX('levelup')` and `GameAudio.playSFX('bond')` |
| `js/character.js` | Modify — apply `iron_constitution` talent in `getHPMax()` |
| `js/combat.js` | Modify — apply `wind_step` talent in flee chance init |
| `js/rebirth.js` | Modify — add 3 new TALENTS entries |
| `scripts/generate-illustrations.mjs` | Modify — add 5 new illustration prompts to `ILLUSTRATIONS` array |
| `data/events.json` | Modify — add 10 new events; add 3rd choice to `morning_training` and `body_tempering` |
| `data/chains.json` | Modify — add 2nd choice to `harbinger_1`, `harbinger_3`, `chaos_3`; remove `minAgeYears` from 5 afterstory chains (13 steps) |
| `sw.js` | Modify — extend cache regex to include audio file types |
| `assets/audio/bgm/` | **Create dir** — `explore.ogg`, `combat.ogg` |
| `assets/audio/sfx/` | **Create dir** — `strike.ogg`, `hit.ogg`, `block.ogg`, `levelup.ogg`, `bond.ogg`, `death.ogg`, `rebirth.ogg` |
| `assets/illustrations/` | Add — `journey-dawn.png`, `ancient-grotto.png`, `winter-seclusion.png`, `temple-visit.png`, `past-life-dream.png` |

---

## Task 1: Create the GameAudio Module

**Files:**
- Create: `js/audio.js`

- [ ] **Step 1: Create `js/audio.js`**

```javascript
// audio.js — BGM and SFX manager
// Uses HTML5 Audio. BGM loops; SFX are fire-and-forget clones.
// Falls back silently when autoplay is blocked or files are missing.

const GameAudio = {
    _bgm: null,
    _bgmTrack: null,
    _muted: false,
    _bgmVol: 0.38,
    _sfxVol: 0.62,

    init() {
        const saved = localStorage.getItem('wuxia_audio');
        if (saved) {
            try { this._muted = !!JSON.parse(saved).muted; } catch(e) {}
        }
    },

    // track: 'explore' | 'combat' | null
    playBGM(track) {
        if (track === this._bgmTrack) return;
        this._bgmTrack = track;
        if (this._bgm) { this._bgm.pause(); this._bgm.src = ''; this._bgm = null; }
        if (!track) return;
        const a = new window.Audio(`assets/audio/bgm/${track}.ogg`);
        a.loop = true;
        a.volume = this._muted ? 0 : this._bgmVol;
        this._bgm = a;
        a.play().catch(() => {});
    },

    stopBGM() { this.playBGM(null); },

    // id: filename without extension under assets/audio/sfx/
    playSFX(id) {
        if (this._muted) return;
        const a = new window.Audio(`assets/audio/sfx/${id}.ogg`);
        a.volume = this._sfxVol;
        a.play().catch(() => {});
    },

    toggleMute() {
        this._muted = !this._muted;
        if (this._bgm) this._bgm.volume = this._muted ? 0 : this._bgmVol;
        localStorage.setItem('wuxia_audio', JSON.stringify({ muted: this._muted }));
        return this._muted;
    },

    isMuted() { return this._muted; },
};
```

- [ ] **Step 2: Write tests for audio preference persistence**

In `tests/audio.test.js`:

```javascript
// Mock localStorage
const store = {};
global.localStorage = {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: k => { delete store[k]; },
};
// Mock Audio constructor so no real audio plays
global.window = { Audio: class { play() { return Promise.resolve(); } pause(){} } };

const { GameAudio } = require('../js/audio.js');

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); GameAudio._muted = false; GameAudio._bgm = null; GameAudio._bgmTrack = null; });

test('init reads muted preference from localStorage', () => {
    localStorage.setItem('wuxia_audio', JSON.stringify({ muted: true }));
    GameAudio.init();
    expect(GameAudio.isMuted()).toBe(true);
});

test('init defaults to unmuted when no preference saved', () => {
    GameAudio.init();
    expect(GameAudio.isMuted()).toBe(false);
});

test('toggleMute persists preference to localStorage', () => {
    GameAudio.toggleMute();
    expect(JSON.parse(localStorage.getItem('wuxia_audio')).muted).toBe(true);
    GameAudio.toggleMute();
    expect(JSON.parse(localStorage.getItem('wuxia_audio')).muted).toBe(false);
});

test('toggleMute returns new muted state', () => {
    expect(GameAudio.toggleMute()).toBe(true);
    expect(GameAudio.toggleMute()).toBe(false);
});
```

Then add `module.exports = { GameAudio };` to the bottom of `js/audio.js`.

- [ ] **Step 3: Run test to verify it passes**

```
npx jest tests/audio.test.js
```

Expected: 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat: add GameAudio module with BGM/SFX and mute persistence"
```

---

## Task 2: Acquire Free Audio Assets

**Files:**
- Create: `assets/audio/bgm/explore.ogg`, `assets/audio/bgm/combat.ogg`
- Create: `assets/audio/sfx/strike.ogg`, `sfx/hit.ogg`, `sfx/block.ogg`, `sfx/levelup.ogg`, `sfx/bond.ogg`, `sfx/death.ogg`, `sfx/rebirth.ogg`

**No coding in this step — pure asset acquisition.**

- [ ] **Step 1: Create directories**

```bash
mkdir -p assets/audio/bgm assets/audio/sfx
```

- [ ] **Step 2: Download BGM tracks**

Go to **https://opengameart.org** and search for:
- `"chinese traditional ambient"` — filter by CC0 license → save as `assets/audio/bgm/explore.ogg`
- `"chinese battle music"` or `"wuxia combat"` — filter by CC0 → save as `assets/audio/bgm/combat.ogg`

Alternatively **https://freesound.org** (log in, search CC0):
- Search `"erhu ambient loop"` → explore BGM
- Search `"chinese percussion battle"` → combat BGM

Good fallback: **https://pixabay.com/music/** — no account needed, royalty free. Search `"ancient china"` for explore BGM, `"epic battle"` for combat BGM. Download MP3 then convert to OGG with any free converter (e.g. https://cloudconvert.com).

Target: 1–3 minute loops, OGG format, under 4MB each.

- [ ] **Step 3: Download SFX**

Go to **https://freesound.org** (filter by CC0 for each):

| File | Search term |
|------|-------------|
| `sfx/strike.ogg` | `"sword whoosh"` or `"sword swing"` |
| `sfx/hit.ogg` | `"sword hit impact"` |
| `sfx/block.ogg` | `"metal clang block"` |
| `sfx/levelup.ogg` | `"achievement chime"` or `"level up bell"` |
| `sfx/bond.ogg` | `"soft bell completion"` |
| `sfx/death.ogg` | `"dark thud"` or `"defeat sound"` |
| `sfx/rebirth.ogg` | `"mystical whoosh light"` or `"spiritual chime"` |

Target: under 300KB each. Convert to OGG if downloaded as MP3.

- [ ] **Step 4: Verify files exist**

```bash
ls assets/audio/bgm/ && ls assets/audio/sfx/
```

Expected: `explore.ogg combat.ogg` and 7 SFX files listed.

- [ ] **Step 5: Commit**

```bash
git add assets/audio/
git commit -m "feat: add free CC0 audio assets (BGM + SFX)"
```

---

## Task 3: Add Mute Button and Wire Up Audio Init

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add audio.js script tag before engine.js**

In `index.html`, find the script tags block and add `audio.js` first:

```html
<script src="js/audio.js?v=0.14.0"></script>
<script src="js/character.js?v=0.14.0"></script>
```

(Bump all `?v=` to `0.14.0` while you're here.)

- [ ] **Step 2: Add mute button to the game header**

Find the `<div class="header-controls">` section in `index.html` and add the mute button as the first child:

```html
<div class="header-controls">
    <button id="muteBtn" class="btn-small" onclick="(function(){ const m = GameAudio.toggleMute(); document.getElementById('muteBtn').textContent = m ? '🔇 静音' : '🔊 音效'; })()">🔊 音效</button>
    <button id="exportBtn" ...
```

- [ ] **Step 3: Call GameAudio.init() in the async IIFE**

Find `await Engine.init(); UI.init();` in `index.html` and add audio init:

```javascript
await Engine.init();
UI.init();
GameAudio.init();
// restore mute button label after init
const muteBtn = document.getElementById('muteBtn');
if (muteBtn && GameAudio.isMuted()) muteBtn.textContent = '🔇 静音';
```

- [ ] **Step 4: Verify the mute button appears and toggles without JS errors**

Open the game in browser, click 🔊 音效. It should toggle to 🔇 静音. Check browser console — no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add mute button and GameAudio.init() wiring"
```

---

## Task 4: Update Service Worker to Cache Audio

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Read sw.js to find the cache regex**

The fetch handler has a line like:
```javascript
if (/\.(png|jpg|jpeg|svg|webp)(\?.*)?$/.test(url.pathname)) {
```

- [ ] **Step 2: Extend the regex to include OGG files**

Change that line to:
```javascript
if (/\.(png|jpg|jpeg|svg|webp|ogg|mp3)(\?.*)?$/.test(url.pathname)) {
```

- [ ] **Step 3: Bump the cache name**

```javascript
const CACHE_NAME = 'wuxia-assets-v0.14.0';
```

- [ ] **Step 4: Commit**

```bash
git add sw.js
git commit -m "feat: extend SW cache to include audio files (ogg, mp3)"
```

---

## Task 5: Hook BGM into Game Flow

**Files:**
- Modify: `js/engine.js`

- [ ] **Step 1: Start explore BGM when advancing month**

In `engine.js`, find `advanceMonth()`. At the very top of the function body (before any other logic), add:

```javascript
GameAudio.playBGM('explore');
```

- [ ] **Step 2: Switch to combat BGM when combat starts**

In `startCombat()`, after `UI.showCombatOverlay(this.state);` add:

```javascript
GameAudio.playBGM('combat');
```

- [ ] **Step 3: Return to explore BGM when combat ends**

In `endCombat()`, after `this.state.gamePhase = 'idle';` add:

```javascript
GameAudio.playBGM('explore');
```

- [ ] **Step 4: Stop BGM on death and rebirth**

In `triggerDeath()`, at the start of the function body add:

```javascript
GameAudio.stopBGM();
```

In `_doRebirth()` (or wherever the rebirth screen resolves and new game starts), find where `Engine.startNewGame(...)` is called and add before it:

```javascript
GameAudio.playBGM('explore');
```

- [ ] **Step 5: Run tests to ensure no breakage**

```
npx jest
```

Expected: all 317 tests PASS (audio module doesn't affect existing test logic).

- [ ] **Step 6: Test manually in browser**

- Advance a month → explore BGM starts
- Enter combat → BGM switches to combat track
- Finish combat → BGM switches back to explore
- Die → BGM stops

- [ ] **Step 7: Commit**

```bash
git add js/engine.js
git commit -m "feat: hook BGM transitions into explore/combat/death flow"
```

---

## Task 6: Hook SFX into Combat and Key Events

**Files:**
- Modify: `js/engine.js`, `js/ui.js`

- [ ] **Step 1: SFX for combat actions (engine.js)**

In `handleCombatAction()`, right before `const { combatOver, result } = Combat.processTurn(...)`, add:

```javascript
const sfxMap = { strike: 'strike', defend: 'block', parry: 'block', focus: 'block', flee: 'strike' };
GameAudio.playSFX(sfxMap[action] || 'strike');
```

- [ ] **Step 2: SFX for combat hit (engine.js)**

In `handleCombatAction()`, right after `UI.updateCombatOverlay(this.state);`, add:

```javascript
GameAudio.playSFX('hit');
```

- [ ] **Step 3: SFX for death (engine.js)**

In `triggerDeath()`, after `GameAudio.stopBGM();` (added in Task 5), add:

```javascript
GameAudio.playSFX('death');
```

- [ ] **Step 4: SFX for rebirth (engine.js)**

In `_doRebirth()`, find where `UI.addIllustration('rebirth')` is called and add after it:

```javascript
GameAudio.playSFX('rebirth');
```

- [ ] **Step 5: SFX for level-up / job unlock (engine.js)**

In `_checkAndAutoPromote()`, find where the promotion success log message is added (UI.addLog with '升阶' or '晋升') and add before the addLog call:

```javascript
GameAudio.playSFX('levelup');
```

- [ ] **Step 6: SFX for bond completion (engine.js)**

In `_completeBond()`, at the start of the function body add:

```javascript
GameAudio.playSFX('bond');
```

- [ ] **Step 7: Run tests**

```
npx jest
```

Expected: all tests PASS.

- [ ] **Step 8: Test manually in browser**

- Click 强攻 → hear strike sound
- Take a hit → hear hit sound
- Complete a bond chapter → hear bond chime
- Level up a job → hear level-up sound
- Die → hear death sound

- [ ] **Step 9: Commit**

```bash
git add js/engine.js js/ui.js
git commit -m "feat: add SFX hooks for combat actions, hit, death, levelup, bond, rebirth"
```

---

## Task 7: Add 5 New Illustrations

**Files:**
- Modify: `scripts/generate-illustrations.mjs`
- Modify: `js/engine.js` (5 new `UI.addIllustration` calls)

- [ ] **Step 1: Add 5 new prompts to generate-illustrations.mjs**

Inside the `ILLUSTRATIONS` array, append these 5 entries:

```javascript
  {
    id: "journey-dawn",
    name: "黎明出行",
    prompt: "Serene wuxia travel scene, a lone young Chinese male swordsman in a midnight blue robe walking along a misty mountain path at dawn, the first golden light breaking over distant peaks, pine trees silhouetted against a pale lavender sky, his figure small against the vast landscape conveying freedom and possibility, a simple bundled pack on his back, wide cinematic landscape composition, Chinese ink painting aesthetic with soft gold and blue-grey tones, peaceful contemplative atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "ancient-grotto",
    name: "古洞秘境",
    prompt: "Mysterious wuxia discovery scene, a young Chinese male swordsman in a midnight blue robe standing at the entrance of an ancient cave system, bioluminescent moss and ancient carved sword patterns glowing softly on the stone walls, rays of light filtering through a crack in the ceiling illuminating floating dust motes, the warrior holding a torch looking at carved martial diagrams on the cave walls with awe, wide cinematic composition, Chinese ink painting aesthetic with deep teal and gold tones, mysterious ancient atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "winter-seclusion",
    name: "寒冬闭关",
    prompt: "Intense wuxia cultivation scene, a young Chinese male swordsman in a midnight blue robe sitting in deep meditation in the lotus position in the middle of a heavy snowstorm on a mountain peak, snow falling all around him but melting before it touches him due to inner energy radiating faintly as a warm golden aura, ice forming on nearby rocks while he remains still and focused, predawn darkness pierced only by the inner light of his cultivation, wide cinematic composition, Chinese ink painting aesthetic with cold white and deep blue tones with inner warmth gold, intense solitary atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "temple-visit",
    name: "古庙祈福",
    prompt: "Peaceful wuxia scene, a young Chinese male swordsman in a midnight blue robe standing before a weathered ancient Buddhist temple entrance, incense smoke curling upward in the still air, stone lion guardians on either side of the steps worn smooth by centuries of visitors, golden light filtering through the temple doors onto the stone courtyard, the warrior offering a respectful bow, autumn maple leaves drifting past in red and gold, wide cinematic composition, Chinese ink painting aesthetic with warm amber and red tones, serene and reverent atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
  {
    id: "past-life-dream",
    name: "前世梦回",
    prompt: "Haunting wuxia dreamscape, a young Chinese male swordsman in a midnight blue robe standing in a ghostly battlefield of his past lives, translucent echoes of his former selves visible around him as faint luminous silhouettes in different poses and different clothes from different eras, some victorious some fallen, fragments of memory swirling like luminous petals in a dark void, the warrior looking at his own hands as if seeing the weight of every past life, wide cinematic composition, deep indigo and ghost-white tones with faint gold memory-threads, melancholic and transcendent atmosphere, anime-inspired semi-realistic art, high quality detailed scene"
  },
```

- [ ] **Step 2: Generate all 5 illustrations**

Run these one at a time (each takes 2–5 minutes on AI Horde):

```bash
node scripts/generate-illustrations.mjs journey-dawn
node scripts/generate-illustrations.mjs ancient-grotto
node scripts/generate-illustrations.mjs winter-seclusion
node scripts/generate-illustrations.mjs temple-visit
node scripts/generate-illustrations.mjs past-life-dream
```

If a result looks bad, re-run the same command to regenerate.

- [ ] **Step 3: Verify the images look good**

Open each PNG from `assets/illustrations/` and check quality. Regenerate any that are low quality.

- [ ] **Step 4: Hook illustrations into engine.js events**

Find the event `ancient_grotto` (added in Task 8) trigger path. In `triggerEvent()`, after adding the event log text, add illustration calls for specific event IDs.

The cleanest way: in `triggerEvent()`, find where `UI.addLog(event.text, 'event')` or similar is called and add a conditional illustration right after:

```javascript
// In triggerEvent(), after displaying event text:
const illustrationMap = {
    ancient_grotto: 'ancient-grotto',
    winter_seclusion: 'winter-seclusion',
    temple_offering: 'temple-visit',
    past_life_dream: 'past-life-dream',
};
if (illustrationMap[event.id]) UI.addIllustration(illustrationMap[event.id]);
```

For `journey-dawn`, add it in `advanceMonth()` when a "journey" type event fires — or simply show it 10% of the time when `advanceMonth` is called with no event (rare idle month). Actually, simpler: add it as an illustration in the `rainy_road` event (Task 8) which is a journey event.

Add to `illustrationMap`:
```javascript
rainy_road: 'journey-dawn',
old_swordsman: 'journey-dawn',
```

- [ ] **Step 5: Run tests**

```
npx jest
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-illustrations.mjs assets/illustrations/ js/engine.js
git commit -m "feat: add 5 new illustrations (grotto, winter, temple, journey, past-life)"
```

---

## Task 8: New Events — Batch 1 (5 Events)

**Files:**
- Modify: `data/events.json`

- [ ] **Step 1: Add 5 events to data/events.json**

Open `data/events.json`. It's a JSON array. Append these 5 objects before the final `]`:

```json
  ,
  {
    "id": "ancient_grotto",
    "type": "奇遇",
    "weight": 6,
    "title": "古洞秘境",
    "text": "一次偶然迷路，你发现了隐藏在山壁之后的古老洞穴。洞壁上刻满了密密麻麻的剑法图解，散发着幽幽蓝光。不知是哪位前辈留下的心血，静静等待着有缘人。",
    "conditions": {},
    "choices": [
      {
        "id": "study_diagrams",
        "text": "静心钻研剑法图解，领悟其中真意",
        "effects": { "attributes": { "comprehension": 2, "innerForce": 1 }, "narrative": "你在洞中枯坐三日，终于从那模糊的图解中悟出了一丝剑意的真谛，内力与悟性均有所提升。" }
      },
      {
        "id": "copy_diagrams",
        "text": "将图解誊抄下来，留待日后慢慢研究",
        "effects": { "attributes": { "comprehension": 1 }, "narrative": "你将能看清的图解一一誊抄，虽一时难以完全参透，日后必有所获。悟性小有提升。" }
      },
      {
        "id": "ignore",
        "text": "此地阴气太重，不宜久留，速速离开",
        "effects": { "attributes": { "luck": 1 }, "narrative": "你心生警惕，果断撤出洞穴。出口处，一块石头绊了你一跤，却让你发现了地下埋藏的一枚铜钱，倒是沾了点运气。" }
      }
    ]
  },
  {
    "id": "rainy_road",
    "type": "奇遇",
    "weight": 10,
    "title": "雨中赶路",
    "text": "江湖路险，风雨无常。你在一场突如其来的暴雨中赶路，山路泥泞，衣衫尽湿。远处雷声滚滚，脚下溪流已漫上了路面。",
    "conditions": {},
    "choices": [
      {
        "id": "push_through",
        "text": "顶风冒雨，强行赶路",
        "effects": { "attributes": { "constitution": 2 }, "hp": -8, "narrative": "你咬牙冲进风雨，体力损耗极大，却也在这般磨砺中筋骨更加强健。" }
      },
      {
        "id": "find_shelter",
        "text": "寻找避雨之处，等雨停再走",
        "effects": { "attributes": { "luck": 1 }, "narrative": "你找到一处破庙暂避风雨，与几位同行旅人相谈甚欢，还从他们口中听说了一些江湖消息，运气不坏。" }
      },
      {
        "id": "train_in_rain",
        "text": "借着雨势练功，感悟水的刚柔之道",
        "effects": { "attributes": { "innerForce": 1, "constitution": 1 }, "hp": -5, "narrative": "雨中练功，天地浑然一体。你在淋漓大雨中感悟到了以柔克刚的一丝真意，内力与体质均有小幅提升。" }
      }
    ]
  },
  {
    "id": "old_swordsman",
    "type": "奇遇",
    "weight": 7,
    "title": "路遇剑客",
    "text": "山道之上，你遇见一位须发皆白的老剑客。他盘坐在路边石上，手持一柄锈迹斑斑的旧剑，目光却深邃如渊，仿佛看穿了你的心底。他抬眼看你，缓缓开口：「年轻人，可愿与老夫论剑一番？」",
    "conditions": {},
    "choices": [
      {
        "id": "spar",
        "text": "恭敬行礼，请求赐教",
        "effects": { "attributes": { "comprehension": 2, "reputation": 2 }, "narrative": "老剑客点头微笑，与你切磋半日。他的剑法看似平淡无奇，却蕴含无尽变化。你虽远不及他，却从中领悟到了许多，悟性与声望均大有提升。" }
      },
      {
        "id": "ask_advice",
        "text": "虚心请教江湖经验与处世之道",
        "effects": { "attributes": { "comprehension": 1, "luck": 1 }, "narrative": "老剑客抚须而笑，娓娓道来数十年走江湖的见闻。其中有一句话令你若有所悟——「剑走偏锋，不如以正合，以奇胜。」" }
      },
      {
        "id": "decline_politely",
        "text": "婉言谢绝，继续赶路",
        "effects": { "attributes": { "agility": 1 }, "narrative": "你礼貌推辞后快步离去，倒是这一路越走越快，步伐比往日更加轻盈。" }
      }
    ]
  },
  {
    "id": "night_meditation",
    "type": "磨练",
    "weight": 9,
    "title": "夜间打坐",
    "text": "夜深人静，万籁俱寂。月光如练，洒落庭院。你盘膝而坐，调息凝神，试图在这片刻宁静中沟通天地灵气，淬炼内功。",
    "conditions": {},
    "choices": [
      {
        "id": "deep_meditation",
        "text": "沉入深度冥想，感受丹田气息流转",
        "effects": { "attributes": { "innerForce": 2 }, "narrative": "子时一过，你忽觉体内真气如江河奔涌，周天运转顺畅无比。一夜打坐，内力大进。" }
      },
      {
        "id": "mental_cultivation",
        "text": "以心证道，回想近日见闻，参悟武理",
        "effects": { "attributes": { "comprehension": 1, "innerForce": 1 }, "narrative": "你将近日所见所闻在心中细细回味，从平凡小事中悟出了武道的一丝真谛，悟性与内力均有所长进。" }
      }
    ]
  },
  {
    "id": "cliff_training",
    "type": "磨练",
    "weight": 8,
    "title": "悬崖磨剑",
    "text": "你来到一处千丈悬崖之巅，俯瞰深谷，劲风呼啸。此处地势险要，一步不慎便是万丈深渊。正因如此，才是磨砺意志与剑法的绝佳之地。",
    "conditions": {},
    "choices": [
      {
        "id": "strength_training",
        "text": "手握巨石，对着崖壁反复出拳，以崖风为阻力练力",
        "effects": { "attributes": { "strength": 2 }, "hp": -5, "narrative": "崖风凛冽，阻力极大，你每一拳都要耗费数倍力气。一番苦练下来，力量明显增强，却也肌肉酸痛难当。" }
      },
      {
        "id": "agility_training",
        "text": "在崖边窄道来回飞奔，以险境磨练轻功步法",
        "effects": { "attributes": { "agility": 2 }, "hp": -5, "narrative": "数次险些踏空，每一步都是在鬼门关前打滚。终于，你的步伐渐渐与崖风的节奏融为一体，身法大有进益。" }
      },
      {
        "id": "meditation_at_cliff",
        "text": "面对深渊枯坐，体悟生死之道，凝练精神",
        "effects": { "attributes": { "comprehension": 1, "innerForce": 1 }, "narrative": "望着脚下万丈深渊，你的杂念反而慢慢消散，心如止水。这份对生死的彻悟，让你的内力与悟性同步增长。" }
      }
    ]
  }
```

- [ ] **Step 2: Validate JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('data/events.json','utf8')); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 3: Run tests**

```
npx jest
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add data/events.json
git commit -m "feat: add 5 new events (grotto, rainy road, old swordsman, night meditation, cliff training)"
```

---

## Task 9: New Events — Batch 2 (5 Events)

**Files:**
- Modify: `data/events.json`

- [ ] **Step 1: Add 5 more events to data/events.json**

Append these 5 objects to the array (before the final `]`):

```json
  ,
  {
    "id": "temple_offering",
    "type": "奇遇",
    "weight": 6,
    "title": "古庙祈福",
    "text": "行至一处荒僻古庙，香火虽稀，却自有一股清净气息。庙中老僧见你到来，合十行礼：「施主面相有异，可是久历劫数之人？」你心中一动，不知该如何回答。",
    "conditions": {},
    "choices": [
      {
        "id": "offer_incense",
        "text": "虔诚上香祈福，求得一分庇佑",
        "effects": { "attributes": { "luck": 2 }, "narrative": "你恭恭敬敬上了三炷香，老僧为你诵经片刻后微微一笑：「施主今日善缘，他日必有回响。」运气冥冥中似有提升。" }
      },
      {
        "id": "talk_to_monk",
        "text": "与老僧攀谈，请其为你解惑",
        "effects": { "attributes": { "comprehension": 1, "luck": 1 }, "narrative": "老僧谈吐不凡，数语之间便点破了你修炼中的一处迷障。临别时他送你一粒素色药丸，说是可调和气脉，悟性与运气均有小幅提升。" }
      },
      {
        "id": "donate",
        "text": "慷慨解囊，为庙宇捐出身上的盘缠",
        "effects": { "attributes": { "reputation": 3 }, "narrative": "老僧感激不尽，将你的善举告知了数位路过的香客。不出月余，你乐善好施的名声便在附近传扬开来，声望大涨。" }
      }
    ]
  },
  {
    "id": "winter_seclusion",
    "type": "磨练",
    "weight": 7,
    "title": "寒冬闭关",
    "text": "寒冬腊月，大雪封山。你索性闭关于一处僻静小屋，断绝外缘，专心修炼内功。窗外雪花飘落，屋内真气流转，时光在无声中流逝。",
    "conditions": {},
    "choices": [
      {
        "id": "inner_force_focus",
        "text": "专注运转内功心法，打通奇经八脉",
        "effects": { "attributes": { "innerForce": 3 }, "hp": -5, "narrative": "整整七七四十九天，你以寒气淬炼真气，以冰雪磨砺心境。闭关结束时，内力已非昔日可比。" }
      },
      {
        "id": "balanced_cultivation",
        "text": "内外兼修，轮流练习内功与体术",
        "effects": { "attributes": { "innerForce": 2, "constitution": 1 }, "narrative": "以内功温养体魄，以体术催动内力，两者相辅相成。这个寒冬的苦修，让你内外兼备，大有收获。" }
      }
    ]
  },
  {
    "id": "market_gamble",
    "type": "奇遇",
    "weight": 5,
    "title": "市井赌局",
    "text": "途经一处热闹集市，见一群人围着一张骰子桌喧嚣不已。庄家是个油滑中年汉子，正高声招呼：「诸位有胆的，来押一押！本庄家敢输，就怕您不敢赢！」",
    "conditions": {},
    "choices": [
      {
        "id": "gamble_big",
        "text": "押下重注，赌他一把",
        "effects": { "attributes": { "luck": 2 }, "hp": -5, "narrative": "你财运亨通，一把赢下不少，但输家不服，暗中捅了你一刀后溜走。带伤离场，荷包鼓了，身上却多了道伤。" }
      },
      {
        "id": "observe",
        "text": "在旁观察，寻找其中规律",
        "effects": { "attributes": { "comprehension": 1, "luck": 1 }, "narrative": "你冷眼旁观，逐渐看出骰子的偏重。临走前押了小注，不声不响赢了几文钱。观察所得，远比金银更值钱。" }
      },
      {
        "id": "walk_away",
        "text": "此等赌局，不沾为妙，拂袖而去",
        "effects": { "attributes": { "reputation": 1 }, "narrative": "你昂首离去，恰好被路过的几位侠客看见，纷纷称赞你定力过人，声誉略有提升。" }
      }
    ]
  },
  {
    "id": "past_life_dream",
    "type": "奇遇",
    "weight": 4,
    "title": "前世梦回",
    "text": "入夜，你做了一个奇异的梦。梦中的你站在一片虚空之中，四周皆是自己前世的残影——有人笑，有人哭，有人死战不退，有人含笑而终。那些过去的自己，都在无言地凝视着你。",
    "conditions": { "rebirthCount": 1 },
    "choices": [
      {
        "id": "embrace_memories",
        "text": "向前走去，直面每一段前世的记忆",
        "effects": { "attributes": { "comprehension": 2, "innerForce": 1 }, "narrative": "你伸出手，触碰每一道残影。那些悲欢离合，那些生死际遇，不再是沉重的枷锁，而是化作了更深厚的底蕴。悟性与内力同时增长。" }
      },
      {
        "id": "find_strongest_self",
        "text": "在诸多残影中，寻找最强大的那个自己",
        "effects": { "attributes": { "strength": 1, "agility": 1, "innerForce": 1 }, "narrative": "你找到了那个死战到最后一刻的自己，感受到那份不屈的意志通过梦境传递而来，力量、敏捷、内力均有微幅提升。" }
      }
    ]
  },
  {
    "id": "rescue_stranger",
    "type": "奇遇",
    "weight": 8,
    "title": "救人于难",
    "text": "林间小路，你听见一声呼救。循声望去，一名年轻商人被三名劫匪团团围住，形势危急。劫匪们目露凶光，腰间佩刀，见你出现，其中一人冷笑道：「多管闲事的，一起留下！」",
    "conditions": {},
    "choices": [
      {
        "id": "fight_bandits",
        "text": "拔剑而出，救下被围商人",
        "effects": { "attributes": { "reputation": 3, "strength": 1 }, "hp": -12, "narrative": "你与三名劫匪大战一场，虽身受数处轻伤，终究将其击退。被救商人千恩万谢，此事很快在附近传开，声望大涨，力量也在实战中得到锤炼。" }
      },
      {
        "id": "intimidate",
        "text": "以气势震慑，逼退劫匪",
        "effects": { "attributes": { "reputation": 2 }, "narrative": "你缓缓抽出半截剑，眼神冰冷地扫向劫匪。为首的头目仿佛感受到了你不同寻常的气场，慌忙带人撤走。商人对你感激涕零，声名因此传扬。" }
      },
      {
        "id": "sneak_help",
        "text": "暗中吸引劫匪注意，让商人趁机逃脱",
        "effects": { "attributes": { "agility": 1, "luck": 1 }, "narrative": "你绕到另一侧投石引开劫匪，商人趁乱逃脱。你也悄然撤离，全程如履无人之境，身法更加灵动。" }
      }
    ]
  }
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('data/events.json','utf8')); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 3: Run tests**

```
npx jest
```

Expected: all tests PASS.

- [ ] **Step 4: Apply the rebirthCount condition in engine.js**

The `past_life_dream` event has `"conditions": { "rebirthCount": 1 }`. This means it should only appear when `char.rebirthCount >= 1`. Find the event filtering logic in `engine.js` (in `getAvailableEvents()` or wherever events are filtered) and ensure the `rebirthCount` condition is handled:

```javascript
// In the conditions check, find where conditions are evaluated:
if (conditions.rebirthCount !== undefined && char.rebirthCount < conditions.rebirthCount) return false;
```

If this condition type is not yet supported, add it. If it is already supported by the existing conditions system, skip this step (verify by searching for `conditions.rebirthCount` in engine.js).

- [ ] **Step 5: Commit**

```bash
git add data/events.json js/engine.js
git commit -m "feat: add 5 more new events (temple, winter seclusion, market gamble, past-life dream, rescue)"
```

---

## Task 10: Add 3 New Legacy Talents

**Files:**
- Modify: `js/rebirth.js`
- Modify: `js/character.js` (for `iron_constitution` HP effect)
- Modify: `js/combat.js` (for `wind_step` flee effect)

- [ ] **Step 1: Add 3 new talent entries to TALENTS in rebirth.js**

Find the `TALENTS` array in `js/rebirth.js`. Append these 3 entries to the array (before the closing `]`):

```javascript
    ,
    {
        id: 'iron_constitution',
        name: '金刚体魄',
        desc: '前世体质达巅峰，最大气血额外+15%',
        condition: (char) => char.attributes.constitution >= 20,
    },
    {
        id: 'wind_step',
        name: '疾风步法',
        desc: '前世身法精熟，战斗逃跑成功率+20%',
        condition: (char) => char.attributes.agility >= 22,
    },
    {
        id: 'serendipity',
        name: '天赐奇缘',
        desc: '前世运气超群，江湖奇遇类事件出现概率+25%',
        condition: (char) => char.attributes.luck >= 18,
    },
```

- [ ] **Step 2: Apply `iron_constitution` in character.js**

In `js/character.js`, find `getHPMax(char, job)`. It currently has multipliers for existing talents. Add after the existing talent checks:

```javascript
// iron_constitution: +15% max HP
if ((char.legacyTalents || []).includes('iron_constitution')) {
    base = Math.round(base * 1.15);
}
```

Look at how `tough_body` and `longevity_art` are applied in the same function and follow the same pattern.

- [ ] **Step 3: Apply `wind_step` in combat.js**

In `js/combat.js`, find `initState(char, enemy, job)`. It sets `fleeChance: 0.25`. After that line, add:

```javascript
if ((char.legacyTalents || []).includes('wind_step')) cs.fleeChance += 0.20;
```

- [ ] **Step 4: Apply `serendipity` in engine.js**

In `js/engine.js`, find the event weight calculation in the event pool selection. Find where `event.weight` is used to build the weighted pool and add:

```javascript
// serendipity talent: +25% weight for 奇遇 type events
let w = event.weight;
if (event.type === '奇遇' && (char.legacyTalents || []).includes('serendipity')) {
    w = Math.round(w * 1.25);
}
```

Use `w` instead of `event.weight` when building the pool.

- [ ] **Step 5: Write tests for the 3 new talents**

In `tests/engine.test.js`, add at the end:

```javascript
// --- New talent tests ---
describe('iron_constitution talent', () => {
    test('adds 15% to max HP', () => {
        const char = Character.create('Test', {}, ['iron_constitution']);
        char.attributes.constitution = 20;
        const hpBase = Character.getHPMax(char, null);
        char.legacyTalents = [];
        const hpWithout = Character.getHPMax(char, null);
        expect(hpBase).toBeGreaterThan(hpWithout);
        expect(hpBase).toBeCloseTo(hpWithout * 1.15, 0);
    });
});

describe('wind_step talent', () => {
    test('adds 0.20 to flee chance', () => {
        const char = Character.create('Test', {}, ['wind_step']);
        char.attributes.agility = 22;
        const enemy = { id: 'bandit', name: '山贼', hp: 30, attack: 5, defense: 2, comprehension: 5 };
        const cs = Combat.initState(char, enemy, null);
        expect(cs.fleeChance).toBeCloseTo(0.45, 2);
    });
});
```

- [ ] **Step 6: Run tests**

```
npx jest
```

Expected: all tests PASS (including the 2 new talent tests).

- [ ] **Step 7: Commit**

```bash
git add js/rebirth.js js/character.js js/combat.js tests/engine.test.js
git commit -m "feat: add 3 new legacy talents (iron_constitution, wind_step, serendipity)"
```

---

## Task 11: Polish Chain Tasks and Random Events; Remove Afterstory Age Gates

**Context:**
- Chain quests show under the 📋 任务 button. The first two chains — `tianmo_harbinger` (天魔之兆) and `jianghu_chaos` (江湖乱象) — have steps with only one choice each, making them cutscenes rather than decisions.
- The simplest random events (`morning_training`, `body_tempering`) have only two choices.
- Five "afterstory" chains (NPC bond follow-up stories unlocked at bond L5) gate each step behind `minAgeYears: 19-20` on top of the bond requirement. Players who rushed bonds before that age are left waiting. The age gates should be removed — the bond level requirement is sufficient.

**Afterstory chains affected:** `li_yunshu_afterstory`, `su_qing_afterstory`, `lingxue_afterstory`, `elder_afterstory`, `yan_afterstory` — 13 steps total, all have `minAgeYears` in `unlockConditions`.

**Files:**
- Modify: `data/chains.json`
- Modify: `data/events.json`

- [ ] **Step 1: Remove `minAgeYears` from all afterstory chain steps**

Open `data/chains.json`. For each of the following 5 chains, remove the `"minAgeYears": N` key from every step's `unlockConditions` object. Leave all other conditions (`flags`, `bondLevels`, `minAttributes`) intact.

Chains to edit (search by `id`):
- `li_yunshu_afterstory` — steps: `li_after_1`, `li_after_2`, `li_after_3`
- `su_qing_afterstory` — steps: `su_after_1`, `su_after_2`, `su_after_3`
- `lingxue_afterstory` — steps: `lx_after_1`, `lx_after_2`, `lx_after_3`
- `elder_afterstory` — steps: `elder_after_1`, `elder_after_2`, `elder_after_3`
- `yan_afterstory` — steps: `yan_after_1`, `yan_after_2`, `yan_after_3`

Example — before:
```json
"unlockConditions": {
  "bondLevels": { "li_yunshu": 5 },
  "minAgeYears": 19
}
```
After:
```json
"unlockConditions": {
  "bondLevels": { "li_yunshu": 5 }
}
```

- [ ] **Step 2: Add a 2nd choice to `harbinger_1` (路遇奇人)**

Currently `harbinger_1` has one choice: `investigate`. Add a second choice in `data/chains.json`:

```json
{
  "id": "ignore_old_man",
  "text": "此人神志不清，不予理会，拂袖离去",
  "effects": {
    "attributes": { "luck": 1 },
    "narrative": "你抬步离去，心中却隐隐不安。事后你偶然听路人提起，那老人当晚便气绝于路边，无人收尸。那句「天魔已醒」的话，成了你心头久久无法抹去的阴影。运气冥冥中倒有小涨——或许是侥幸逃过了某种牵连。"
  }
}
```

Note: `harbinger_1`'s `onComplete` still fires regardless of choice (sets `tianmo_sign1: true`), so the chain continues from either choice.

- [ ] **Step 3: Add a 2nd choice to `harbinger_3` (魔影现身)**

Currently `harbinger_3` has one choice: `fight_vanguard`. Add a second choice:

```json
{
  "id": "evade_vanguard",
  "text": "此人气息远在自己之上，立刻借夜色脱身",
  "requirements": {
    "minAttributes": { "agility": 15 }
  },
  "effects": {
    "attributes": { "agility": 2 },
    "narrative": "你压下心跳，借着夜色和对地形的熟悉，三绕两绕甩脱了追杀。黑衣人的声音在夜风中飘来：「跑得了一时……」你深吸一口气——你知道，这不是终点，只是开始。",
    "flags": { "tianmo_vanguard_defeated": true }
  }
}
```

- [ ] **Step 4: Add a 2nd choice to `chaos_3` (幕后元凶)**

Currently `chaos_3` has one choice: `fight_shadow_boss`. Add a second choice:

```json
{
  "id": "expose_shadow_boss",
  "text": "你已掌握足够证据，选择公开揭露而非正面交锋",
  "requirements": {
    "minAttributes": { "reputation": 20 }
  },
  "effects": {
    "attributes": { "reputation": 5, "comprehension": 2 },
    "narrative": "你将搜集的证据公之于众，江湖舆论哗然。幕后黑手在众目睽睽之下无处遁形，最终被江湖正道联手清算。你未动一刀，却赢得了比刀剑更深远的胜利。声望大涨，心智也因此更加成熟。"
  }
}
```

- [ ] **Step 5: Add a 3rd choice to `morning_training` in events.json**

Find the `morning_training` event in `data/events.json`. It currently has two choices (`train_strength`, `train_agility`). Add a third:

```json
{
  "id": "meditate_at_dawn",
  "text": "趁晨曦之宁，盘膝调息，以意导气",
  "effects": {
    "attributes": { "innerForce": 1, "comprehension": 1 },
    "narrative": "晨风拂面，你静心调息，感受天地间那一丝清明之气缓缓流入丹田。内力与悟性均有小幅提升。"
  }
}
```

- [ ] **Step 6: Add a 3rd choice to `body_tempering` in events.json**

Find the `body_tempering` event. It has two choices (`persist`, `moderate`). Add a third:

```json
{
  "id": "seek_guidance",
  "text": "找附近的老武者请教，学习科学训练方法",
  "effects": {
    "attributes": { "constitution": 1, "reputation": 1 },
    "narrative": "老武者指点你训练的节奏与呼吸，几句话让你茅塞顿开。此后的训练事半功倍，体质稳步增长，附近的人也对你刮目相看。"
  }
}
```

- [ ] **Step 7: Validate all JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('data/chains.json','utf8')); console.log('chains.json valid')"
node -e "JSON.parse(require('fs').readFileSync('data/events.json','utf8')); console.log('events.json valid')"
```

Expected: both print `valid`.

- [ ] **Step 8: Verify age condition removal with a quick check**

```bash
node -e "
const chains = JSON.parse(require('fs').readFileSync('data/chains.json','utf8'));
const afterstoryIds = ['li_yunshu_afterstory','su_qing_afterstory','lingxue_afterstory','elder_afterstory','yan_afterstory'];
let found = 0;
for (const chain of chains.chains) {
  if (!afterstoryIds.includes(chain.id)) continue;
  for (const step of chain.steps) {
    if (step.unlockConditions && step.unlockConditions.minAgeYears !== undefined) {
      console.log('STILL HAS AGE:', chain.id, step.id);
      found++;
    }
  }
}
if (found === 0) console.log('All age gates removed correctly.');
"
```

Expected: `All age gates removed correctly.`

- [ ] **Step 9: Run tests**

```
npx jest
```

Expected: all tests PASS.

- [ ] **Step 10: Commit**

```bash
git add data/chains.json data/events.json
git commit -m "polish: expand single-choice chain steps, add event choices, remove afterstory age gates"
```

---

## Task 12: Final Version Bump and Polish Pass

**Files:**
- Modify: `index.html`, `sw.js`, `README.md`, `PROGRESS.md`

- [ ] **Step 1: Bump all version strings to v0.14.0**

In `index.html`, change all `?v=0.13.x` to `?v=0.14.0`.
In `sw.js`, change `CACHE_NAME` to `'wuxia-assets-v0.14.0'`.
In `README.md`, update the title line version.
In `PROGRESS.md`, add a new version block at the top.

- [ ] **Step 2: Update PROGRESS.md**

Add at the top of PROGRESS.md:

```markdown
### v0.14.0（2026-04-2X）

**音频系统**
- 新增 GameAudio 模块（js/audio.js），支持 BGM 循环播放与 SFX 音效，偏好持久化至 localStorage
- 探索时播放悠扬古风 BGM，战斗时切换紧张战斗乐，死亡/胜利时停止
- 7种 SFX 音效：强攻、受击、格挡、升阶、羁绊完成、死亡、转世
- 页眉静音按钮，记忆偏好设置

**新图鉴**
- 新增 5 幅 AI 生成场景插画：黎明出行、古洞秘境、寒冬闭关、古庙祈福、前世梦回

**新事件**
- 新增 10 个事件：古洞秘境、雨中赶路、路遇剑客、夜间打坐、悬崖磨剑、古庙祈福、寒冬闭关、市井赌局、前世梦回、救人于难

**新传承天赋**
- 金刚体魄（体质≥20）：最大气血额外+15%
- 疾风步法（敏捷≥22）：逃跑成功率+20%
- 天赐奇缘（运气≥18）：奇遇类事件权重+25%

---
```

- [ ] **Step 3: Run all tests one final time**

```
npx jest
```

Expected: all tests PASS.

- [ ] **Step 4: Final manual playthrough**

Play through 2 full lives, verifying:
- [ ] BGM plays during exploration, switches on combat start/end
- [ ] SFX fire on correct actions (not all at once, not silent)
- [ ] Mute button works and persists across refresh
- [ ] At least 3 of the 10 new events appear naturally
- [ ] New illustrations display at correct moments
- [ ] New talents appear in the rebirth talent screen (need rebirthCount ≥ 1)

- [ ] **Step 5: Final commit**

```bash
git add index.html sw.js README.md PROGRESS.md
git commit -m "docs: v0.14.0 version bump and PROGRESS update"
```

---

## Self-Review

**Spec coverage:**
- ✅ Sound/music system — Tasks 1–6
- ✅ New illustrations — Task 7
- ✅ New events (10 total) — Tasks 8–9
- ✅ New legacy talents (3) — Task 10
- ✅ Polish single-choice chain steps (harbinger_1, harbinger_3, chaos_3) — Task 11
- ✅ Expand simple random events (morning_training, body_tempering) — Task 11
- ✅ Remove afterstory age gates (5 chains × 3 steps) — Task 11

**Placeholder scan:** No TBDs. All JSON is complete. All code is complete. Asset acquisition (Task 2) gives specific search terms and sites rather than specific filenames because file availability on third-party sites changes — this is the only "manual" step.

**Type consistency:** `GameAudio` is used consistently throughout. `iron_constitution`, `wind_step`, `serendipity` talent IDs are consistent between rebirth.js (definition), character.js/combat.js/engine.js (application), and tests. Event IDs `ancient_grotto`, `rainy_road`, `old_swordsman`, `night_meditation`, `cliff_training`, `temple_offering`, `winter_seclusion`, `market_gamble`, `past_life_dream`, `rescue_stranger` are consistent between events.json and the illustration map in engine.js.

**Estimated time:** ~18–20 hours total. Asset acquisition (Task 2) is the only uncontrollable variable — budget 1–3 hours depending on how easily you find good CC0 tracks. Task 11 (chain/event polish) adds ~2 hours of JSON authoring.
