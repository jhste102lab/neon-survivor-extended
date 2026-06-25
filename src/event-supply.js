'use strict';
// Active supply event behavior.
Object.assign(Game, {
  updateSupplyEvent(ev, dt) {
    const p = this.player;
    ev.hold += dist2(p.x, p.y, ev.x, ev.y) < ev.r * ev.r ? dt : -dt * 0.4;
    ev.hold = clamp(ev.hold, 0, 6.0);
    ev.hazardT -= dt;
    if (ev.hazardT <= 0) {
      ev.hazardT = 3.1;
      const a = rand(0, TAU);
      this.spawnHazard({
        kind: 'supply', x: ev.x + Math.cos(a) * rand(95, 150), y: ev.y + Math.sin(a) * rand(95, 150),
        r: 44, warn: 0.9, life: 4.6, dmg: 11, tick: 0.6,
        color: '#ff4d5e', source: 'event:supply', label: 'DANGER',
      });
    }
    if (ev.hold >= 6) this.completeEvent(ev, true);
    else if (ev.life <= 0) this.completeEvent(ev, false);
  },
});
