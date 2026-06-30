'use strict';
// Hazard runtime: creation, lifetime, and player contact damage.
Object.assign(Game, {
  spawnHazard(opts) {
    if (!opts) return null;
    while (this.hazards.length >= CFG.maxHazards) this.hazards.shift();
    const h = {
      kind: opts.kind || 'hazard',
      x: opts.x, y: opts.y, r: opts.r || 50,
      warn: opts.warn || 0, maxWarn: opts.warn || 0, life: opts.life || 3, maxLife: opts.life || 3,
      dmg: opts.dmg == null ? 10 : opts.dmg, tick: 0, tickEvery: opts.tick || 0.55,
      color: opts.color || '#ff4d5e', source: opts.source || 'hazard', label: opts.label || '',
      bypassInvuln: !!opts.bypassInvuln,
    };
    this.hazards.push(h);
    return h;
  },

  spawnLineHazard(opts) {
    if (!opts) return null;
    while (this.hazards.length >= CFG.maxHazards) this.hazards.shift();
    const h = {
      kind: opts.kind || 'line-hazard',
      shape: 'line',
      x1: opts.x1, y1: opts.y1, x2: opts.x2, y2: opts.y2,
      x: (opts.x1 + opts.x2) / 2, y: (opts.y1 + opts.y2) / 2,
      width: opts.width || 26, r: opts.width || 26,
      warn: opts.warn || 0, maxWarn: opts.warn || 0, life: opts.life || 1.7, maxLife: opts.life || 1.7,
      dmg: opts.dmg || 18, tick: 0, tickEvery: opts.tick || 1.0,
      color: opts.color || '#ff4d5e', source: opts.source || 'hazard:line', label: opts.label || 'LASER',
      bypassInvuln: !!opts.bypassInvuln,
    };
    this.hazards.push(h);
    if (this.markMajorDanger) this.markMajorDanger((opts.warn || 0) + (opts.life || 1.7), h.source);
    return h;
  },

  pointLineDistance2(px, py, h) {
    const ax = h.x1, ay = h.y1, bx = h.x2, by = h.y2;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
    const x = ax + dx * t, y = ay + dy * t;
    return dist2(px, py, x, y);
  },

  updateHazards(dt) {
    const p = this.player;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      if (h.warn > 0) h.warn -= dt;
      h.tick -= dt;
      if (h.life <= 0) { this.hazards.splice(i, 1); continue; }
      const canTickPlayer = !p.dead && (p.invuln <= 0 || h.bypassInvuln);
      const hit = h.shape === 'line'
        ? this.pointLineDistance2(p.x, p.y, h) < (h.width * 0.5 + CFG.player.radius) ** 2
        : dist2(p.x, p.y, h.x, h.y) < (h.r + CFG.player.radius) * (h.r + CFG.player.radius);
      if (h.warn <= 0 && canTickPlayer && h.tick <= 0 && hit) {
        h.tick = h.tickEvery;
        this.hurtPlayer(h.dmg, h.source);
      }
    }
  },
});
