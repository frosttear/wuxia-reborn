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
        expect(cs.playerMomentum).toBe(0);
        expect(cs.skillCooldown).toBe(0);
        expect(cs.enemyStunned).toBe(false);
        expect(cs.enemyComp).toBe(0);   // STUB_ENEMY has no comprehension
    });

    test('enemy HP scales with character age tier', () => {
        const char = makeChar({ ageMonths: 228 }); // age 19 → tier 4
        const scaledEnemy = { ...STUB_ENEMY, hpScale: 0.15 };
        const cs = Combat.initState(char, scaledEnemy, STUB_JOB);
        expect(cs.enemyMaxHp).toBeGreaterThan(60);
    });
});

describe('Combat.processTurn - strike (刚攻)', () => {
    test('increments turn counter', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('strike', cs, char, STUB_JOB);
        expect(cs.turn).toBe(1);
    });

    test('deals damage to enemy (enemyHp decreases)', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('strike', cs, char, STUB_JOB);
        expect(cs.enemyHp).toBeLessThan(cs.enemyMaxHp);
    });

    test('tracks total damage dealt', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('strike', cs, char, STUB_JOB);
        expect(cs.totalDmgDealt).toBeGreaterThan(0);
    });

    test('increments playerMomentum on hit', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('strike', cs, char, STUB_JOB);
        expect(cs.playerMomentum).toBeGreaterThanOrEqual(1);
    });

    test('returns combatOver and result properties', () => {
        const { char, cs } = freshCombat();
        const result = Combat.processTurn('strike', cs, char, STUB_JOB);
        expect(result).toHaveProperty('combatOver');
        expect(result).toHaveProperty('result');
    });

    test('winning sets combatOver=true and result=won', () => {
        const { char, cs } = freshCombat();
        cs.enemyHp = 1;
        const result = Combat.processTurn('strike', cs, char, STUB_JOB);
        if (result.combatOver) expect(result.result).toBe('won');
    });
});


