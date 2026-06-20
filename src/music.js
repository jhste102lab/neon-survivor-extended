'use strict';
// Background music step sequencer.
/* ----- 배경 음악: 스텝 시퀀서 ----- */
const Music = {
  graph: null, playing: false, step: 0, nextTime: 0, timer: null,
  bpm: 116, intensity: 1,
  // A minor: Am F C G — 코드별 루트 미디값
  chords: [
    [57, 60, 64], // Am
    [53, 57, 60], // F
    [48, 52, 55], // C
    [55, 59, 62], // G
  ],
  init(graph) { this.graph = graph; },
  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  start() {
    if ((Game.test && Game.test.noFx) || !this.graph || !this.graph.ac || this.playing) return;
    this.playing = true; this.step = 0;
    this.nextTime = this.graph.ac.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 40);
  },
  stop() { this.playing = false; if (this.timer) clearInterval(this.timer); this.timer = null; },
  tick() {
    if (!this.playing) return;
    const ac = this.graph.ac, spb = 60 / this.bpm, s16 = spb / 4;
    if (ac.state !== 'running') return; // 정지 중엔 예약하지 않음
    // 백그라운드 스로틀/일시정지 후 밀린 음표를 몰아서 재생하지 않도록 점프
    if (this.nextTime < ac.currentTime - 0.05) this.nextTime = ac.currentTime + 0.05;
    while (this.nextTime < ac.currentTime + 0.18) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += s16;
      this.step = (this.step + 1) % 64; // 4마디 루프
    }
  },
  inst(f, type, t0, dur, vol, dest, fLp) {
    const ac = this.graph.ac;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    let node = o;
    if (fLp) { const flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = fLp; o.connect(flt); node = flt; }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g); g.connect(dest || this.graph.musGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  kick(t0) {
    const ac = this.graph.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.16);
    g.gain.setValueAtTime(0.5, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
    o.connect(g); g.connect(this.graph.musGain); o.start(t0); o.stop(t0 + 0.3);
  },
  noiseHit(t0, dur, vol, f, type) {
    const ac = this.graph.ac;
    const src = ac.createBufferSource(); src.buffer = this.graph.noiseBuffer || this.graph._noiseBuf;
    const flt = ac.createBiquadFilter(); flt.type = type || 'highpass'; flt.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(this.graph.musGain);
    src.start(t0); src.stop(t0 + dur + 0.02);
  },
  schedule(step, t0) {
    const bar = (step / 16) | 0, beat = (step % 16) / 4, s16 = (60 / this.bpm) / 4;
    const chord = this.chords[bar], root = chord[0], lvl = this.intensity;
    // kick: 4분음표
    if (step % 4 === 0) this.kick(t0);
    // hat: 8분 오프비트
    if (step % 2 === 0 && (step % 4 === 2)) this.noiseHit(t0, 0.04, lvl >= 2 ? 0.09 : 0.05, 6500);
    // snare: 2,4박 (강도2+)
    if (lvl >= 2 && (step % 16 === 4 || step % 16 === 12)) this.noiseHit(t0, 0.12, 0.16, 1700, 'bandpass');
    // bass: 8분음표 루트 (마지막 8분은 5도)
    if (step % 2 === 0) {
      const n = (step % 16 === 14) ? root + 7 : root;
      this.inst(this.midi(n - 12), 'sawtooth', t0, s16 * 1.8, 0.21, null, 380 + lvl * 100);
    }
    // pad: 코드 시작에 화음
    if (step % 16 === 0) {
      for (const n of chord) this.inst(this.midi(n), 'triangle', t0, s16 * 15, 0.05);
      this.inst(this.midi(root + 12), 'sine', t0, s16 * 15, 0.03);
    }
    // arp: 16분 (강도2+), 딜레이로 공간감
    if (lvl >= 2) {
      const pat = [0, 1, 2, 3, 2, 1]; // 코드톤 위아래
      const tones = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24];
      if (step % 2 === (lvl >= 3 ? 0 : 1)) {
        const n = tones[pat[(step >> 1) % pat.length]];
        const ac = this.graph.ac, o = ac.createOscillator(), g = ac.createGain();
        o.type = 'square'; o.frequency.value = this.midi(n + (lvl >= 3 ? 12 : 0));
        g.gain.setValueAtTime(0.045, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
        o.connect(g); g.connect(this.graph.musGain); g.connect(this.graph.delay);
        o.start(t0); o.stop(t0 + 0.15);
      }
    }
  },
  setIntensity(n) { this.intensity = clamp(n, 1, 3); },
};
