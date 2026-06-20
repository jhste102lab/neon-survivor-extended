'use strict';
// Active storm event behavior.
Object.assign(Game, {
  updateStormEvent(ev, dt) {
    ev.hazardT -= dt;
    if (ev.hazardT <= 0) {
      ev.hazardT = 2.25;
      const p = this.player;
      const base = rand(0, TAU);
      const n = 7 + Math.min(5, Math.floor((this.time - (CFG.unlockTime || CFG.winTime)) / 220));
      for (let i = 0; i < n; i++) {
        const a = base + i / n * TAU;
        this.spawnEnemyBullet(p.x + Math.cos(a) * 360, p.y + Math.sin(a) * 360, -Math.cos(a) * 160, -Math.sin(a) * 160,
          { r: 8, dmg: 10, life: 3.3, kind: 'storm', source: 'event:storm' });
      }
      GameRuntime.playSound('shoot');
    }
    if (ev.life <= 0) this.completeEvent(ev, true);
  },
});
