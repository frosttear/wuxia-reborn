// tests/data.test.js - Structural validation of JSON data files

const chains  = require('../data/chains.json');
const enemies = require('../data/enemies.json');
const bonds   = require('../data/bonds.json');

// ── chains.json ────────────────────────────────────────────────────────────

describe('chains.json - top-level structure', () => {
    test('has a "chains" array', () => {
        expect(Array.isArray(chains.chains)).toBe(true);
        expect(chains.chains.length).toBeGreaterThan(0);
    });

    test('contains the three expected chains', () => {
        const ids = chains.chains.map(c => c.id);
        expect(ids).toContain('tianmo_harbinger');
        expect(ids).toContain('elder_past');
        expect(ids).toContain('jianghu_chaos');
    });
});

describe.each(chains.chains)('chain "$id"', (chain) => {
    test('has required string fields', () => {
        expect(typeof chain.id).toBe('string');
        expect(typeof chain.name).toBe('string');
        expect(typeof chain.desc).toBe('string');
        expect(chain.id.length).toBeGreaterThan(0);
        expect(chain.name.length).toBeGreaterThan(0);
    });

    test('has a non-empty steps array', () => {
        expect(Array.isArray(chain.steps)).toBe(true);
        expect(chain.steps.length).toBeGreaterThan(0);
    });

    test('has a completionReward with attributes', () => {
        expect(chain.completionReward).toBeDefined();
        expect(chain.completionReward.attributes).toBeDefined();
        const attrs = chain.completionReward.attributes;
        const total = Object.values(attrs).reduce((s, v) => s + v, 0);
        expect(total).toBeGreaterThan(0);
    });

    test('each step has required fields', () => {
        for (const step of chain.steps) {
            expect(typeof step.id).toBe('string');
            expect(typeof step.title).toBe('string');
            expect(typeof step.text).toBe('string');
            expect(step.text.length).toBeGreaterThan(0);
            expect(Array.isArray(step.choices)).toBe(true);
            expect(step.choices.length).toBeGreaterThan(0);
        }
    });

    test('each step has unlockConditions', () => {
        for (const step of chain.steps) {
            expect(step.unlockConditions).toBeDefined();
        }
    });

    test('each step has onComplete', () => {
        for (const step of chain.steps) {
            expect(step.onComplete).toBeDefined();
        }
    });

    test('each choice has id and text', () => {
        for (const step of chain.steps) {
            for (const choice of step.choices) {
                expect(typeof choice.id).toBe('string');
                expect(typeof choice.text).toBe('string');
                expect(choice.text.length).toBeGreaterThan(0);
                expect(choice.effects).toBeDefined();
            }
        }
    });
});

// ── enemies referenced by chains exist in enemies.json ────────────────────

describe('chain combat references', () => {
    const enemyIds = enemies.map(e => e.id);

    for (const chain of chains.chains) {
        for (const step of chain.steps) {
            for (const choice of step.choices) {
                const combatId = choice.effects && choice.effects.combat;
                if (combatId) {
                    test(`enemy "${combatId}" referenced in chain "${chain.id}" exists in enemies.json`, () => {
                        expect(enemyIds).toContain(combatId);
                    });
                }
            }
        }
    }
});

// ── enemies.json ────────────────────────────────────────────────────────────

describe('enemies.json - structure', () => {
    test('is an array', () => {
        expect(Array.isArray(enemies)).toBe(true);
        expect(enemies.length).toBeGreaterThan(0);
    });

    test('contains new chain bosses', () => {
        const ids = enemies.map(e => e.id);
        expect(ids).toContain('tianmo_vanguard');
        expect(ids).toContain('shadow_cult_leader');
    });

    test('each enemy has required combat fields', () => {
        for (const enemy of enemies) {
            expect(typeof enemy.id).toBe('string');
            expect(typeof enemy.name).toBe('string');
            expect(typeof enemy.attack).toBe('number');
            expect(typeof enemy.defense).toBe('number');
            expect(typeof enemy.hp).toBe('number');
            expect(enemy.hp).toBeGreaterThan(0);
            expect(enemy.attack).toBeGreaterThan(0);
        }
    });

    test('each enemy has win and lose narratives', () => {
        for (const enemy of enemies) {
            expect(typeof enemy.winNarrative).toBe('string');
            expect(typeof enemy.loseNarrative).toBe('string');
        }
    });

    test('chain bosses have skills', () => {
        const vanguard = enemies.find(e => e.id === 'tianmo_vanguard');
        const leader   = enemies.find(e => e.id === 'shadow_cult_leader');
        expect(vanguard.skills.length).toBeGreaterThan(0);
        expect(leader.skills.length).toBeGreaterThan(0);
    });
});

// ── bonds.json ─────────────────────────────────────────────────────────────

describe('bonds.json - NPC bond structure', () => {
    const npcIds = Object.keys(bonds).filter(k => k !== '_casualVisits');

    test('has at least 3 NPC bond definitions', () => {
        expect(npcIds.length).toBeGreaterThanOrEqual(3);
    });

    test.each(npcIds)('NPC "%s" has 5 bond chapters', (npcId) => {
        const chapters = bonds[npcId];
        expect(Array.isArray(chapters)).toBe(true);
        expect(chapters.length).toBe(5);
    });

    test.each(npcIds)('NPC "%s" last chapter has a passive', (npcId) => {
        const chapters = bonds[npcId];
        const last = chapters[chapters.length - 1];
        expect(last.passive).toBeDefined();
        expect(typeof last.passive.id).toBe('string');
        expect(typeof last.passive.name).toBe('string');
    });

    test.each(npcIds)('NPC "%s" chapters have ascending levels', (npcId) => {
        const chapters = bonds[npcId];
        for (let i = 0; i < chapters.length; i++) {
            expect(chapters[i].level).toBe(i + 1);
        }
    });

    test.each(npcIds)('NPC "%s" chapters have ascending minAffinity', (npcId) => {
        const chapters = bonds[npcId];
        for (let i = 1; i < chapters.length; i++) {
            expect(chapters[i].minAffinity).toBeGreaterThan(chapters[i - 1].minAffinity);
        }
    });
});
