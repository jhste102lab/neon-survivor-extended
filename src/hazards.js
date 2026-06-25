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
      dmg: opts.dmg || 10, tick: 0, tickEvery: opts.tick || 0.55,
      color: opts.color || '#ff4d5e', source: opts.source || 'hazard', label: opts.label || '',
      bypassInvuln: !!opts.bypassInvuln,
    };
    this.hazards.push(h);
    return h;
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
      if (h.warn <= 0 && canTickPlayer && h.tick <= 0 && dist2(p.x, p.y, h.x, h.y) < (h.r + CFG.player.radius) * (h.r + CFG.player.radius)) {
        h.tick = h.tickEvery;
        this.hurtPlayer(h.dmg, h.source);
      }
    }
  },
});
