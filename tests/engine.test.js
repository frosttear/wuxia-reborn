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

// ── allBondsComplete ───────────────────────────────────────────────────────

describe('Engine.allBondsComplete', () => {
    const NPC_IDS = ['wang_tie', 'li_yunshu', 'mysterious_elder', 'yan_chixing', 'ling_xue', 'su_qing'];

    function setupBonds(bondLevels) {
        const char = makeChar({ bondLevels });
        Engine.state.char = char;
        // bonds: each NPC has 5 chapters
        Engine.state.bonds = Object.fromEntries(NPC_IDS.map(id => [id, [1, 2, 3, 4, 5]]));
    }

    test('returns true when all NPCs are at max bond level', () => {
        const levels = Object.fromEntries(NPC_IDS.map(id => [id, 5]));
        setupBonds(levels);
        expect(Engine.allBondsComplete(Engine.state.char)).toBe(true);
    });

    test('returns false when one NPC is below max', () => {
        const levels = Object.fromEntries(NPC_IDS.map(id => [id, 5]));
        levels['su_qing'] = 4;
        setupBonds(levels);
        expect(Engine.allBondsComplete(Engine.state.char)).toBe(false);
    });

    test('returns false when no bonds have been formed', () => {
        setupBonds({});
        expect(Engine.allBondsComplete(Engine.state.char)).toBe(false);
    });
});

// ── selectEvents rebirth boost ─────────────────────────────────────────────

describe('selectEvents rebirth weight boost', () => {
    const meetEvent = {
        id: 'meet_wang_tie', type: '交友', weight: 8,
        conditions: { flags: { met_wang_tie: false } }
    };
    const regularEvent = {
        id: 'train_basic', type: '磨练', weight: 8,
        conditions: {}
    };

    function countPicks(rebirthCount, runs = 2000) {
        const char = makeChar({ rebirthCount });
        char.flags.met_wang_tie = false;
        Engine.state.char = char;
        Engine.state.events = [meetEvent, regularEvent];
        Engine.state.seenEvents = new Set();
        let meetPicks = 0;
        for (let i = 0; i < runs; i++) {
            Engine.state.seenEvents = new Set();
            const picked = Engine.selectEvents();
            if (picked.length && picked[0].id === 'meet_wang_tie') meetPicks++;
        }
        return meetPicks / runs;
    }

    test('cycle 1 picks unmet-NPC event more often than cycle 0', () => {
        const rate0 = countPicks(0);
        const rate1 = countPicks(1);
        // cycle 1: weight 12 vs 8 → ~60%. cycle 0: weight 8 vs 8 → ~50%.
        expect(rate1).toBeGreaterThan(rate0);
    });

    test('cycle 3 picks unmet-NPC event more often than cycle 1', () => {
        const rate1 = countPicks(1);
        const rate3 = countPicks(3);
        expect(rate3).toBeGreaterThan(rate1);
    });

    test('already-met NPC event gets no rebirth boost', () => {
        const char = makeChar({ rebirthCount: 3 });
        char.flags.met_wang_tie = true; // already met
        Engine.state.char = char;
        Engine.state.events = [meetEvent, regularEvent];
        Engine.state.seenEvents = new Set();
        // Event should be filtered out by checkConditions (flags: {met_wang_tie: false} fails)
        let found = false;
        for (let i = 0; i < 200; i++) {
            Engine.state.seenEvents = new Set();
            const picked = Engine.selectEvents();
            if (picked.length && picked[0].id === 'meet_wang_tie') { found = true; break; }
        }
        expect(found).toBe(false);
    });
});

// ── wuxiang_sword chain unlock (no hidden_boss_beaten required) ────────────

describe('wuxiang_sword chain unlock', () => {
    const NPC_IDS = ['wang_tie', 'li_yunshu', 'mysterious_elder', 'yan_chixing', 'ling_xue', 'su_qing'];

    beforeEach(() => {
        resetEngine();
        Engine.state.bonds = Object.fromEntries(NPC_IDS.map(id => [id, [1, 2, 3, 4, 5]]));
    });

    test('step 0 unlocks with all 6 bonds at level 5 (no hidden_boss_beaten needed)', () => {
        const levels = Object.fromEntries(NPC_IDS.map(id => [id, 5]));
        Engine.state.char.bondLevels = levels;
        const steps = Engine.getAvailableChainSteps();
        const found = steps.find(s => s.chain.id === 'wuxiang_sword');
        expect(found).toBeDefined();
        expect(found.stepIdx).toBe(0);
    });

    test('step 0 does not unlock without all bonds at level 5', () => {
        const levels = Object.fromEntries(NPC_IDS.map(id => [id, 5]));
        levels['su_qing'] = 4; // one short
        Engine.state.char.bondLevels = levels;
        const steps = Engine.getAvailableChainSteps();
        expect(steps.find(s => s.chain.id === 'wuxiang_sword')).toBeUndefined();
    });

    test('step 0 unlocks even without hidden_boss_beaten flag', () => {
        const levels = Object.fromEntries(NPC_IDS.map(id => [id, 5]));
        Engine.state.char.bondLevels = levels;
        Engine.state.char.flags.hidden_boss_beaten = false;
        const steps = Engine.getAvailableChainSteps();
        expect(steps.find(s => s.chain.id === 'wuxiang_sword')).toBeDefined();
    });
});

