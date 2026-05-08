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

// ── chain-specific unlock condition regressions ────────────────────────────

describe('chain unlock condition regressions', () => {
    test('hero_path_1 (义救灾民) requires blade_master job', () => {
        const heroPath = chains.chains.find(c => c.id === 'hero_path');
        expect(heroPath).toBeDefined();
        const step = heroPath.steps.find(s => s.id === 'hero_path_1');
        expect(step).toBeDefined();
        expect(step.unlockConditions.jobs).toContain('blade_master');
        expect(step.unlockConditions.jobs).not.toContain('swordsman');
    });

    const afterstoryCases = [
        { chainId: 'li_yunshu_afterstory',  stepId: 'li_after_1',   npcId: 'li_yunshu',        sp5Flag: 'li_sp5_done'  },
        { chainId: 'su_qing_afterstory',    stepId: 'su_after_1',   npcId: 'su_qing',           sp5Flag: 'su_sp5_done'  },
        { chainId: 'lingxue_afterstory',    stepId: 'lx_after_1',   npcId: 'ling_xue',          sp5Flag: 'lx_sp5_done'  },
        { chainId: 'yan_afterstory',        stepId: 'yan_after_1',  npcId: 'yan_chixing',       sp5Flag: 'yan_sp5_done' },
        { chainId: 'elder_afterstory',      stepId: 'elder_after_1',npcId: 'mysterious_elder',  sp5Flag: 'elder_sp5_done'},
    ];

    test.each(afterstoryCases)('$chainId first step requires only SP5 flag + bond level 5', ({ chainId, stepId, npcId, sp5Flag }) => {
        const chain = chains.chains.find(c => c.id === chainId);
        expect(chain).toBeDefined();
        const step = chain.steps.find(s => s.id === stepId);
        expect(step).toBeDefined();
        const uc = step.unlockConditions;
        expect(uc.bondLevels[npcId]).toBe(5);
        expect(uc.flags[sp5Flag]).toBe(true);
        expect(Object.keys(uc.flags)).toEqual([sp5Flag]);
        expect(Object.keys(uc.bondLevels)).toEqual([npcId]);
        expect(uc.jobs).toBeUndefined();
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
        // Conditional alternate-path entries (those with a "conditions" field) are allowed
        // in addition to the standard 5 chapters.
        const mainChapters = chapters.filter(c => !c.conditions);
        expect(mainChapters.length).toBe(5);
    });

    test.each(npcIds)('NPC "%s" last chapter has a passive', (npcId) => {
        const chapters = bonds[npcId];
        // The last default (non-conditional) chapter must have a passive.
        const mainChapters = chapters.filter(c => !c.conditions);
        const last = mainChapters[mainChapters.length - 1];
        expect(last.passive).toBeDefined();
        expect(typeof last.passive.id).toBe('string');
        expect(typeof last.passive.name).toBe('string');
    });

    test.each(npcIds)('NPC "%s" chapters have ascending levels', (npcId) => {
        const chapters = bonds[npcId];
        // Only check ascending level order for default (non-conditional) entries.
        const mainChapters = chapters.filter(c => !c.conditions);
        for (let i = 0; i < mainChapters.length; i++) {
            expect(mainChapters[i].level).toBe(i + 1);
        }
    });

    test.each(npcIds)('NPC "%s" chapters have ascending minAffinity', (npcId) => {
        const chapters = bonds[npcId];
        // Only check ascending minAffinity for default (non-conditional) entries.
        const mainChapters = chapters.filter(c => !c.conditions);
        for (let i = 1; i < mainChapters.length; i++) {
            expect(mainChapters[i].minAffinity).toBeGreaterThan(mainChapters[i - 1].minAffinity);
        }
    });

    test('wang_tie L5 has death scene step with wang_dying_wish flag', () => {
        const l5 = bonds.wang_tie[4];
        expect(l5.level).toBe(5);
        expect(l5.steps.length).toBe(3);
        const deathStep = l5.steps[2];
        expect(deathStep.text).toMatch(/旧伤/);
        const allFlags = deathStep.choices.flatMap(c => Object.keys(c.effects.flags || {}));
        expect(allFlags).toContain('wang_dying_wish');
    });

    test('wang_tie L2 mentions 赵霸天', () => {
        const l2 = bonds.wang_tie[1];
        expect(l2.level).toBe(2);
        const allText = l2.steps.map(s => s.text).join('');
        expect(allText).toMatch(/赵霸天/);
    });
});
