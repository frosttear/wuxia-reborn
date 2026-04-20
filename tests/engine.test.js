// tests/engine.test.js - Unit tests for Engine logic (checkConditions, chain system)

const fs = require('fs');
const path = require('path');
const CHAINS = require('../data/chains.json').chains;

function resetEngine(charOverrides = {}) {
    Engine.state.char = makeChar(charOverrides);
    Engine.state.chains = CHAINS;
    Engine.state.gamePhase = 'idle';
    Engine.state.pendingChoice = null;
    Engine.state.pendingChainStep = null;
    // Clear jest mocks
    UI.addLog.mockClear();
    UI.renderAll.mockClear();
}

// ── checkConditions ────────────────────────────────────────────────────────

describe('Engine.checkConditions', () => {
    beforeEach(() => resetEngine());

    test('empty conditions always pass', () => {
        expect(Engine.checkConditions({})).toBe(true);
    });

    test('minAgeYears: passes when met', () => {
        expect(Engine.checkConditions({ minAgeYears: 15 })).toBe(true);
    });

    test('minAgeYears: fails when not met', () => {
        expect(Engine.checkConditions({ minAgeYears: 16 })).toBe(false);
    });

    test('maxAgeYears: passes when within range', () => {
        expect(Engine.checkConditions({ maxAgeYears: 19 })).toBe(true);
    });

    test('maxAgeYears: fails when exceeded', () => {
        Engine.state.char.ageMonths = 228; // age 19
        expect(Engine.checkConditions({ maxAgeYears: 18 })).toBe(false);
    });

    test('minAttributes: passes when all met', () => {
        Engine.state.char.attributes.strength = 10;
        expect(Engine.checkConditions({ minAttributes: { strength: 10 } })).toBe(true);
    });

    test('minAttributes: fails when one not met', () => {
        Engine.state.char.attributes.strength = 5;
        expect(Engine.checkConditions({ minAttributes: { strength: 10 } })).toBe(false);
    });

    test('flags: passes when required flag is true', () => {
        Engine.state.char.flags.tianmo_sign1 = true;
        expect(Engine.checkConditions({ flags: { tianmo_sign1: true } })).toBe(true);
    });

    test('flags: fails when required flag is absent', () => {
        expect(Engine.checkConditions({ flags: { tianmo_sign1: true } })).toBe(false);
    });

    test('flags: passes when required flag is false and absent', () => {
        expect(Engine.checkConditions({ flags: { some_flag: false } })).toBe(true);
    });

    test('multiple conditions: all must pass', () => {
        Engine.state.char.attributes.innerForce = 12;
        Engine.state.char.flags.tianmo_sign2 = true;
        expect(Engine.checkConditions({
            flags: { tianmo_sign2: true },
            minAttributes: { innerForce: 12 }
        })).toBe(true);
    });

    test('multiple conditions: fails if one fails', () => {
        Engine.state.char.attributes.innerForce = 8;
        Engine.state.char.flags.tianmo_sign2 = true;
        expect(Engine.checkConditions({
            flags: { tianmo_sign2: true },
            minAttributes: { innerForce: 12 }
        })).toBe(false);
    });
});

// ── getAvailableChainSteps ─────────────────────────────────────────────────

describe('Engine.getAvailableChainSteps', () => {
    beforeEach(() => resetEngine());

    test('returns first step of tianmo_harbinger at age 16', () => {
        Engine.state.char.ageMonths = 192; // 16 years old
        const steps = Engine.getAvailableChainSteps();
        const found = steps.find(s => s.chain.id === 'tianmo_harbinger');
        expect(found).toBeDefined();
        expect(found.stepIdx).toBe(0);
    });

    test('does not return tianmo_harbinger before age 16', () => {
        Engine.state.char.ageMonths = 180; // 15 years old
        const steps = Engine.getAvailableChainSteps();
        const found = steps.find(s => s.chain.id === 'tianmo_harbinger');
        expect(found).toBeUndefined();
    });

    test('does not return chains that are done', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 'done';
        const steps = Engine.getAvailableChainSteps();
        expect(steps.find(s => s.chain.id === 'tianmo_harbinger')).toBeUndefined();
    });

    test('returns step 1 when progress=1 and its conditions are met', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 1;
        Engine.state.char.flags.tianmo_sign1 = true;
        Engine.state.char.ageMonths = 192; // age 16 ✓
        const steps = Engine.getAvailableChainSteps();
        const found = steps.find(s => s.chain.id === 'tianmo_harbinger');
        expect(found).toBeDefined();
        expect(found.stepIdx).toBe(1);
    });

    test('does not return step 2 when conditions not met (innerForce too low)', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 2;
        Engine.state.char.flags.tianmo_sign2 = true;
        Engine.state.char.attributes.innerForce = 5; // needs 12
        const steps = Engine.getAvailableChainSteps();
        expect(steps.find(s => s.chain.id === 'tianmo_harbinger')).toBeUndefined();
    });

    test('jianghu_chaos chain: not available without enough reputation', () => {
        Engine.state.char.attributes.reputation = 5; // needs 8
        const steps = Engine.getAvailableChainSteps();
        expect(steps.find(s => s.chain.id === 'jianghu_chaos')).toBeUndefined();
    });

    test('jianghu_chaos chain: available with enough reputation', () => {
        Engine.state.char.attributes.reputation = 8;
        const steps = Engine.getAvailableChainSteps();
        expect(steps.find(s => s.chain.id === 'jianghu_chaos')).toBeDefined();
    });
});

