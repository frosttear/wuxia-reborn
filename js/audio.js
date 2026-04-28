// audio.js — BGM and SFX manager
// Uses HTML5 Audio. BGM loops; SFX are fire-and-forget clones.
// Falls back silently when autoplay is blocked or files are missing.

const GameAudio = {
    _bgm: null,
    _bgmTrack: null,
    _muted: false,
    _bgmVol: 0.38,
    _sfxVol: 0.62,

    init() {
        const saved = localStorage.getItem('wuxia_audio');
        if (saved) {
            try { this._muted = !!JSON.parse(saved).muted; } catch(e) {}
        }
    },

    // Audio disabled — no OGG files available yet.
    playBGM(_track) {},
    stopBGM()       {},
    playSFX(_id)    {},

    toggleMute() {
        this._muted = !this._muted;
        if (this._bgm) this._bgm.volume = this._muted ? 0 : this._bgmVol;
        localStorage.setItem('wuxia_audio', JSON.stringify({ muted: this._muted }));
        return this._muted;
    },

    isMuted() { return this._muted; },
};

if (typeof module !== 'undefined') module.exports = { GameAudio };
