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

    // track: 'explore' | 'combat' | null
    playBGM(track) {
        if (track === this._bgmTrack) return;
        this._bgmTrack = track;
        if (this._bgm) { this._bgm.pause(); this._bgm.src = ''; this._bgm = null; }
        if (!track) return;
        const a = new window.Audio(`assets/audio/bgm/${track}.ogg`);
        a.loop = true;
        a.volume = this._muted ? 0 : this._bgmVol;
        this._bgm = a;
        a.play().catch(() => {});
    },

    stopBGM() { this.playBGM(null); },

    // id: filename without extension under assets/audio/sfx/
    playSFX(id) {
        if (this._muted) return;
        const a = new window.Audio(`assets/audio/sfx/${id}.ogg`);
        a.volume = this._sfxVol;
        a.play().catch(() => {});
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
