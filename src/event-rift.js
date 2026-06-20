'use strict';
// Active rift event behavior.
Object.assign(Game, {
  updateRiftEvent(ev, dt) {
    const p = this.player;
    const inside = dist2(p.x, p.y, ev.x, ev.y) < ev.r * ev.r;
    ev.hold += inside ? dt : -dt * 0.45;
    ev.hold = clamp(ev.hold, 0, 8.5);
    ev.spawnT -= dt;
    if (ev.spawnT <= 0) {
      ev.spawnT = 2.2;
      for (let i = 0; i < 3; i++) {
        const a = rand(0, TAU);
        this.spawnEnemy(i === 0 ? 'charger' : 'runner', ev.x + Math.cos(a) * rand(140, 210), ev.y + Math.sin(a) * rand(140, 210));
      }
    }
    if (ev.hold >= 8.5) this.completeEvent(ev, true);
    else if (ev.life <= 0) this.completeEvent(ev, false);
  },
});
