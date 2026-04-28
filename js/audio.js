// audio.js — BGM and SFX manager
// Uses HTML5 Audio. BGM loops; SFX are fire-and-forget clones.
// Falls back silently when autoplay is blocked or files are missing.
// _enabled is false until audio assets are available; flip to true to activate.

const GameAudio = {
    _bgm: null,
    _bgmTrack: null,
    _muted: false,
    _enabled: false,
    _bgmVol: 0.38,
    _sfxVol: 0.62,

    init() {
        const saved = localStorage.getItem('wuxia_audio');
        if (saved) {
            try { this._muted = !!JSON.parse(saved).muted; } catch(e) {}
        }
    },

    playBGM(track) {
        if (!this._enabled) return;
        if (this._bgmTrack === track && this._bgm && !this._bgm.paused) return;
        this.stopBGM();
        this._bgmTrack = track;
        this._bgm = new Audio(`assets/audio/${track}.ogg`);
        this._bgm.loop = true;
        this._bgm.volume = this._muted ? 0 : this._bgmVol;
        this._bgm.play().catch(() => {});
    },

    stopBGM() {
        if (!this._bgm) return;
        this._bgm.pause();
        this._bgm.src = '';
        this._bgm = null;
        this._bgmTrack = null;
    },

    playSFX(id) {
        if (!this._enabled || this._muted) return;
        const sfx = new Audio(`assets/audio/sfx/${id}.ogg`);
        sfx.volume = this._sfxVol;
        sfx.play().catch(() => {});
    },

    toggleMute() {
        this._muted = !this._muted;
        if (this._bgm) this._bgm.volume = this._muted ? 0 : this._bgmVol;
        localStorage.setItem('wuxia_audio', JSON.stringify({ muted: this._muted }));
        return this._muted;
    },

    isMuted() { return this._muted; },
};

if (typeof module !== 'undefined') module.exports = { GameAudio };
