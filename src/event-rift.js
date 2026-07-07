'use strict';
// Active dimension rift behavior.
Object.assign(Game, {
  updateRiftEvent(ev, dt) {
    const p = this.player;
    const dim = typeof DimensionRiftRules !== 'undefined' ? DimensionRiftRules.get(ev.dimension) : { enemyTypes: ['charger', 'runner'], spawnEvery: 2.2, holdGoal: 8.5 };
    const inside = dist2(p.x, p.y, ev.x, ev.y) < ev.r * ev.r;
    ev.hold += inside ? dt : -dt * 0.45;
    const holdGoal = dim.holdGoal || 8.5;
    ev.hold = clamp(ev.hold, 0, holdGoal);
    this.updateRiftSpawns(ev, dt, dim);
    this.updateRiftHazards(ev, dt, dim);
    if (ev.hold >= holdGoal) this.completeEvent(ev, true);
    else if (ev.life <= 0) this.completeEvent(ev, false);
  },

  updateRiftSpawns(ev, dt, dim) {
    ev.spawnT -= dt;
    if (ev.spawnT > 0) return;
    ev.spawnT = dim.spawnEvery || 2.2;
    const types = dim.enemyTypes || ['charger', 'runner'];
    for (let i = 0; i < 3; i++) {
      const a = rand(0, TAU);
      const type = i === 0 ? types[0] : pick(types);
      this.spawnEnemy(type, ev.x + Math.cos(a) * rand(140, 210), ev.y + Math.sin(a) * rand(140, 210));
    }
  },

  updateRiftHazards(ev, dt, dim) {
    ev.hazardT = Math.max(0, (ev.hazardT || 0) - dt);
    if (ev.hazardT > 0) return;
    if (dim.slime && this.spawnHazard) {
      ev.hazardT = 2.6;
      const a = rand(0, TAU), r = rand(20, ev.r * 0.82);
      this.spawnHazard({ kind: 'rift-slime', x: ev.x + Math.cos(a) * r, y: ev.y + Math.sin(a) * r, r: 44, warn: 0.45, life: 13, dmg: 4, tick: 0.9, slow: 0.42, color: dim.color, source: 'dimension:slime', label: 'SLOW' });
    } else if (dim.lasers && this.spawnLineHazard) {
      ev.hazardT = 3.3;
      const a = rand(0, TAU);
      const len = 640;
      const cx = ev.x + rand(-80, 80), cy = ev.y + rand(-80, 80);
      this.spawnLineHazard({ kind: 'rift-prism-laser', x1: cx - Math.cos(a) * len, y1: cy - Math.sin(a) * len, x2: cx + Math.cos(a) * len, y2: cy + Math.sin(a) * len, width: 18, warn: 0.9, life: 0.8, dmg: 14, tick: 1.0, color: dim.color, source: 'dimension:prism', label: 'RIFT' });
    } else {
      ev.hazardT = 3.8;
    }
  },
});
