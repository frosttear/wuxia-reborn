// Mock localStorage
const store = {};
global.localStorage = {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: k => { delete store[k]; },
};
// Mock Audio constructor so no real audio plays
global.window = { Audio: class { play() { return Promise.resolve(); } pause(){} } };

const { GameAudio } = require('../js/audio.js');

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); GameAudio._muted = false; GameAudio._bgm = null; GameAudio._bgmTrack = null; });

test('init reads muted preference from localStorage', () => {
    localStorage.setItem('wuxia_audio', JSON.stringify({ muted: true }));
    GameAudio.init();
    expect(GameAudio.isMuted()).toBe(true);
});

test('init defaults to unmuted when no preference saved', () => {
    GameAudio.init();
    expect(GameAudio.isMuted()).toBe(false);
});

test('toggleMute persists preference to localStorage', () => {
    GameAudio.toggleMute();
    expect(JSON.parse(localStorage.getItem('wuxia_audio')).muted).toBe(true);
    GameAudio.toggleMute();
    expect(JSON.parse(localStorage.getItem('wuxia_audio')).muted).toBe(false);
});

test('toggleMute returns new muted state', () => {
    expect(GameAudio.toggleMute()).toBe(true);
    expect(GameAudio.toggleMute()).toBe(false);
});
