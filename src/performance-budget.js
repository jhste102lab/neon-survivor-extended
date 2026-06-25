'use strict';
// Runtime-only visual quality budget. It reacts to measured frame cost without changing simulation balance.
const PerformanceBudget = {
  emaMs: 0,
  peakMs: 0,
  longFrames: 0,
  frameCount: 0,
  pressure: 0,

  isMobile() {
    return typeof GameRuntime !== 'undefined' && GameRuntime.isMobileViewport();
  },

  recordFrame(ms) {
    const cost = Math.max(0, Number(ms) || 0);
    this.frameCount++;
    this.emaMs = this.emaMs ? this.emaMs * 0.92 + cost * 0.08 : cost;
    this.peakMs = Math.max(this.peakMs * 0.985, cost);
    if (cost > (this.isMobile() ? 33 : 50)) this.longFrames++;
    this.pressure = this.computePressure();
    return this.pressure;
  },

  computePressure() {
    const target = this.isMobile() ? 15.5 : 22;
    const emaK = clamp((this.emaMs - target) / target, 0, 1);
    const peakK = clamp((this.peakMs - target * 1.8) / (target * 4), 0, 1);
    const longK = clamp(this.longFrames / Math.max(12, this.frameCount) * 5, 0, 1);
    const lateK = typeof Game !== 'undefined' && Game.clarityK ? Game.clarityK() * (this.isMobile() ? 0.45 : 0.2) : 0;
    return clamp(Math.max(emaK, peakK * 0.85, longK) + lateK, 0, 1);
  },

  visualPressure() {
    return this.pressure || 0;
  },

  particleStride() {
    const p = this.visualPressure();
    if (p > 0.82) return 4;
    if (p > 0.58) return 3;
    if (p > 0.32) return 2;
    return 1;
  },

  fxMultiplier() {
    return lerp(1, this.isMobile() ? 0.36 : 0.58, this.visualPressure());
  },

  reset() {
    this.emaMs = 0;
    this.peakMs = 0;
    this.longFrames = 0;
    this.frameCount = 0;
    this.pressure = 0;
  },
};
globalThis.PerformanceBudget = PerformanceBudget;
