'use strict';
// AudioFX public facade: graph lifecycle + low-level primitives + named SFX wrappers.
/* ================================================================
   오디오 엔진 — Web Audio 합성 (외부 파일 없음)
   ================================================================ */
const AudioFX = {
  ac: null, master: null, sfxGain: null, musGain: null,
  delay: null, delayFb: null, delayWet: null,
  muted: false, started: false,
  _lastShoot: 0,
  _noiseBuf: null,

  ensure() {
    if (typeof AudioEngine === 'undefined') throw new Error('AudioEngine missing. Load audio-engine.js before audio-fx.js.');
    return AudioEngine.ensure(this);
  },

  // suspend/resume는 비동기 전환이라 state 검사로 가드하면 레이스가 생김 — 무조건 호출(중복은 no-op)
  suspendCtx() { AudioEngine.suspend(this); },
  resumeCtx() { AudioEngine.resume(this); },

  setMuted(m) {
    AudioMuteState.apply(this, !!m);
  },
  applyPersistedMute() {
    AudioMuteState.apply(this, AudioMuteState.load());
  },
  musicGraph() {
    return AudioEngine.musicGraph(this);
  },
  toggleMute() { this.setMuted(!this.muted); },

  // 기본 톤 발생기
  tone({ f = 440, f2 = null, type = 'sine', dur = 0.1, vol = 0.2, at = 0.005, curve = 'exp', when = 0 }) {
    if ((Game.test && Game.test.noFx) || !this.ac || this.muted) return;
    const t0 = this.ac.currentTime + when;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2 !== null) {
      if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
      else o.frequency.linearRampToValueAtTime(f2, t0 + dur);
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise({ dur = 0.1, vol = 0.2, type = 'highpass', f = 1000, q = 1, slide = null, when = 0 }) {
    if ((Game.test && Game.test.noFx) || !this.ac || this.muted || !this._noiseBuf) return;
    const t0 = this.ac.currentTime + when;
    const src = this.ac.createBufferSource(); src.buffer = this._noiseBuf; src.loop = true;
    const flt = this.ac.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t0); flt.Q.value = q;
    if (slide) flt.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    const g = this.ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(this.sfxGain);
    src.start(t0); src.stop(t0 + dur + 0.05);
  },

  sfx(name, ...args) {
    if (typeof AudioSfxCatalog === 'undefined' || typeof AudioSfxCatalog[name] !== 'function') {
      throw new Error(`Audio SFX recipe missing: ${name}`);
    }
    return AudioSfxCatalog[name](this, ...args);
  },

  /* ----- 효과음 ----- */
  shoot() { return this.sfx('shoot'); },
  hit() { return this.sfx('hit'); },
  enemyDie() { return this.sfx('enemyDie'); },
  gem(streak) { return this.sfx('gem', streak); },
  levelup() { return this.sfx('levelup'); },
  hurt() { return this.sfx('hurt'); },
  nova() { return this.sfx('nova'); },
  lightning() { return this.sfx('lightning'); },
  laser() { return this.sfx('laser'); },
  missile() { return this.sfx('missile'); },
  boom() { return this.sfx('boom'); },
  pickup() { return this.sfx('pickup'); },
  chest() { return this.sfx('chest'); },
  bossWarn() { return this.sfx('bossWarn'); },
  uiClick() { return this.sfx('uiClick'); },
  death() { return this.sfx('death'); },
  win() { return this.sfx('win'); },
};
