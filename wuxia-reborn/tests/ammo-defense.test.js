// tests/ammo-defense.test.js - Tests for the 弹药防线 (Ammo Defense) mini-game
// Covers HTML structure, JS syntax, constants, state shape, and wave generation

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MYPAGES = path.join(__dirname, '..', '..', 'MyPages');
const html = fs.readFileSync(path.join(MYPAGES, 'ammo-defense.html'), 'utf-8');
const coreJs = fs.readFileSync(path.join(MYPAGES, 'ammo-defense', 'core.js'), 'utf-8');
const systemsJs = fs.readFileSync(path.join(MYPAGES, 'ammo-defense', 'systems.js'), 'utf-8');
const renderJs = fs.readFileSync(path.join(MYPAGES, 'ammo-defense', 'render.js'), 'utf-8');
const gameJs = fs.readFileSync(path.join(MYPAGES, 'ammo-defense', 'game.js'), 'utf-8');
const stylesCSS = fs.readFileSync(path.join(MYPAGES, 'ammo-defense', 'styles.css'), 'utf-8');
const bgJs = fs.readFileSync(path.join(MYPAGES, 'ammo-defense', 'background.js'), 'utf-8');

// ── HTML structure tests ─────────────────────────────────────────────────

describe('ammo-defense.html - basic structure', () => {
    test('has valid DOCTYPE and html tag', () => {
        expect(html).toMatch(/^<!DOCTYPE html>/i);
        expect(html).toMatch(/<html\s+lang="zh-CN">/);
        expect(html).toMatch(/<\/html>\s*$/);
    });

    test('has meta charset and viewport', () => {
        expect(html).toMatch(/<meta\s+charset="UTF-8">/);
        expect(html).toMatch(/<meta\s+name="viewport"/);
    });

    test('has title 弹药防线', () => {
        expect(html).toMatch(/<title>弹药防线<\/title>/);
    });

    test('loads stylesheet', () => {
        expect(html).toMatch(/<link\s+rel="stylesheet"\s+href="\.\/ammo-defense\/styles\.css(\?v=\d+)?">/);
    });
});

