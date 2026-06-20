'use strict';
// Miner special enemy mine-drop behavior and movement.
function updateSpecialEnemyMiner(game, e, dt, _st, dx, dy, dist) {
  e.mineT -= dt;
  if (e.mineT <= 0 && game.spawnHazard) {
    e.mineT = rand(4.0, 6.0);
    game.spawnHazard({
      kind: 'mine', x: e.x, y: e.y, r: 38, warn: 0.85, life: 10.5, dmg: 14, tick: 0.7,
      color: '#ff9d3d', source: 'miner:mine', label: 'MINE',
    });
  }
  if (dist < 230) return { mvx: -dx / dist * e.spd * 0.7, mvy: -dy / dist * e.spd * 0.7 };
  return { mvx: dx / dist * e.spd * 0.75, mvy: dy / dist * e.spd * 0.75 };
}
