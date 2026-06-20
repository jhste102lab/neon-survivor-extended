'use strict';
// Web Audio graph/context lifecycle for AudioFX. Does not own named sound recipes.
const AudioEngine = {
  shouldSkip() {
    return typeof Game !== 'undefined' && Game.test && Game.test.headless;
  },

  canAutoResume() {
    const paused = typeof Game !== 'undefined' && Game.state === 'pause';
    const hidden = typeof document !== 'undefined' && document.hidden;
    return !paused && !hidden;
  },

  ensure(audio) {
    if (this.shouldSkip()) return false;
    if (audio.ac) {
      if (this.canAutoResume()) audio.ac.resume();
      return true;
    }
    if (typeof window === 'undefined') return false;

    try {
      audio.ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return false;
    }

    this.createGraph(audio);
    audio._noiseBuf = this.makeNoise(audio.ac);
    if (typeof Music !== 'undefined') Music.init(this.musicGraph(audio));
    return true;
  },

  createGraph(audio) {
    audio.master = audio.ac.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.8;

    const comp = audio.ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 22;
    comp.ratio.value = 7;
    audio.master.connect(comp);
    comp.connect(audio.ac.destination);

    audio.sfxGain = audio.ac.createGain();
    audio.sfxGain.gain.value = 0.55;
    audio.sfxGain.connect(audio.master);

    audio.musGain = audio.ac.createGain();
    audio.musGain.gain.value = 0.3;
    audio.musGain.connect(audio.master);

    audio.delay = audio.ac.createDelay(0.6);
    audio.delay.delayTime.value = 0.246;
    audio.delayFb = audio.ac.createGain();
    audio.delayFb.gain.value = 0.34;
    audio.delayWet = audio.ac.createGain();
    audio.delayWet.gain.value = 0.4;
    audio.delay.connect(audio.delayFb);
    audio.delayFb.connect(audio.delay);
    audio.delay.connect(audio.delayWet);
    audio.delayWet.connect(audio.musGain);
  },

  makeNoise(ac) {
    const len = ac.sampleRate * 1;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = RNG.next() * 2 - 1;
    return buf;
  },

  suspend(audio) {
    if (audio.ac) audio.ac.suspend();
  },

  resume(audio) {
    if (audio.ac) audio.ac.resume();
  },

  musicGraph(audio) {
    return {
      ac: audio.ac,
      musGain: audio.musGain,
      delay: audio.delay,
      noiseBuffer: audio._noiseBuf,
      _noiseBuf: audio._noiseBuf,
    };
  },
};