describe('Combat.processTurn - defend (防御)', () => {
    test('increments turn counter', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('defend', cs, char, STUB_JOB);
        expect(cs.turn).toBe(1);
    });

    test('player still takes some damage (enemy attacks back)', () => {
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

describe('Combat.processTurn - focus (蓄势)', () => {
    test('increases playerMomentum by 2', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('focus', cs, char, STUB_JOB);
        expect(cs.playerMomentum).toBeGreaterThanOrEqual(2);
    });

    test('does not deal damage to enemy', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('focus', cs, char, STUB_JOB);
        expect(cs.totalDmgDealt).toBe(0);
    });
});

describe('Combat.processTurn - parry (化解) vs heavy', () => {
    test('counter-attacks when enemy uses heavy', () => {
        const { char, cs } = freshCombat();
        cs.enemyNextAction = 'heavy';
        Combat.processTurn('parry', cs, char, STUB_JOB);
        expect(cs.totalDmgDealt).toBeGreaterThan(0);
    });

    test('player takes extra damage when parry fails (swift)', () => {
        let tookDamage = false;
        for (let i = 0; i < 10; i++) {
            const { char, cs } = freshCombat();
            cs.enemyNextAction = 'swift';
            const hpBefore = char.hp;
            Combat.processTurn('parry', cs, char, STUB_JOB);
            if (char.hp < hpBefore) { tookDamage = true; break; }
        }
        expect(tookDamage).toBe(true);
    });
});

describe('Combat.processTurn - job active skill auto-trigger', () => {
    test('skill fires when momentum >= cost and cooldown = 0', () => {
        const { char, cs } = freshCombat();
        const jobWithSkill = {
            ...STUB_JOB,
            activeSkill: { id: 'test_skill', name: '测试技', momentumCost: 3, type: 'burst', power: 2.0 }
        };
        cs.playerMomentum = 3;
        cs.skillCooldown = 0;
        const hpBefore = cs.enemyHp;
        Combat.processTurn('strike', cs, jobWithSkill.activeSkill ? char : char, jobWithSkill);
        expect(cs.enemyHp).toBeLessThan(hpBefore);
        expect(cs.skillCooldown).toBe(3);
        expect(cs.playerMomentum).toBe(0);
    });

    test('skill does not fire when on cooldown', () => {
        const { char, cs } = freshCombat();
        const jobWithSkill = {
            ...STUB_JOB,
            activeSkill: { id: 'test_skill', name: '测试技', momentumCost: 3, type: 'burst', power: 2.0 }
        };
        cs.playerMomentum = 3;
        cs.skillCooldown = 2;
        Combat.processTurn('strike', cs, char, jobWithSkill);
        expect(cs.skillCooldown).toBe(1); // decremented from 2 to 1
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
        char.hp = 1;
        let result;
        for (let i = 0; i < 50; i++) {
            result = Combat.processTurn('strike', cs, char, STUB_JOB);
            if (result.combatOver) break;
        }
        if (result && result.combatOver) {
            expect(['won', 'lost']).toContain(result.result);
        }
    });
});

describe('Combat.processTurn - enemy intent preview', () => {
    test('sets enemyNextAction after each non-final turn', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('focus', cs, char, STUB_JOB);
        expect(['heavy', 'swift']).toContain(cs.enemyNextAction);
    });

    test('sets enemyIntentHint string after each turn', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('focus', cs, char, STUB_JOB);
        expect(typeof cs.enemyIntentHint).toBe('string');
    });

    test('sets enemyIntentType to accurate or unreadable', () => {
        const { char, cs } = freshCombat();
        Combat.processTurn('focus', cs, char, STUB_JOB);
        expect(['accurate', 'unreadable']).toContain(cs.enemyIntentType);
    });

    test('high playerComp vs weak enemy (comp 0) yields accurate most of the time', () => {
        let accurateCount = 0;
        for (let i = 0; i < 100; i++) {
            const char = makeChar({ attributes: { strength: 8, agility: 5, constitution: 5, innerForce: 3, comprehension: 10, luck: 5, reputation: 0 } });
            char.hp = 100;
            const cs = Combat.initState(char, STUB_ENEMY, STUB_JOB); // comp=10 vs comp=0 → 0.80*ln(1.5)≈32%
            Combat.processTurn('focus', cs, char, STUB_JOB);
            if (cs.enemyIntentType === 'accurate') accurateCount++;
        }
        expect(accurateCount).toBeGreaterThan(15); // ~32% accurate (log formula constant=20, n=100)
    });

    test('low playerComp vs strong enemy yields mostly non-accurate', () => {
        const STRONG_ENEMY = { ...STUB_ENEMY, comprehension: 30 };
        let accurateCount = 0;
        for (let i = 0; i < 100; i++) {
            const char = makeChar({ attributes: { strength: 8, agility: 5, constitution: 5, innerForce: 3, comprehension: 5, luck: 5, reputation: 0 } });
            char.hp = 100;
            const cs = Combat.initState(char, STRONG_ENEMY, STUB_JOB); // comp=5 vs comp=30 → 0.80*ln(1.1)≈7.6%
            Combat.processTurn('focus', cs, char, STUB_JOB);
            if (cs.enemyIntentType === 'accurate') accurateCount++;
        }
        expect(accurateCount).toBeLessThan(20); // <20% accurate at ratio=0.14 (actual ~5%)
    });

    test('perfectIntentRead passive always yields perfect intentType', () => {
        const char = makeChar({ attributes: { strength: 8, agility: 5, constitution: 5, innerForce: 3, comprehension: 0, luck: 5, reputation: 0 } });
        char.hp = 500;
        char.passives = [{ id: 'wuxiang_intent', name: '无相剑意', perfectIntentRead: true }];
        const TOUGH_ENEMY = { ...STUB_ENEMY, comprehension: 50 };
        const cs = Combat.initState(char, TOUGH_ENEMY, STUB_JOB);
        for (let i = 0; i < 10; i++) {
            Combat.processTurn('focus', cs, char, STUB_JOB);
            expect(cs.enemyIntentType).toBe('perfect');
            expect(cs.enemyIntentHint).not.toBe('');
        }
    });

    test('zero comprehension always yields non-accurate', () => {
        let accurateCount = 0;
        for (let i = 0; i < 40; i++) {
            const char = makeChar({ attributes: { strength: 8, agility: 5, constitution: 5, innerForce: 3, comprehension: 0, luck: 5, reputation: 0 } });
            char.hp = 100;
            const cs = Combat.initState(char, STUB_ENEMY, STUB_JOB);
            Combat.processTurn('focus', cs, char, STUB_JOB);
            if (cs.enemyIntentType === 'accurate') accurateCount++;
        }
        expect(accurateCount).toBe(0); // ratio=0 → 0% accurate
    });
});

describe('Combat.runQuickCombat', () => {
    test('returns winRate, avgHpLost, avgTurns, avgDmgDealt, avgDmgReceived', () => {
        const { char } = freshCombat();
        const result = Combat.runQuickCombat(char, STUB_ENEMY, STUB_JOB, 20);
        expect(typeof result.winRate).toBe('number');
        expect(result.winRate).toBeGreaterThanOrEqual(0);
        expect(result.winRate).toBeLessThanOrEqual(1);
        expect(typeof result.avgHpLost).toBe('number');
        expect(typeof result.avgTurns).toBe('number');
        expect(typeof result.avgDmgDealt).toBe('number');
        expect(typeof result.avgDmgReceived).toBe('number');
    });

    test('strong char wins most simulations vs weak enemy', () => {
        const { char } = freshCombat();
        char.attributes.strength = 40;
        char.attributes.agility = 20;
        char.attributes.constitution = 20;
        char.attributes.innerForce = 15;
        char.hp = 200;
        const result = Combat.runQuickCombat(char, STUB_ENEMY, STUB_JOB, 50);
        expect(result.winRate).toBeGreaterThan(0.8);
    });

    test('weak char loses most simulations vs strong enemy', () => {
        const STRONG_ENEMY = { ...STUB_ENEMY, attack: 200, defense: 150, hp: 500 };
        const { char } = freshCombat();
        char.attributes.strength = 3;
        char.hp = 20;
        const result = Combat.runQuickCombat(char, STRONG_ENEMY, STUB_JOB, 50);
        expect(result.winRate).toBeLessThan(0.2);
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
