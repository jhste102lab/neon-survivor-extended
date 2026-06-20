'use strict';
// Frame update orchestration and title ambient update.
Object.assign(Game, {
  /* ---------- 메인 업데이트 ---------- */

  update(rdt) {
    const dt = this.advanceFrameTiming(rdt);

    if (this.state === 'title') { this.updateAmbient(rdt); return; }
    if (this.state !== 'play') return;

    GameLoopPhases.runPlayFrame(this, dt, rdt);
  },

  updateAmbient(dt) { // 타이틀 화면 배경 연출
    this.cam.x += 26 * dt;
    if (RNG.next() < 0.12) {
      const c = pick(['#19e3ff', '#ff2bd6', '#a36bff', '#3dff8e']);
      this.spawnParticle(this.cam.x + rand(-700, 700), this.cam.y + rand(-450, 450),
        rand(-14, 14), rand(-22, -6), rand(2.5, 5), rand(4, 13), c, 0);
    }
    this.updateFX(dt);
  },
});

