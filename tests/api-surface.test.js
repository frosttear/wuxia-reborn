// tests/api-surface.test.js
// Verifies that every method referenced in game JS files actually exists on its
// module. Prevents silent "X is not a function" errors in the browser.

describe('Character API surface', () => {
    const expected = [
        'applyAttributeChanges',
        'applyBirthMonthBonus',
        'checkJobUnlocks',
        'create',
        'getAgeMonthsRemainder',
        'getAgeYears',
        'getAttackPower',
        'getDefensePower',
        'getHPMax',
        'getLuckDodgeChance',
        'getLuckTriggerChance',
        'getQiShield',
        'getSkillAmplify',
        'meetsJobRequirements',
        'monthlyHPRegen',
        'takeDamage',
    ];

    test.each(expected)('Character.%s is a function', (method) => {
        expect(typeof Character[method]).toBe('function');
    });

    test('Character.getMaxHP does not exist (correct name is getHPMax)', () => {
        expect(Character.getMaxHP).toBeUndefined();
    });
});

describe('NPCSystem API surface', () => {
    const expected = [
        'changeAffinity',
        'checkNPCAffinity',
        'getAffinity',
        'getAffinityLabel',
        'getMetNPCs',
        'initRelationships',
    ];

    test.each(expected)('NPCSystem.%s is a function', (method) => {
        expect(typeof NPCSystem[method]).toBe('function');
    });
});

describe('Combat API surface', () => {
    const expected = [
        'calcWinChance',
        'getActionPreview',
        'getEffectiveStats',
        'getStrikeEffRatio',
        'initState',
        'processTurn',
        'runQuickCombat',
    ];

    test.each(expected)('Combat.%s is a function', (method) => {
        expect(typeof Combat[method]).toBe('function');
    });
});

describe('Engine API surface', () => {
    const expected = [
        'applyChoice',
        'deleteSave',
        'executeRebirth',
        'getAllPendingChainSteps',
        'getAvailableVisits',
        'getJob',
        'handleCombatAction',
        'handleQuickCombat',
        'startTestCombat',
        'visitNPC',
    ];

    test.each(expected)('Engine.%s is a function', (method) => {
        expect(typeof Engine[method]).toBe('function');
    });
});
