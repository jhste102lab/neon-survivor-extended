'use strict';
// Expanding nova ring visuals, delay handling, and one-time hits.
const NovaRings = {
  delayActive(n, dt) {
    if (!(n.delay > 0)) return false;
    n.delay -= dt;
    return true;
  },

  startVisual(game, n) {
    if (n.started) return;
    n.started = true;
    if (n.missile) this.startMissileVisual(game, n);
    else if (n.skyFall) this.startSkyFallVisual(game, n);
  },

  startMissileVisual(game, n) {
    game.spawnBurst(n.x, n.y, n.color || '#ff6b3d', 18, 260, 8, 0.42);
    if (n.afterField) {
      game.novas.push({
        field: true, visual: n.afterField.visual || 'blackhole', x: n.x, y: n.y,
        r: n.afterField.radius || n.maxR * 0.82, maxR: n.afterField.radius || n.maxR * 0.82,
        life: n.afterField.life || 0.9, maxLife: n.afterField.life || 0.9,
        tick: 0, tickEvery: n.afterField.tick || 0.34,
        dmg: n.afterField.dmg || 0, pull: n.afterField.pull || 0, slow: n.afterField.slow || 0,
        id: ++game.novaSeq, source: n.afterField.source || n.source, color: n.afterField.color || n.color,
      });
    }
    GameRuntime.playSound('boom');
    game.shake(5, 0.22);
  },

  startSkyFallVisual(game, n) {
    game.spawnBurst(n.x, n.y, n.color || '#7dffc1', 6, 150, 5, 0.22);
  },

  update(game, n, dt, st) {
    n.r += (n.speed || 430) * dt;
    if (!n.visualOnly) this.hitEnemiesOnRing(game, n, st);
    return n.r >= n.maxR;
  },

  hitEnemiesOnRing(game, n, st) {
    Grid.forEachInCircleD2(n.x, n.y, n.r + 96, (e, d2) => {
      if (e.novaId === n.id) return;
      const band = 34 + e.r;
      const inner = Math.max(0, n.r - band);
      const outer = n.r + band;
      if (d2 >= inner * inner && d2 <= outer * outer) this.applyRingHit(game, n, e, st);
    });
  },

  applyRingHit(game, n, e, st) {
    e.novaId = n.id;
    this.applySlow(n, e);
    this.applyVulnerability(n, e);
    this.damageRingTarget(game, n, e);
    this.applyHeal(game, n, st);
  },

  applySlow(n, e) {
    if (!n.slow) return;
    e.slowT = Math.max(e.slowT || 0, n.slowT || 0.5);
    e.slowK = Math.max(e.slowK || 0, Math.min(0.82, n.slow));
  },

  applyVulnerability(n, e) {
    if (!n.vulnerableK) return;
    e.vulnerableT = Math.max(e.vulnerableT || 0, n.vulnerableT || 0.5);
    e.vulnerableK = Math.max(e.vulnerableK || 0, e.boss ? (n.vulnerableBossK || 0.02) : n.vulnerableK);
  },

  damageRingTarget(game, n, e) {
    const a = Math.atan2(e.y - n.y, e.x - n.x);
    game.damageEnemy(e, n.dmg, Math.cos(a) * (n.kb || 0) * e.def.knock, Math.sin(a) * (n.kb || 0) * e.def.knock, n.source || 'weapon:nova');
  },

  applyHeal(game, n, st) {
    if (!n.heal || !game.player || game.player.dead) return;
    if (n.healLeft == null) n.healLeft = Infinity;
    const amount = Math.min(n.heal, n.healLeft);
    if (amount <= 0) return;

    const stNow = game.st || st || game.stat();
    game.player.hp = Math.min(stNow.maxHp, game.player.hp + amount);
    n.healLeft -= amount;
  },
};
