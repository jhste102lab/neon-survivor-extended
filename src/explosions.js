'use strict';
// Player explosion damage, visual feedback, and evolved missile splitting.
const Explosions = {
  explode(game, x, y, radius, dmg, source = 'weapon:missile', child = false, color = '#ff7a2b') {
    this.spawnExplosionRing(game, x, y, radius, color);
    this.damageExplosionTargets(game, x, y, radius, dmg, source);
    this.spawnSplitMissiles(game, x, y, radius, dmg, source, child);
    this.spawnEvolvedShockField(game, x, y, radius, dmg, source, child, color);
    this.playExplosionFeedback(game, x, y, source, color);
  },

  spawnExplosionRing(game, x, y, radius, color) {
    game.novas.push({ x, y, r: 4, maxR: radius, dmg: 0, kb: 0, id: ++game.novaSeq, delay: 0, visualOnly: true, speed: 600, color, source: game._explosionVisualSource || 'weapon:explosion', visualHidden: !!(game.weaponEffectHiddenForSource && game.weaponEffectHiddenForSource(game._explosionVisualSource || '')) });
  },

  damageExplosionTargets(game, x, y, radius, dmg, source) {
    Grid.forEachInCircle(x, y, radius, e => {
      const a = Math.atan2(e.y - y, e.x - x);
      game.damageEnemy(e, dmg, Math.cos(a) * 220 * e.def.knock, Math.sin(a) * 220 * e.def.knock, source);
    });
  },

  spawnSplitMissiles(game, x, y, radius, dmg, source, child) {
    if (source !== 'weapon:missile:evolved' || child) return;

    const count = 2 + (RNG.next() < 0.35 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      this.spawnSplitMissile(game, x, y, radius, dmg, count, i);
    }
  },

  spawnSplitMissile(game, x, y, radius, dmg, count, index) {
    const targets = game.visibleOrNearestEnemies ? game.visibleOrNearestEnemies(x, y, count, 520, 220) : game.nearestEnemies(x, y, count, 520);
    const target = targets[index] || null;
    const a = target ? Math.atan2(target.y - y, target.x - x) : rand(0, TAU);
    game.pushPlayerBullet({
      kind: 'missile', child: true, source: 'weapon:missile:split',
      x, y, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210,
      r: 4.2, dmg: dmg * 0.24, blast: Math.max(28, radius * 0.34), life: 1.35, speed: 380,
      target, turn: 5.2, color: '#ff7ae8', t: 0,
    });
  },

  spawnEvolvedShockField(game, x, y, radius, dmg, source, child, color) {
    if (source !== 'weapon:shockmine:evolved' || child) return;
    game.novas.push({
      field: true, visual: 'timerift', x, y, r: radius * 0.72, maxR: radius * 0.72,
      life: 0.72, maxLife: 0.72, tick: 0, tickEvery: 0.32,
      dmg: dmg * 0.12, slow: 0.42, id: ++game.novaSeq,
      source: 'weapon:shockmine:evolved:field', color: color || '#41f0ff',
    });
  },

  playExplosionFeedback(game, x, y, source, color) {
    game.spawnBurst(x, y, color || '#ff7a2b', 14, 240, 7, 0.45);
    game.spawnBurst(x, y, source === 'weapon:shockmine' ? '#eaffff' : '#ffd23d', 8, 150, 5, 0.35);
    GameRuntime.playSound('boom');
    game.shake(5, 0.25);
  },
};

Object.assign(Game, {
  explode(x, y, radius, dmg, source = 'weapon:missile', child = false, color = '#ff7a2b') {
    this._explosionVisualSource = source;
    try {
      Explosions.explode(this, x, y, radius, dmg, source, child, color);
    } finally {
      this._explosionVisualSource = '';
    }
  },
});
