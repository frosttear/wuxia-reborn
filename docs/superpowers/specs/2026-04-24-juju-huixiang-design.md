# 剧情回想 (Story Replay) — Design Spec

Date: 2026-04-24

## Overview

A new gallery tab "剧情回想" that lets the player re-read completed bond chapters and chain quests as narrative text, inside the gallery modal. Replaces static illustrations with an interactive story reader. No mechanical data (attributes, affinity, HP) is shown — only story text and greyed choice labels.

---

## Scope

**In scope:**
- New gallery tab "剧情回想"
- Entry list: completed bond chapters (one per NPC per level) + completed chains
- Within-gallery replay sub-view: log-style text area that streams narrative steps
- Combat steps skipped; non-story effects hidden
- Choices displayed as greyed, non-interactive labels
- Back button returns to entry list

**Out of scope:**
- Tracking which choices the player actually made (all choices shown, greyed)
- Replaying random events or boss fights
- Saving replay position / resume

---

## UI Flow

```
Gallery opens → 剧情回想 tab
    → Entry list (bond chapters + chains, completed only)
        → Click entry
            → Entry list hides; replay sub-view appears
                → Separator line: ── 剧情回想：[title] ──
                → Steps stream in at 300 ms intervals
                → Each step: narrative text → greyed choice labels (non-combat only)
                → Closing line: ── 回想结束 ──
            → Back button → returns to entry list
```

---

## Components

### 1. Gallery tab — `js/gallery.js`

**New category `'replay'` added to `CATEGORY_ORDER` and `CATEGORY_LABELS`.**

New method `_renderReplayList()`:
- Read `char.bondLevels` to find completed bond levels per NPC
- Read `char.chainProgress` to find chains where value === `'done'`
- Render a `<ul>` list, grouped: bonds first (in NPC order matching existing gallery data), then chains
- Each `<li>` is a clickable row: NPC name + chapter label (e.g., "王铁 · 第一章") or chain name
- Clicking calls `this._openReplay(type, id, level)`

New method `_openReplay(type, id, level)`:
- Hides the entry list, shows the replay sub-view panel
- Calls `this._runReplay(type, id, level)` to stream text

New method `_runReplay(type, id, level)`:
- Resolves steps array:
  - bonds: `Engine.state.bonds.find(b => b.npcId === id)?.levels[level]?.steps ?? []`
  - chains: `Engine.state.chains.find(c => c.id === id)?.steps ?? []`
- Streams steps into the replay log area:
  - Each step: log `step.text`
  - For each non-combat choice: log choice text as `.replay-choice` span
  - If `choice.effects.narrative` is a non-empty string: log it as story text
  - If chain and has `completionReward.narrative`: log as final line
- Skip logic:
  - Skip entire step if every choice has `effects.combat`
  - For mixed steps: include non-combat choices, drop combat choices silently
- 300 ms delay between each log item via `setTimeout` chain

New method `_closeReplay()`:
- Clears replay log area, hides sub-view, shows entry list again

### 2. Gallery HTML structure — `index.html`

Inside the existing `#galleryModal` (or gallery overlay), add a `#galleryReplayPanel` div alongside the existing grid:

```html
<div id="galleryReplayPanel" class="gallery-replay-panel" style="display:none">
  <button class="gallery-replay-back">← 返回</button>
  <div class="gallery-replay-title"></div>
  <div class="gallery-replay-log"></div>
</div>
```

The existing `#galleryGrid` is hidden when replay panel is shown, and vice versa.

### 3. Styles — `css/styles.css`

```css
/* Entry list in 剧情回想 tab */
.gallery-replay-list { list-style: none; padding: 0; margin: 0; }
.gallery-replay-list li { padding: 10px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.08); }
.gallery-replay-list li:hover { background: rgba(255,255,255,0.06); }
.gallery-replay-section-header { padding: 6px 16px; font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }

/* Replay sub-view */
.gallery-replay-panel { display: flex; flex-direction: column; height: 100%; }
.gallery-replay-back { align-self: flex-start; margin-bottom: 8px; background: none; border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 4px 12px; cursor: pointer; border-radius: 4px; }
.gallery-replay-title { font-size: 0.9em; color: #888; margin-bottom: 12px; text-align: center; }
.gallery-replay-log { flex: 1; overflow-y: auto; font-size: 0.92em; line-height: 1.7; }

/* Greyed choice labels inside replay log */
.log-replay-choice { color: #666; font-style: italic; display: block; padding-left: 1em; }
.log-replay-choice::before { content: "▷ "; }
```

---

## Skip Logic (Detail)

For each step in the steps array:

1. Collect `combatChoices = choices.filter(c => c.effects?.combat)`
2. If `combatChoices.length === choices.length` → skip entire step (pure combat, no story)
3. Otherwise:
   - Log `step.text`
   - For each choice where `!choice.effects?.combat`:
     - Log `choice.text` as `.log-replay-choice`
     - If `choice.effects?.narrative` (non-empty string): log it as story text
4. For chain steps, if `step.onComplete?.narrative` exists: log it

---

## Entry List Data Sources

| Entry type | Unlock condition | Display label |
|---|---|---|
| Bond chapter | `char.bondLevels[npcId] >= level` | `{npcName} · 第{N}章` |
| Chain | `char.chainProgress[chainId] === 'done'` | chain `name` field |

NPC order: same as GALLERY_DATA bond entries (maintains visual consistency).  
Chapter numbers: 1-indexed from level (level 1 = 第一章, level 2 = 第二章, etc.).

---

## What Is NOT Shown During Replay

- `effects.attributes` (stat gains)
- `effects.npcAffinity` (relationship points)
- `effects.hp` (HP changes)
- `effects.flags` (flag changes)
- `effects.combat` steps (skipped)
- `completionReward.attributes`, `completionReward.passives` (rewards)
- Any `UI.addLog` lines that Engine currently shows for mechanical feedback

Only `step.text`, non-combat `choice.text`, `choice.effects.narrative`, and `completionReward.narrative` are displayed.

---

## Files Changed

| File | Change |
|---|---|
| `js/gallery.js` | New tab, entry list, replay sub-view logic |
| `index.html` | `#galleryReplayPanel` HTML inside gallery modal |
| `css/styles.css` | Entry list + replay panel + `.log-replay-choice` styles |
| `js/engine.js` | No changes needed — gallery reads state.bonds/chains directly |
