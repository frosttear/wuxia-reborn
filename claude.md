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
