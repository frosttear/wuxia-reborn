# AI Assistant Guidelines

## Commit Message Convention

- Use **English** for commit messages
- Keep Chinese characters only for in-game terms, names, or specific text changes (e.g. 「长生诀」, 「气运之子」)
- Follow conventional commit format: `type: concise description`
- Types: `feat`, `fix`, `balance`, `refine`, `docs`, `test`

Examples:
```
feat: add longevity_art talent (+15% max HP), replace jianghu_wisdom with fortune_child
balance: raise 慧根 unlock threshold to ≥30, 百战余生 kills requirement to ≥5
docs: update PROGRESS + README to v0.9.1
fix: combat return button disabled after battle ends
```

## Code Style

- Pure HTML/CSS/JS project, no frameworks
- Data in JSON files under `data/`
- Game logic split across `js/` modules: character, combat, engine, npc, rebirth, ui
- Tests in `tests/` using Jest (node environment)

## Versioning

Bump the version on every commit that changes code or content. Update version strings in `index.html` (all `?v=X.X.X` cache busters), `sw.js` (`CACHE_NAME`), `README.md` (title line), and `PROGRESS.md` (current version line).

Version bump rules — use judgment:
- **Minor patch** (x.x.**N+1**): bug fixes, UI tweaks, copy changes, small balance adjustments
- **Feature bump** (x.**N+1**.0): new gameplay systems, new content, significant UX changes, refactors that touch multiple files

Never skip version numbers. Each commit = one version increment.

## PROGRESS.md Format

Every version entry must follow this exact format — newest version at the top:

```markdown
### vX.X.X（YYYY-MM-DD）

**Section heading** (only if needed to group multiple related bullets)
- Plain bullet, no [x] checkbox
- Another bullet

---
```

Rules:
- Heading level `###` for versions, `**bold**` for sub-sections within a version
- Plain `-` bullets only — no `- [x]` checkboxes
- Separate each version block with `---`
- Newest version at the top, oldest at the bottom
- `## 🐛 已知问题` section stays at the very bottom

## Illustration Generation

Illustrations are AI-generated via ChatGPT Image 2. Prompts are stored in `scripts/generate-illustrations.mjs` for reference (the script itself targets AI Horde and is no longer actively used for generation).

**When to run:** Whenever new gallery entries are added to `js/gallery.js` (new `id` fields in `GALLERY_DATA`), add matching entries with prompts to the `ILLUSTRATIONS` array in the script, then run it.

```bash
# Generate all missing illustrations (skips existing files automatically)
node scripts/generate-illustrations.mjs

# Regenerate a specific illustration by id
node scripts/generate-illustrations.mjs wang-tie-meet
```

- Output goes to `assets/illustrations/<id>.png`
- The script polls until each job completes — run in background for large batches
- Keep prompt style consistent: wuxia, cinematic, Chinese ink painting aesthetic, anime-inspired semi-realistic, midnight blue robed swordsman as protagonist
- After generation completes, compress before committing (see below)

## Illustration Compression

All illustrations are stored as JPEG. The game code references `assets/illustrations/<id>.jpg`.

**Folder layout (three-tier progressive loading):**
```
assets/illustrations/origins/<id>.png        ← raw PNG source of truth
assets/illustrations/<id>.jpg                ← HQ output (quality 85)
assets/illustrations/low/<id>.jpg            ← LQ output (600px, quality 20)
assets/illustrations/thumbnail/<id>.jpg      ← thumbnail (300px wide, proportional, quality 40, ~5KB)
```

Loading order: thumbnail → low → HQ (LQ and HQ probed simultaneously; fastest wins).

Same three-tier layout applies to character portraits under `assets/characters/`.

**Workflow:** drop the PNG into `origins/`, then compress:

```bash
# Compress all PNGs in origins/ — outputs all three tiers (safe to re-run)
node scripts/optimize-illustrations.mjs

# Compress a single illustration by id (PNG must be in origins/)
node --input-type=module --eval "
import sharp from 'sharp';
import { stat } from 'fs/promises';
const base = 'REPLACE_WITH_ID';
const src = \`assets/illustrations/origins/\${base}.png\`;
await sharp(src).jpeg({ quality: 85, mozjpeg: true }).toFile(\`assets/illustrations/\${base}.jpg\`);
await sharp(src).resize({ width: 600, withoutEnlargement: true }).jpeg({ quality: 20, mozjpeg: true }).toFile(\`assets/illustrations/low/\${base}.jpg\`);
await sharp(src).resize({ width: 300 }).jpeg({ quality: 40, mozjpeg: true }).toFile(\`assets/illustrations/thumbnail/\${base}.jpg\`);
const s = async f => Math.round((await stat(f)).size/1024)+'KB';
console.log(base+': HQ '+await s(\`assets/illustrations/\${base}.jpg\`)+', LQ '+await s(\`assets/illustrations/low/\${base}.jpg\`)+', thumb '+await s(\`assets/illustrations/thumbnail/\${base}.jpg\`));
"
```

- HQ JPEG: quality 85, mozjpeg — typically 50–280 KB
- LQ: 600 px wide, quality 20 — 3–15 KB
- Thumbnail: 300×400 crop (3:4), quality 40 — ~10 KB, shown instantly while LQ/HQ load
- Commit: `origins/<id>.png`, HQ `.jpg`, `low/<id>.jpg`, and `thumbnail/<id>.jpg`

## Workflow

- Always run `npm test` after code changes to verify tests pass
- Update `PROGRESS.md` and `README.md` when features change
- After completing code/content changes, commit automatically (no need to ask). **Never `git push` without explicit instruction from the user.**

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
