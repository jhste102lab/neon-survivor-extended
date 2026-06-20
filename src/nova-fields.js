'use strict';
// Persistent nova field ticking, pull, slow, and damage.
const NovaFields = {
  update(game, n, dt) {
    n.life -= dt;
    const radius = n.r || n.maxR || 80;
    const doTick = this.tickReady(n, dt);
    const effectDt = n.pull ? this.fieldStepDelta(n, dt, doTick) : (doTick ? dt : 0);
    if (effectDt > 0) this.affectEnemies(game, n, effectDt, radius, doTick);
    if (n.life <= 0 && n.endBlast && !n.ended) this.applyEndBlast(game, n, radius);
    return n.life <= 0;
  },

  tickReady(n, dt) {
    n.tick = (n.tick == null ? 0 : n.tick) - dt;
    const doTick = n.tick <= 0;
    if (doTick) n.tick += n.tickEvery || 0.35;
    return doTick;
  },

  fieldStepDelta(n, dt, force) {
    n.fieldDt = Math.min(0.18, (n.fieldDt || 0) + dt);
    n.fieldT = (n.fieldT == null ? 0 : n.fieldT) - dt;
    if (!force && n.fieldT > 0) return 0;
    const stepDt = n.fieldDt;
    n.fieldDt = 0;
    while (n.fieldT <= 0) n.fieldT += n.fieldEvery || 0.075;
    return stepDt;
  },

  affectEnemies(game, n, dt, radius, doTick) {
    const queryR = radius + 76;
    Grid.forEachInCircleD2(n.x, n.y, queryR, (e, d2) => {
      if (e.hp <= 0) return;
      const hitR = radius + e.r;
      if (d2 > hitR * hitR) return;
      this.applyFieldEffects(game, n, dt, e, d2, doTick);
    });
  },

  applyFieldEffects(game, n, dt, e, d2, doTick) {
    const d = Math.sqrt(d2) || 1;
    this.applyPull(n, dt, e, d);
    this.applySlow(n, e);
    this.applyVulnerability(n, e);
    if (doTick && n.dmg > 0) game.damageEnemy(e, n.dmg, 0, 0, n.source || 'weapon:field');
  },

  applyPull(n, dt, e, d) {
    if (!n.pull) return;
    const controlScale = CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale;
    const k = controlScale * (e.boss ? 0.32 : 1) * n.pull * dt;
    e.x += (n.x - e.x) / d * k;
    e.y += (n.y - e.y) / d * k;
  },

  applySlow(n, e) {
    if (!n.slow) return;
    e.slowT = Math.max(e.slowT || 0, Math.max(0.32, (n.tickEvery || 0.35) + 0.08));
    e.slowK = Math.max(e.slowK || 0, Math.min(0.82, n.slow));
  },

  applyVulnerability(n, e) {
    if (!n.vulnerableK) return;
    e.vulnerableT = Math.max(e.vulnerableT || 0, n.vulnerableT || Math.max(0.5, (n.tickEvery || 0.35) + 0.2));
    e.vulnerableK = Math.max(e.vulnerableK || 0, e.boss ? (n.vulnerableBossK || 0.04) : n.vulnerableK);
  },

  applyEndBlast(game, n, radius) {
    n.ended = true;
    game.explode(n.x, n.y, n.endBlastRadius || radius * 0.78, n.endBlastDamage || n.dmg * 2.2, n.endBlastSource || n.source || 'weapon:field', true, n.color);
  },
};
