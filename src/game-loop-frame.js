'use strict';
// Frame timing helper for Game.update.
Object.assign(Game, {
  advanceFrameTiming(rdt) {
    this.frameSeq = (this.frameSeq || 0) + 1;
    if (this.hitStopT > 0) {
      this.hitStopT -= rdt;
      if (this.hitStopT <= 0) this.timeScale = 1;
    }
    const userScale = this.userTimeScale || 1;
    const dt = Math.min(rdt, 0.035) * this.timeScale * userScale;
    this.shakeT = Math.max(0, this.shakeT - rdt);
    return dt;
  },

  setUserTimeScale(scale) {
    const requested = Number(scale) || 1;
    const slowAllowed = this.time >= (CFG.slowSpeedUnlockTime || 480);
    this.userTimeScale = requested < 1 && !slowAllowed ? 1 : clamp(requested, 0.5, 3);
    if (typeof UI !== 'undefined' && UI.syncSpeedControls) UI.syncSpeedControls(this.userTimeScale);
  },
});
