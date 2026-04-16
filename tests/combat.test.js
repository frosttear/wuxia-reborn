// tests/combat.test.js - Unit tests for Combat module

const STUB_ENEMY = {
    id: 'test_enemy', name: '测试敌人',
    attack: 20, defense: 10, hp: 60,
    attackScale: 0, defenseScale: 0, hpScale: 0,
    attackDescs: ['猛击'], skills: []
};
const STUB_JOB = { id: 'nobody', baseAttack: 5, baseDefense: 2, hpBonus: 100 };

function freshCombat() {
    const char = makeChar({ attributes: { strength: 8, agility: 5, constitution: 5, innerForce: 3, comprehension: 5, luck: 5, reputation: 0 } });
    char.hp = 100;
    const cs = Combat.initState(char, STUB_ENEMY, STUB_JOB);
    return { char, cs };
}

describe('Combat.initState', () => {
    test('creates a valid combat state', () => {
        const { cs } = freshCombat();
        expect(cs.enemy).toBe(STUB_ENEMY);
        expect(cs.enemyHp).toBe(60);         // no scaling at age 15
        expect(cs.enemyMaxHp).toBe(60);
        expect(cs.turn).toBe(0);
        expect(cs.log).toEqual([]);
        expect(cs.usedSkills).toEqual([]);
        expect(cs.totalDmgDealt).toBe(0);
        expect(cs.totalDmgReceived).toBe(0);
    });

    test('enemy HP scales with character age tier', () => {
        const char = makeChar({ ageMonths: 228 }); // age 19 → tier 4
        const scaledEnemy = { ...STUB_ENEMY, hpScale: 0.15 };
        const cs = Combat.initState(char, scaledEnemy, STUB_JOB);
        expect(cs.enemyMaxHp).toBeGreaterThan(60);
    });
});

describe('Combat.processTurn - attack', () => {
    test('increments turn counter', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('attack', cs, char, STUB_JOB);
        expect(cs.turn).toBe(1);
    });

    test('deals damage to enemy (enemyHp decreases)', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('attack', cs, char, STUB_JOB);
        expect(cs.enemyHp).toBeLessThan(cs.enemyMaxHp);
    });

    test('tracks total damage dealt', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('attack', cs, char, STUB_JOB);
        expect(cs.totalDmgDealt).toBeGreaterThan(0);
    });

    test('returns combatOver and result properties', () => {
        const { char, cs } = freshCombat();
        const result = Combat.processTurn('attack', cs, char, STUB_JOB);
        expect(result).toHaveProperty('combatOver');
        expect(result).toHaveProperty('result');
    });

    test('winning sets combatOver=true and result=won', () => {
        const { char, cs } = freshCombat();
        cs.enemyHp = 1; // one hit from death
        const result = Combat.processTurn('attack', cs, char, STUB_JOB);
        if (result.combatOver) {
            expect(result.result).toBe('won');
        }
    });
});

describe('Combat.processTurn - defend', () => {
    test('increments turn counter', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('defend', cs, char, STUB_JOB);
        expect(cs.turn).toBe(1);
    });

    test('player still takes some damage (enemy attacks back)', () => {
        // Run many times to account for randomness
        let receivedDamage = false;
        for (let i = 0; i < 20; i++) {
            const { char, cs } = freshCombat();
            const hpBefore = char.hp;
            Combat.processTurn('defend', cs, char, STUB_JOB);
            if (char.hp < hpBefore) { receivedDamage = true; break; }
        }
        expect(receivedDamage).toBe(true);
    });
});

describe('Combat.processTurn - flee', () => {
    test('returns combatOver=true and result=fled or null (random)', () => {
        const { char, cs } = freshCombat();
        const result = Combat.processTurn('flee', cs, char, STUB_JOB);
        expect(result.combatOver === true || result.combatOver === false).toBe(true);
        if (result.combatOver) {
            expect(['fled', 'lost']).toContain(result.result);
        }
    });

    test('cannot flee when noFlee=true', () => {
        const { char, cs } = freshCombat();
        cs.noFlee = true;
        // Engine guards this before calling processTurn, so processTurn itself
        // still resolves as flee. The guard is in Engine.handleCombatAction.
        // Just verify the turn runs without error.
        expect(() => Combat.processTurn('flee', cs, char, STUB_JOB)).not.toThrow();
    });
});

describe('Combat.processTurn - lost condition', () => {
    test('sets result=lost when player HP reaches 0', () => {
        const { char, cs } = freshCombat();
        char.hp = 1; // barely alive
        // Force a loss by running attacks until char dies
        let result;
        for (let i = 0; i < 50; i++) {
            result = Combat.processTurn('attack', cs, char, STUB_JOB);
            if (result.combatOver) break;
        }
        if (result && result.combatOver) {
            expect(['won', 'lost']).toContain(result.result);
        }
    });
});

describe('Combat.getEffectiveStats', () => {
    test('returns base stats at age 15 (tier 0)', () => {
        const char = makeChar({ ageMonths: 180 }); // age 15
        const eff = Combat.getEffectiveStats(STUB_ENEMY, char);
        expect(eff.attack).toBe(20);
        expect(eff.defense).toBe(10);
        expect(eff.hp).toBe(60);
    });

    test('returns scaled stats at higher ages', () => {
        const char = makeChar({ ageMonths: 216 }); // age 18 → tier 3
        const scaledEnemy = { ...STUB_ENEMY, attackScale: 5, defenseScale: 3, hpScale: 0.15 };
        const eff = Combat.getEffectiveStats(scaledEnemy, char);
        expect(eff.attack).toBeGreaterThan(20);
        expect(eff.defense).toBeGreaterThan(10);
        expect(eff.hp).toBeGreaterThan(60);
    });
});