// ── completeChainStep ──────────────────────────────────────────────────────

describe('Engine.completeChainStep', () => {
    beforeEach(() => resetEngine());

    test('advances chainProgress to next step index', () => {
        Engine.completeChainStep('tianmo_harbinger', 0);
        expect(Engine.state.char.chainProgress.tianmo_harbinger).toBe(1);
    });

    test('sets onComplete flags from step definition', () => {
        Engine.completeChainStep('tianmo_harbinger', 0);
        expect(Engine.state.char.flags.tianmo_sign1).toBe(true);
    });

    test('step 1 completion sets tianmo_sign2', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 1;
        Engine.completeChainStep('tianmo_harbinger', 1);
        expect(Engine.state.char.flags.tianmo_sign2).toBe(true);
        expect(Engine.state.char.chainProgress.tianmo_harbinger).toBe(2);
    });

    test('completing last step marks chain as done', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 2;
        Engine.completeChainStep('tianmo_harbinger', 2);
        expect(Engine.state.char.chainProgress.tianmo_harbinger).toBe('done');
    });

    test('completing last step applies chain completion reward attributes', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 2;
        Engine.state.char.attributes.luck = 0;        // prevent lucky-double trigger
        Engine.completeChainStep('tianmo_harbinger', 2);
        expect(Engine.state.char.attributes.innerForce).toBe(6);
    });

    test('completing last step sets completion flags', () => {
        Engine.state.char.chainProgress.tianmo_harbinger = 2;
        Engine.completeChainStep('tianmo_harbinger', 2);
        expect(Engine.state.char.flags.tianmo_trace_known).toBe(true);
    });
});

// ── applyEffects ───────────────────────────────────────────────────────────

describe('Engine.applyEffects', () => {
    beforeEach(() => resetEngine());

    test('applies npcAffinity changes', () => {
        NPCSystem.initRelationships(Engine.state.char, [{ id: 'mysterious_elder' }]);
        Engine.applyEffects({ npcAffinity: { mysterious_elder: 10 } });
        expect(NPCSystem.getAffinity(Engine.state.char, 'mysterious_elder')).toBe(10);
    });

    test('applies flag changes', () => {
        Engine.applyEffects({ flags: { test_flag: true } });
        expect(Engine.state.char.flags.test_flag).toBe(true);
    });

    test('handles empty effects without error', () => {
        expect(() => Engine.applyEffects({})).not.toThrow();
        expect(() => Engine.applyEffects(null)).not.toThrow();
    });

    test('applies HP delta', () => {
        const char = Engine.state.char;
        const max = Character.getHPMax(char, null); // constitution*20 with no job
        char.hp = max - 20;
        const before = char.hp;
        Engine.applyEffects({ hp: 10 });
        expect(char.hp).toBeGreaterThan(before);
    });
});

// ── migrateChar ────────────────────────────────────────────────────────────

describe('Engine.migrateChar', () => {
    test('adds chainProgress to old save without it', () => {
        const oldChar = makeChar();
        delete oldChar.chainProgress;
        Engine.migrateChar(oldChar);
        expect(oldChar.chainProgress).toEqual({});
    });

    test('does not overwrite existing chainProgress', () => {
        const char = makeChar();
        char.chainProgress = { tianmo_harbinger: 1 };
        Engine.migrateChar(char);
        expect(char.chainProgress.tianmo_harbinger).toBe(1);
    });

});
