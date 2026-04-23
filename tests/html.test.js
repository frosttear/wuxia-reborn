// tests/html.test.js - Sanity checks for index.html structure

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

describe('index.html - basic structure', () => {
    test('has valid DOCTYPE and html tag', () => {
        expect(html).toMatch(/^<!DOCTYPE html>/i);
        expect(html).toMatch(/<html\s+lang="zh-CN">/);
        expect(html).toMatch(/<\/html>\s*$/);
    });

    test('has valid meta viewport tag', () => {
        expect(html).toMatch(/<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1\.0[^"]*">/);
    });

    test('has meta charset', () => {
        expect(html).toMatch(/<meta\s+charset="UTF-8">/);
    });

    test('has title', () => {
        expect(html).toMatch(/<title>.+<\/title>/);
    });

    test('has stylesheet link', () => {
        expect(html).toMatch(/<link\s+rel="stylesheet"\s+href="css\/styles\.css/);
    });
});

describe('index.html - required DOM elements', () => {
    const requiredIds = [
        'startScreen', 'gameScreen', 'nameInput', 'startBtn',
        'eventLog', 'choicesPanel', 'nextMonthBtn',
        'visitBtn', 'chainBtn', 'testCombatBtn',
        'combatOverlay', 'combatActions', 'combatReturnBtn',
        'combatLog', 'combatEnemyHpBar', 'combatPlayerHpBar',
        'combatMomentumFill', 'combatSkillReady', 'combatIntentHint',
        'combatResult', 'combatFleeBtn', 'combatQuickBtn',
        'charName', 'charAge', 'charJob', 'hpBar', 'hpText',
        'attributes', 'combatStats', 'jobPanel', 'learnedSkills',
        'relationships', 'talents', 'passives',
        'exportBtn', 'importBtn', 'resetBtn',
    ];

    test.each(requiredIds)('has element with id="%s"', (id) => {
        const regex = new RegExp(`id="${id}"`);
        expect(html).toMatch(regex);
    });

    test('does NOT have autoAdvanceBtn', () => {
        expect(html).not.toMatch(/id="autoAdvanceBtn"/);
    });
});

describe('index.html - script tags', () => {
    const requiredScripts = [
        'js/character.js', 'js/npc.js', 'js/combat.js',
        'js/rebirth.js', 'js/engine.js', 'js/ui.js'
    ];

    test.each(requiredScripts)('loads %s', (src) => {
        expect(html).toContain(src);
    });

    test('scripts are loaded in correct order (character before engine, engine before ui)', () => {
        const charIdx = html.indexOf('js/character.js');
        const engineIdx = html.indexOf('js/engine.js');
        const uiIdx = html.indexOf('js/ui.js');
        expect(charIdx).toBeLessThan(engineIdx);
        expect(engineIdx).toBeLessThan(uiIdx);
    });
});

describe('index.html - no corruption', () => {
    test('head section contains no button elements', () => {
        const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
        expect(headMatch).not.toBeNull();
        const headContent = headMatch[1];
        expect(headContent).not.toMatch(/<button/);
    });

    test('meta viewport tag is on a single line with no embedded HTML', () => {
        const lines = html.split('\n');
        const viewportLine = lines.find(l => l.includes('name="viewport"'));
        expect(viewportLine).toBeDefined();
        expect(viewportLine).not.toMatch(/<button/);
        expect(viewportLine).not.toMatch(/<div/);
    });

    test('no duplicate id attributes', () => {
        const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)];
        const ids = idMatches.map(m => m[1]);
        const seen = new Set();
        const duplicates = [];
        for (const id of ids) {
            if (seen.has(id)) duplicates.push(id);
            seen.add(id);
        }
        expect(duplicates).toEqual([]);
    });
});

describe('index.html - cache busting', () => {
    test('all JS scripts use consistent cache version', () => {
        const jsVersions = [...html.matchAll(/src="js\/\w+\.js\?v=([^"]+)"/g)].map(m => m[1]);
        expect(jsVersions.length).toBeGreaterThanOrEqual(6);
        const unique = [...new Set(jsVersions)];
        expect(unique).toHaveLength(1);
    });

    test('CSS stylesheet uses cache version', () => {
        expect(html).toMatch(/href="css\/styles\.css\?v=[\d.]+"/);
    });
});

describe('index.html - button text', () => {
    test('nextMonthBtn uses emoji prefix style', () => {
        expect(html).toMatch(/id="nextMonthBtn"[^>]*>🚶 出门探险</);
    });

    test('testCombatBtn shows 模拟战斗 not just 模拟', () => {
        expect(html).toMatch(/id="testCombatBtn"[^>]*>⚔ 模拟战斗</);
    });
});
