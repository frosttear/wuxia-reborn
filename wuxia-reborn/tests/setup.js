// tests/setup.js - Global setup for all Jest tests
// Loads game modules in dependency order and stubs browser-only APIs

// ── Stub browser APIs ──────────────────────────────────────────────────────
global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; }
};

global.UI = {
    addLog: jest.fn(),
    renderAll: jest.fn(),
    renderCharacter: jest.fn(),
    updateControls: jest.fn(),
    showEvent: jest.fn(),
    addCombatSummary: jest.fn(),
    addIllustration: jest.fn(),
    getLogBuffer: jest.fn(() => []),
};

// ── Load game modules in dependency order ─────────────────────────────────
const { Character, BIRTH_MONTH_BONUSES } = require('../js/character.js');
global.Character = Character;
global.BIRTH_MONTH_BONUSES = BIRTH_MONTH_BONUSES;

const { NPCSystem } = require('../js/npc.js');
global.NPCSystem = NPCSystem;

const { Combat } = require('../js/combat.js');
global.Combat = Combat;

const { Rebirth, TALENTS } = require('../js/rebirth.js');
global.Rebirth = Rebirth;
global.TALENTS = TALENTS;

const { Engine } = require('../js/engine.js');
global.Engine = Engine;

// Reset Engine state before each test (called from individual test files if needed)
global.makeChar = (overrides = {}) => {
    const char = Character.create('测试', {}, []);
    char.ageMonths = 180; // age 15
    return Object.assign(char, overrides);
};