describe('ammo-defense.html - required DOM elements', () => {
    const requiredIds = [
        'game', 'helpButton', 'soundButton', 'pauseButton',
        'startOverlay', 'startButton', 'continueGameButton',
        'pauseOverlay', 'resumeButton',
        'resultOverlay', 'resultEyebrow', 'resultTitle',
        'resultCoins', 'resultKills', 'resultRank',
        'continueStageButton', 'restartButton',
        'stageOverlay', 'stageEyebrow', 'nextStageButton',
        'choiceOverlay', 'choiceList', 'refreshChoicesButton',
        'helpOverlay', 'closeHelpButton',
        'announcer',
    ];

    test.each(requiredIds)('has element with id="%s"', (id) => {
        expect(html).toMatch(new RegExp(`id="${id}"`));
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

    test('canvas has correct dimensions', () => {
        expect(html).toMatch(/id="game"\s+width="860"\s+height="1640"/);
    });
});

describe('ammo-defense.html - script loading', () => {
    const requiredScripts = [
        'ammo-defense/core.js',
        'ammo-defense/systems.js',
        'ammo-defense/background.js',
        'ammo-defense/render.js',
        'ammo-defense/game.js',
    ];

    test.each(requiredScripts)('loads %s', (src) => {
        expect(html).toContain(src);
    });

    test('scripts load in correct order (core → systems → background → render → game)', () => {
        const coreIdx = html.indexOf('ammo-defense/core.js');
        const systemsIdx = html.indexOf('ammo-defense/systems.js');
        const bgIdx = html.indexOf('ammo-defense/background.js');
        const renderIdx = html.indexOf('ammo-defense/render.js');
        const gameIdx = html.indexOf('ammo-defense/game.js');
        expect(coreIdx).toBeLessThan(systemsIdx);
        expect(systemsIdx).toBeLessThan(bgIdx);
        expect(bgIdx).toBeLessThan(renderIdx);
        expect(renderIdx).toBeLessThan(gameIdx);
    });
});

describe('ammo-defense.html - accessibility', () => {
    test('canvas has aria-label', () => {
        expect(html).toMatch(/<canvas[^>]+aria-label="[^"]+"/);
    });

    test('has announcer for screen readers', () => {
        expect(html).toMatch(/aria-live="polite"\s+id="announcer"/);
    });

    test('main section has aria-label', () => {
        expect(html).toMatch(/<main[^>]+aria-label="[^"]+"/);
    });
});

// ── JS syntax validation ─────────────────────────────────────────────────

describe('ammo-defense JS files - syntax', () => {
    const jsFiles = [
        { name: 'core.js', content: coreJs },
        { name: 'systems.js', content: systemsJs },
        { name: 'render.js', content: renderJs },
        { name: 'game.js', content: gameJs },
        { name: 'background.js', content: bgJs },
    ];

    test.each(jsFiles)('$name parses without syntax errors', ({ content }) => {
        expect(() => new Function(content)).not.toThrow();
    });

    test.each(jsFiles)('$name starts with "use strict"', ({ content }) => {
        expect(content.trimStart()).toMatch(/^"use strict"/);
    });
});

// ── CSS validation ───────────────────────────────────────────────────────

describe('ammo-defense styles.css', () => {
    test('defines CSS custom properties', () => {
        expect(stylesCSS).toMatch(/:root\s*\{/);
        expect(stylesCSS).toMatch(/--ink/);
        expect(stylesCSS).toMatch(/--cream/);
    });

    test('has overlay styles', () => {
        expect(stylesCSS).toMatch(/\.overlay/);
    });

    test('has choice-button styles', () => {
        expect(stylesCSS).toMatch(/\.choice-button/);
    });

    test('has choice-tag styles for synergy system', () => {
        expect(stylesCSS).toMatch(/\.choice-tag/);
    });

    test('has responsive media query', () => {
        expect(stylesCSS).toMatch(/@media/);
    });
});

// ── Core constants & state ───────────────────────────────────────────────

describe('ammo-defense core.js - constants', () => {
    test('defines TOTAL_STAGES = 10', () => {
        expect(coreJs).toMatch(/const TOTAL_STAGES\s*=\s*10/);
    });

    test('defines WAVES_PER_STAGE = 10', () => {
        expect(coreJs).toMatch(/const WAVES_PER_STAGE\s*=\s*10/);
    });

    test('defines TOTAL_WAVES = TOTAL_STAGES * WAVES_PER_STAGE', () => {
        expect(coreJs).toMatch(/const TOTAL_WAVES\s*=\s*TOTAL_STAGES\s*\*\s*WAVES_PER_STAGE/);
    });

    test('defines WALL_MAX_HP = 5', () => {
        expect(coreJs).toMatch(/const WALL_MAX_HP\s*=\s*5/);
    });

    test('defines HOME_MAX_HP = 5', () => {
        expect(coreJs).toMatch(/const HOME_MAX_HP\s*=\s*5/);
    });

    test('defines canvas dimensions W=430 H=820', () => {
        expect(coreJs).toMatch(/const W\s*=\s*430/);
        expect(coreJs).toMatch(/const H\s*=\s*820/);
    });
});

describe('ammo-defense core.js - state shape', () => {
    const requiredStateKeys = [
        'mode', 'time', 'coins', 'earned', 'kills', 'lives',
        'wave', 'waveActive', 'productionLevel',
        'gunnerCount', 'gunnerLevel', 'cannonCount', 'cannonLevel',
        'porterLevel', 'priority', 'ammoStock',
        'gunnerMagazines', 'cannonMagazines',
        'wallHealth', 'focusDefenseTarget', 'focusTarget',
        'endless', 'endlessWave',
        'synergyCounts', 'activeSynergies',
    ];

    test.each(requiredStateKeys)('state object has key "%s"', (key) => {
        expect(coreJs).toMatch(new RegExp(`\\b${key}\\s*:`));
    });

    test('synergyCounts has fire, armor, speed, economy', () => {
        expect(coreJs).toMatch(/synergyCounts:\s*\{\s*fire:\s*0.*armor:\s*0.*speed:\s*0.*economy:\s*0/);
    });
});

describe('ammo-defense core.js - wave generation', () => {
    test('createWave function exists', () => {
        expect(coreJs).toMatch(/function createWave\(/);
    });

    test('createEndlessWave function exists', () => {
        expect(coreJs).toMatch(/function createEndlessWave\(/);
    });

    test('getWave function exists', () => {
        expect(coreJs).toMatch(/function getWave\(/);
    });

    test('waveBook is generated from createWave', () => {
        expect(coreJs).toMatch(/const waveBook\s*=\s*Array\.from/);
    });

    test('boss waves have bossName', () => {
        expect(coreJs).toMatch(/bossName/);
    });
});

describe('ammo-defense core.js - synergy system', () => {
    test('choiceTags mapping exists', () => {
        expect(coreJs).toMatch(/const choiceTags\s*=/);
    });

    test('synergyDefs array exists', () => {
        expect(coreJs).toMatch(/const synergyDefs\s*=/);
    });

    test('checkSynergies function exists', () => {
        expect(coreJs).toMatch(/function checkSynergies\(/);
    });

    test('synergy thresholds at 3 and 6', () => {
        const thresholds = [...coreJs.matchAll(/threshold:\s*(\d+)/g)].map(m => Number(m[1]));
        expect(thresholds).toContain(3);
        expect(thresholds).toContain(6);
    });

    test('has all four synergy tags in defs', () => {
        for (const tag of ['fire', 'armor', 'speed', 'economy']) {
            expect(coreJs).toMatch(new RegExp(`tag:\\s*"${tag}"`));
        }
    });
});

describe('ammo-defense core.js - endless mode', () => {
    test('startEndlessMode function exists', () => {
        expect(coreJs).toMatch(/function startEndlessMode\(/);
    });

    test('endGame handles endless mode', () => {
        expect(coreJs).toMatch(/const isEndless\s*=\s*state\.endless/);
    });

    test('endless button is created dynamically', () => {
        expect(coreJs).toMatch(/endlessButton/);
    });

    test('resetGame clears endless state', () => {
        expect(coreJs).toMatch(/state\.endless\s*=\s*false/);
        expect(coreJs).toMatch(/state\.endlessWave\s*=\s*0/);
    });
});

// ── Systems.js tests ─────────────────────────────────────────────────────

describe('ammo-defense systems.js - core functions', () => {
    const requiredFunctions = [
        'spawnAmmo', 'spawnEnemy', 'spawnProjectile',
        'updateWorkers', 'updateWeapons', 'updateProjectiles',
        'damageEnemy', 'defeatEnemy',
        'priorityTarget', 'aimAngleForTarget',
        'isBossEnraged',
    ];

    test.each(requiredFunctions)('defines function %s', (fn) => {
        expect(systemsJs).toMatch(new RegExp(`function ${fn}\\(`));
    });
});

describe('ammo-defense systems.js - enemy types', () => {
    test('supports grunt type', () => {
        expect(systemsJs).toMatch(/"grunt"/);
    });

    test('supports runner type', () => {
        expect(systemsJs).toMatch(/"runner"/);
    });

    test('supports tank type', () => {
        expect(systemsJs).toMatch(/"tank"/);
    });

    test('supports saboteur type', () => {
        expect(systemsJs).toMatch(/"saboteur"/);
    });

    test('supports boss type', () => {
        expect(systemsJs).toMatch(/"boss"/);
    });

    test('supports healer type', () => {
        expect(systemsJs).toMatch(/"healer"/);
    });

    test('healer has healing logic', () => {
        expect(systemsJs).toMatch(/healTimer/);
        expect(systemsJs).toMatch(/healRange/);
        expect(systemsJs).toMatch(/healAmount/);
    });
});

describe('ammo-defense systems.js - focus target', () => {
    test('priorityTarget checks focusTarget', () => {
        expect(systemsJs).toMatch(/state\.focusTarget/);
    });

    test('clears dead focusTarget', () => {
        expect(systemsJs).toMatch(/!visible\.includes\(state\.focusTarget\)/);
    });
});

describe('ammo-defense systems.js - boss enrage', () => {
    test('isBossEnraged checks HP < 30%', () => {
        expect(systemsJs).toMatch(/enemy\.hp\s*<\s*enemy\.maxHp\s*\*\s*0\.3/);
    });

    test('enraged boss attacks faster', () => {
        expect(systemsJs).toMatch(/isBossEnraged\(enemy\)\s*\?\s*0\.42/);
    });

    test('enrage notification fires once', () => {
        expect(systemsJs).toMatch(/enrageNotified/);
    });
});

describe('ammo-defense systems.js - endless wave support', () => {
    test('uses getWave instead of direct waveBook access for spawning', () => {
        expect(systemsJs).not.toMatch(/waveBook\[state\.wave\]/);
    });

    test('increments endlessWave on wave clear', () => {
        expect(systemsJs).toMatch(/state\.endlessWave\+\+/);
    });

    test('endless mode skips stage clear screen', () => {
        expect(systemsJs).toMatch(/!state\.endless\s*&&\s*clearedWave\.stageWave\s*===\s*WAVES_PER_STAGE/);
    });
});

// ── Render.js tests ──────────────────────────────────────────────────────

describe('ammo-defense render.js - drawing functions', () => {
    const requiredFunctions = [
        'drawHeader', 'drawEnemy', 'drawGun', 'drawCannon',
        'drawGunnerWeapon', 'drawExtraWeapons', 'drawWaveLabel',
        'drawHealerEnemy',
    ];

    test.each(requiredFunctions)('defines function %s', (fn) => {
        expect(renderJs).toMatch(new RegExp(`function ${fn}\\(`));
    });
});

describe('ammo-defense render.js - enemy palettes', () => {
    test('has palette for all enemy types including healer', () => {
        for (const type of ['grunt', 'runner', 'tank', 'saboteur', 'boss', 'healer']) {
            expect(renderJs).toMatch(new RegExp(`${type}:\\s*\\{`));
        }
    });
});

describe('ammo-defense render.js - focus target indicator', () => {
    test('draws focus crosshair on focused enemy', () => {
        expect(renderJs).toMatch(/state\.focusTarget\s*===\s*enemy/);
    });

    test('shows 集火 label', () => {
        expect(renderJs).toMatch(/"集火"/);
    });
});

describe('ammo-defense render.js - weapon starving indicator', () => {
    test('shows starving indicator for gunners', () => {
        expect(renderJs).toMatch(/gunnerAmmoCount\(index\)\s*===\s*0\s*&&\s*state\.waveActive/);
    });

    test('shows starving indicator for cannons', () => {
        expect(renderJs).toMatch(/cannonAmmoCount\(index\)\s*===\s*0\s*&&\s*state\.waveActive/);
    });
});

describe('ammo-defense render.js - boss enrage visual', () => {
    test('draws enrage aura for enraged boss', () => {
        expect(renderJs).toMatch(/isBossEnraged\(enemy\)/);
    });
});

describe('ammo-defense render.js - endless mode header', () => {
    test('shows endless mode info in header', () => {
        expect(renderJs).toMatch(/state\.endless/);
        expect(renderJs).toMatch(/无尽/);
    });

    test('shows synergy indicators in header', () => {
        expect(renderJs).toMatch(/synergyCounts/);
    });
});

// ── Game.js tests ────────────────────────────────────────────────────────

describe('ammo-defense game.js - event handling', () => {
    test('handles pointerdown events', () => {
        expect(gameJs).toMatch(/pointerdown/);
    });

    test('handles keyboard events', () => {
        expect(gameJs).toMatch(/keydown/);
    });

    test('tap-to-target: finds closest enemy on tap', () => {
        expect(gameJs).toMatch(/closestDist/);
        expect(gameJs).toMatch(/state\.focusTarget/);
    });

    test('shows 集火目标 floater when targeting', () => {
        expect(gameJs).toMatch(/集火目标/);
    });

    test('shows 取消集火 floater when cancelling', () => {
        expect(gameJs).toMatch(/取消集火/);
    });
});

// ── Pure logic tests (executed in sandboxed VM) ──────────────────────────

describe('ammo-defense - pure logic (sandboxed)', () => {
    let sandbox;
    let G; // exposed globals

    beforeAll(() => {
        sandbox = vm.createContext({
            document: {
                getElementById: () => ({
                    getContext: () => ({
                        scale: () => {},
                        save: () => {},
                        restore: () => {},
                        fillRect: () => {},
                        beginPath: () => {},
                        arc: () => {},
                        fill: () => {},
                        stroke: () => {},
                        moveTo: () => {},
                        lineTo: () => {},
                        closePath: () => {},
                    }),
                    width: 860,
                    height: 1640,
                    hidden: false,
                    addEventListener: () => {},
                    textContent: '',
                    replaceChildren: () => {},
                    parentNode: { insertBefore: () => {} },
                    innerHTML: '',
                    className: '',
                }),
            },
            window: {
                addEventListener: () => {},
                AudioContext: function() {
                    return {
                        createOscillator: () => ({
                            type: '', frequency: { value: 0 },
                            connect: () => {}, start: () => {}, stop: () => {},
                        }),
                        createGain: () => ({
                            gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                            connect: () => {},
                        }),
                        currentTime: 0,
                        destination: {},
                    };
                },
            },
            localStorage: {
                getItem: () => null,
                setItem: () => {},
            },
            requestAnimationFrame: () => {},
            performance: { now: () => 0 },
            console,
            Math,
            Number,
            Array,
            Set,
            Object,
            String,
            Infinity,
            setTimeout: () => {},
            navigator: { userAgent: '' },
            _exports: {},
        });
        // Remove "use strict" so const/function declarations land on global scope,
        // then collect them via a wrapper that exports key symbols.
        const coreNoStrict = coreJs.replace(/^"use strict";\s*/, '');
        const systemsNoStrict = systemsJs.replace(/^"use strict";\s*/, '');
        vm.runInContext(coreNoStrict, sandbox);
        vm.runInContext(systemsNoStrict, sandbox);
        // Collect exports via eval
        G = vm.runInContext(`({
            waveBook, getWave, createEndlessWave, state, shop,
            TOTAL_STAGES, WAVES_PER_STAGE, TOTAL_WAVES,
            isBossEnraged, choiceTags, synergyDefs,
        })`, sandbox);
    });

    test('createWave generates 100 waves', () => {
        expect(G.waveBook.length).toBe(100);
    });

    test('each wave has required properties', () => {
        const requiredKeys = ['count', 'interval', 'hp', 'speed', 'reward', 'type', 'stage', 'stageWave'];
        for (const wave of G.waveBook) {
            for (const key of requiredKeys) {
                expect(wave).toHaveProperty(key);
            }
        }
    });

    test('wave 10 (index 9) is a boss wave', () => {
        expect(G.waveBook[9].type).toBe('boss');
        expect(G.waveBook[9].stageWave).toBe(10);
    });

    test('every 10th wave is a boss wave', () => {
        for (let i = 9; i < 100; i += 10) {
            expect(G.waveBook[i].type).toBe('boss');
        }
    });

    test('boss waves have count = 1', () => {
        for (let i = 9; i < 100; i += 10) {
            expect(G.waveBook[i].count).toBe(1);
        }
    });

    test('non-boss waves have count > 1', () => {
        for (let i = 0; i < 100; i++) {
            if (i % 10 !== 9) {
                expect(G.waveBook[i].count).toBeGreaterThan(1);
            }
        }
    });

    test('wave HP generally increases over time', () => {
        const firstNonBoss = G.waveBook[0];
        const midNonBoss = G.waveBook[45];
        const lateNonBoss = G.waveBook[95];
        expect(midNonBoss.hp).toBeGreaterThan(firstNonBoss.hp);
        expect(lateNonBoss.hp).toBeGreaterThan(midNonBoss.hp);
    });

    test('getWave returns waveBook entry for index < 100', () => {
        expect(G.getWave(0)).toBe(G.waveBook[0]);
        expect(G.getWave(99)).toBe(G.waveBook[99]);
    });

    test('getWave returns generated wave for index >= 100', () => {
        const endlessWave = G.getWave(100);
        expect(endlessWave).toBeDefined();
        expect(endlessWave).toHaveProperty('hp');
        expect(endlessWave).toHaveProperty('count');
        expect(endlessWave).toHaveProperty('stage');
    });

    test('endless wave at stageWave 10 is boss', () => {
        const bossWave = G.getWave(109);
        expect(bossWave.type).toBe('boss');
        expect(bossWave.stageWave).toBe(10);
    });

    test('endless waves have positive HP and count', () => {
        for (let i = 100; i < 110; i++) {
            const w = G.getWave(i);
            expect(w.hp).toBeGreaterThan(0);
            expect(w.count).toBeGreaterThan(0);
        }
    });

    test('state initial values are correct', () => {
        expect(G.state.mode).toBe('start');
        expect(G.state.coins).toBe(120);
        expect(G.state.lives).toBe(5);
        expect(G.state.endless).toBe(false);
        expect(G.state.endlessWave).toBe(0);
        expect(G.state.focusTarget).toBeNull();
    });

    test('synergyCounts initialized to all zeros', () => {
        expect(G.state.synergyCounts).toEqual({ fire: 0, armor: 0, speed: 0, economy: 0 });
    });

    test('activeSynergies starts empty', () => {
        expect(G.state.activeSynergies).toEqual([]);
    });

    test('isBossEnraged returns false for non-boss', () => {
        const grunt = { type: 'grunt', hp: 10, maxHp: 100, shield: 0 };
        expect(G.isBossEnraged(grunt)).toBe(false);
    });

    test('isBossEnraged returns false for boss above 30% HP', () => {
        const boss = { type: 'boss', hp: 50, maxHp: 100, shield: 0 };
        expect(G.isBossEnraged(boss)).toBe(false);
    });

    test('isBossEnraged returns true for boss below 30% HP with no shield', () => {
        const boss = { type: 'boss', hp: 20, maxHp: 100, shield: 0 };
        expect(G.isBossEnraged(boss)).toBe(true);
    });

    test('isBossEnraged returns false for boss below 30% HP but with shield', () => {
        const boss = { type: 'boss', hp: 20, maxHp: 100, shield: 50 };
        expect(G.isBossEnraged(boss)).toBe(false);
    });

    test('isBossEnraged boundary: exactly 30% HP is not enraged', () => {
        const boss = { type: 'boss', hp: 30, maxHp: 100, shield: 0 };
        expect(G.isBossEnraged(boss)).toBe(false);
    });

    test('isBossEnraged boundary: 29.9% HP is enraged', () => {
        const boss = { type: 'boss', hp: 29.9, maxHp: 100, shield: 0 };
        expect(G.isBossEnraged(boss)).toBe(true);
    });

    test('choiceTags maps known choices to synergy tags', () => {
        expect(G.choiceTags.fire).toBe('fire');
        expect(G.choiceTags.ap).toBe('armor');
        expect(G.choiceTags.beltSpeed).toBe('speed');
        expect(G.choiceTags.bounty).toBe('economy');
    });

    test('synergyDefs has entries for all four tags', () => {
        const tags = G.synergyDefs.map(d => d.tag);
        expect(tags).toContain('fire');
        expect(tags).toContain('armor');
        expect(tags).toContain('speed');
        expect(tags).toContain('economy');
    });

    test('synergyDefs has 16 entries (4 tags × 4 thresholds)', () => {
        expect(G.synergyDefs.length).toBe(16);
    });

    test('TOTAL_STAGES and WAVES_PER_STAGE constants', () => {
        expect(G.TOTAL_STAGES).toBe(10);
        expect(G.WAVES_PER_STAGE).toBe(10);
        expect(G.TOTAL_WAVES).toBe(100);
    });

    test('shop has 5 upgrade slots', () => {
        expect(G.shop.length).toBe(5);
    });
});