// ── bondRetryStep memory ───────────────────────────────────────────────────

describe('bondRetryStep memory', () => {
    beforeEach(() => resetEngine());

    test('migrateChar adds bondRetryStep to old saves', () => {
        const char = makeChar();
        delete char.bondRetryStep;
        Engine.migrateChar(char);
        expect(char.bondRetryStep).toEqual({});
    });

    test('migrateChar does not overwrite existing bondRetryStep', () => {
        const char = makeChar();
        char.bondRetryStep = { wang_tie_1: 2 };
        Engine.migrateChar(char);
        expect(char.bondRetryStep.wang_tie_1).toBe(2);
    });

    test('_completeBond clears retry key for that bond', () => {
        const char = Engine.state.char;
        char.bondRetryStep = { wang_tie_1: 1 };
        char.bondLevels = {};
        char.bondEventsDone = {};
        char.passives = [];
        // Two levels so level 1 < maxLevel — avoids the illustration path
        Engine.state.bonds = { wang_tie: [{ level: 1, passive: null }, { level: 2, passive: null }] };
        Engine.state.npcs = [{ id: 'wang_tie', name: '王铁' }];
        Engine._completeBond({ npcId: 'wang_tie', level: 1 });
        expect(char.bondRetryStep['wang_tie_1']).toBeUndefined();
    });

    test('_completeBond leaves other retry keys untouched', () => {
        const char = Engine.state.char;
        char.bondRetryStep = { wang_tie_1: 1, li_yunshu_2: 0 };
        char.bondLevels = {};
        char.bondEventsDone = {};
        char.passives = [];
        Engine.state.bonds = { wang_tie: [{ level: 1, passive: null }, { level: 2, passive: null }] };
        Engine.state.npcs = [{ id: 'wang_tie', name: '王铁' }];
        Engine._completeBond({ npcId: 'wang_tie', level: 1 });
        expect(char.bondRetryStep['li_yunshu_2']).toBe(0);
    });
});

// ── iron_constitution talent ───────────────────────────────────────────────

describe('iron_constitution talent', () => {
    test('adds 15% to max HP', () => {
        const charWith    = Character.create('Test', {}, ['iron_constitution']);
        const charWithout = Character.create('Test', {}, []);
        const hpWith    = Character.getHPMax(charWith, null);
        const hpWithout = Character.getHPMax(charWithout, null);
        expect(hpWith).toBeGreaterThan(hpWithout);
        expect(Math.abs(hpWith / hpWithout - 1.15)).toBeLessThan(0.02);
    });
});

// ── wind_step talent ───────────────────────────────────────────────────────

describe('wind_step talent', () => {
    test('adds 0.20 to flee chance', () => {
        const char  = Character.create('Test', {}, ['wind_step']);
        char.ageMonths = 180;
        const enemy = { id: 'bandit', name: '山贼', hp: 30, attack: 5, defense: 2, comprehension: 5 };
        const cs = Combat.initState(char, enemy, null);
        expect(cs.fleeChance).toBeCloseTo(0.45, 2);
    });
});

// ── _checkAndAutoPromote ───────────────────────────────────────────────────

describe('_checkAndAutoPromote', () => {
    beforeEach(() => resetEngine());

    test('promotes char when job unlock conditions are met', () => {
        const char = Engine.state.char;
        // Give the char enough attributes to unlock the first available job
        const jobs = Engine.state.jobs;
        const unlockable = jobs.find(j => j.id !== char.job && j.requires);
        if (!unlockable) return; // no job to unlock, skip
        // Meet requirements
        if (unlockable.requires.minAttributes) {
            for (const [attr, val] of Object.entries(unlockable.requires.minAttributes)) {
                char.attributes[attr] = val;
            }
        }
        Engine._checkAndAutoPromote();
        expect(char.job).toBe(unlockable.id);
    });

    test('does nothing when no new jobs are unlocked', () => {
        const char = Engine.state.char;
        const originalJob = char.job;
        Engine._checkAndAutoPromote();
        expect(char.job).toBe(originalJob);
    });
});
