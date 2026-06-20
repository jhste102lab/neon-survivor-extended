'use strict';
// Spawner special enemy summon behavior and movement.
function updateSpecialEnemySpawner(game, e, dt, _st, dx, dy, dist) {
  e.spawnT -= dt;
  if (e.spawnT <= 0 && game.enemies.length < (game.enemyLimit ? game.enemyLimit() : CFG.maxEnemies + (game.endless ? 55 : 0)) - 6) {
    e.spawnT = rand(5.0, 7.0);
    const n = game.endless ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      game.spawnEnemy(i === 0 ? 'runner' : 'swarm', e.x + Math.cos(a) * 56, e.y + Math.sin(a) * 56);
    }
    game.spawnBurst(e.x, e.y, '#d44dff', 10, 140, 5, 0.4);
  }
  if (dist > 520) return { mvx: dx / dist * e.spd * 0.9, mvy: dy / dist * e.spd * 0.9 };
  if (dist < 270) return { mvx: -dx / dist * e.spd * 0.55, mvy: -dy / dist * e.spd * 0.55 };
  return { mvx: Math.cos(e.wobble) * e.spd * 0.22, mvy: Math.sin(e.wobble) * e.spd * 0.22 };
}
