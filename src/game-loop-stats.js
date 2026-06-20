'use strict';
// Per-frame stat cache helper for Game.update.
Object.assign(Game, {
  cacheFrameStats() {
    const st = this.stat();
    this.st = st; // 핫패스(피해/드롭/경험치)에서 재계산 없이 사용
    return st;
  },
});

