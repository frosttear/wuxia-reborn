// tests/character.test.js - Unit tests for Character module

describe('Character.create', () => {
    test('returns a valid character structure', () => {
        const char = makeChar();
        expect(char.name).toBe('测试');
        expect(char.ageMonths).toBe(180);
        expect(char.alive).toBe(true);
        expect(char.attributes).toBeDefined();
        expect(char.chainProgress).toEqual({});
        expect(char.passives).toEqual([]);
        expect(char.visitCounts).toEqual({});
        expect(char.flags).toEqual({});
    });

    test('starts at age 15 (180 months)', () => {
        const char = makeChar();
        expect(Character.getAgeYears(char)).toBe(15);
    });

    test('applies inherited attributes on top of base', () => {
        const char = Character.create('Test', { strength: 3, luck: 2 }, []);
        expect(char.attributes.strength).toBe(8); // base 5 + 3
        expect(char.attributes.luck).toBe(7);     // base 5 + 2
    });

    test('base attributes default to expected values', () => {
        const char = Character.create('Test', {}, []);
        expect(char.attributes.strength).toBe(5);
        expect(char.attributes.agility).toBe(5);
        expect(char.attributes.constitution).toBe(5);
        expect(char.attributes.innerForce).toBe(3);
        expect(char.attributes.comprehension).toBe(5);
        expect(char.attributes.luck).toBe(5);
        expect(char.attributes.reputation).toBe(0);
    });
});

describe('Character.getAgeYears', () => {
    test('180 months = 15 years', () => {
        const char = makeChar();
        expect(Character.getAgeYears(char)).toBe(15);
    });

    test('192 months = 16 years', () => {
        const char = makeChar({ ageMonths: 192 });
        expect(Character.getAgeYears(char)).toBe(16);
    });

    test('240 months = 20 years', () => {
        const char = makeChar({ ageMonths: 240 });
        expect(Character.getAgeYears(char)).toBe(20);
    });
});

describe('Character.getHPMax', () => {
    test('scales with constitution', () => {
        const char = makeChar();
        const job = { hpBonus: 100 };
        const hp1 = Character.getHPMax(char, job);
        char.attributes.constitution = 15;
        const hp2 = Character.getHPMax(char, job);
        expect(hp2).toBeGreaterThan(hp1);
    });

    test('uses job hpBase', () => {
        const char = makeChar();
        const jobLow  = { hpBonus: 80 };
        const jobHigh = { hpBonus: 150 };
        expect(Character.getHPMax(char, jobHigh)).toBeGreaterThan(Character.getHPMax(char, jobLow));
    });

    test('returns a positive number', () => {
        const char = makeChar();
        expect(Character.getHPMax(char, { hpBonus: 100 })).toBeGreaterThan(0);
    });
});

describe('Character.applyAttributeChanges', () => {
    // Use luck=0, innerForce=0 so lucky-proc chance is exactly 0% → deterministic
    function noLuckChar() {
        const c = makeChar();
        c.attributes.luck = 0;
        c.attributes.innerForce = 0;
        return c;
    }

    test('increments specified attributes', () => {
        const char = noLuckChar();
        Character.applyAttributeChanges(char, { strength: 2, agility: 1 });
        expect(char.attributes.strength).toBe(7); // 5 + 2
        expect(char.attributes.agility).toBe(6);  // 5 + 1
    });

    test('does not modify unspecified attributes', () => {
        const char = noLuckChar();
        Character.applyAttributeChanges(char, { strength: 3 });
        expect(char.attributes.comprehension).toBe(5); // unchanged
    });

    test('returns { luckyTriggered, actualGains } object', () => {
        const char = makeChar();
        const result = Character.applyAttributeChanges(char, { strength: 1 });
        expect(typeof result).toBe('object');
        expect(typeof result.luckyTriggered).toBe('boolean');
        expect(typeof result.actualGains).toBe('object');
        expect('strength' in result.actualGains).toBe(true);
    });
});

describe('Character.monthlyHPRegen', () => {
    test('increases HP when below max', () => {
        const char = makeChar();
        const job = { hpBonus: 100 };
        char.hp = Character.getHPMax(char, job);
        char.hp -= 30;
        const before = char.hp;
        Character.monthlyHPRegen(char, job);
        expect(char.hp).toBeGreaterThan(before);
    });

    test('does not exceed max HP', () => {
        const char = makeChar();
        const job = { hpBonus: 100 };
        char.hp = Character.getHPMax(char, job); // already at max
        Character.monthlyHPRegen(char, job);
        expect(char.hp).toBeLessThanOrEqual(Character.getHPMax(char, job));
    });

    test('innerForce bonus increases regen', () => {
        const charLow  = makeChar();
        const charHigh = makeChar();
        charHigh.attributes.innerForce = 20;
        const job = { hpBonus: 100 };
        charLow.hp  = 50;
        charHigh.hp = 50;
        Character.monthlyHPRegen(charLow, job);
        Character.monthlyHPRegen(charHigh, job);
        expect(charHigh.hp).toBeGreaterThan(charLow.hp);
    });

    test('passive hpRegenBonus is applied', () => {
        const char = makeChar();
        char.passives = [{ hpRegenBonus: 20 }];
        const job = { hpBonus: 100 };
        char.hp = 50;
        const { total } = Character.monthlyHPRegen(char, job);
        expect(total).toBeGreaterThanOrEqual(30); // base 10 + passive 20
    });
});

describe('Character.healHP', () => {
    test('heals up to max HP', () => {
        const char = makeChar();
        const job = { hpBonus: 100 };
        const max = Character.getHPMax(char, job);
        char.hp = max - 5;
        Character.healHP(char, 100, job);
        expect(char.hp).toBe(max);
    });
});
