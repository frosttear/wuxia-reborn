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

## Workflow

- Always run `npm test` after code changes to verify 145+ tests pass
- Update `PROGRESS.md` and `README.md` when features change
- Update version log section at bottom of `PROGRESS.md`
