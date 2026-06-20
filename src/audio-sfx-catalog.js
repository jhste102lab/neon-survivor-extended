'use strict';
// Named sound-effect recipes. Depends only on AudioFX low-level tone/noise primitives.
const AudioSfxCatalog = {
  shoot(audio) {
    if (Game.test && Game.test.noFx) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - audio._lastShoot < 45) return;
    audio._lastShoot = now;
    audio.tone({ f: rand(800, 950), f2: 380, type: 'square', dur: 0.07, vol: 0.05 });
  },

  hit(audio) {
    audio.noise({ dur: 0.05, vol: 0.07, type: 'highpass', f: 2200 });
  },

  enemyDie(audio) {
    if (Game.test && Game.test.noFx) return;
    audio.tone({ f: rand(320, 400), f2: 70, type: 'triangle', dur: 0.14, vol: 0.1 });
    audio.noise({ dur: 0.07, vol: 0.06, type: 'bandpass', f: 900, q: 2 });
  },

  gem(audio, streak) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5];
    const f = scale[Math.min(streak, 28) % 8 + (streak > 12 ? 0 : 0)] * (streak > 16 ? 2 : 1);
    audio.tone({ f, type: 'sine', dur: 0.09, vol: 0.07 });
  },

  levelup(audio) {
    const seq = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    seq.forEach((f, i) => audio.tone({ f, type: 'triangle', dur: 0.22, vol: 0.14, when: i * 0.07 }));
    audio.noise({ dur: 0.5, vol: 0.05, type: 'highpass', f: 4000, when: 0.1 });
  },

  hurt(audio) {
    audio.tone({ f: 160, f2: 55, type: 'sawtooth', dur: 0.22, vol: 0.24 });
    audio.noise({ dur: 0.12, vol: 0.14, type: 'lowpass', f: 700 });
  },

  nova(audio) {
    audio.noise({ dur: 0.4, vol: 0.16, type: 'lowpass', f: 300, slide: 3500 });
  },

  lightning(audio) {
    audio.noise({ dur: 0.16, vol: 0.2, type: 'highpass', f: 1400 });
    audio.tone({ f: 1800, f2: 200, type: 'sawtooth', dur: 0.12, vol: 0.07 });
  },

  laser(audio) {
    audio.tone({ f: 1500, f2: 180, type: 'sawtooth', dur: 0.3, vol: 0.12 });
  },

  missile(audio) {
    audio.noise({ dur: 0.25, vol: 0.08, type: 'bandpass', f: 600, slide: 1800, q: 2 });
  },

  boom(audio) {
    audio.tone({ f: 120, f2: 35, type: 'sine', dur: 0.35, vol: 0.26 });
    audio.noise({ dur: 0.3, vol: 0.16, type: 'lowpass', f: 900, slide: 120 });
  },

  pickup(audio) {
    [880, 1318.5].forEach((f, i) => audio.tone({ f, type: 'sine', dur: 0.12, vol: 0.12, when: i * 0.07 }));
  },

  chest(audio) {
    [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => audio.tone({ f, type: 'square', dur: 0.16, vol: 0.09, when: i * 0.09 }));
  },

  bossWarn(audio) {
    for (let i = 0; i < 3; i++) {
      audio.tone({ f: 440, type: 'square', dur: 0.16, vol: 0.13, when: i * 0.42 });
      audio.tone({ f: 311, type: 'square', dur: 0.16, vol: 0.13, when: i * 0.42 + 0.2 });
    }
  },

  uiClick(audio) {
    audio.tone({ f: 700, f2: 1000, type: 'sine', dur: 0.06, vol: 0.1 });
  },

  death(audio) {
    [392, 311.1, 261.6, 196].forEach((f, i) => audio.tone({ f, type: 'triangle', dur: 0.4, vol: 0.16, when: i * 0.21 }));
  },

  win(audio) {
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      audio.tone({ f, type: 'triangle', dur: 0.3, vol: 0.15, when: i * 0.13 }));
  },
};
