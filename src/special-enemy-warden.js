'use strict';
// Warden special enemy hazard-cast behavior and movement.
function updateSpecialEnemyWarden(game, e, dt, _st, dx, dy, dist) {
  const p = game.player;
  e.wardT -= dt;
  if (e.wardT <= 0 && dist < 780 && game.spawnHazard) {
    e.wardT = rand(6.2, 8.4);
    const lead = Math.min(150, Math.hypot(p.moveX, p.moveY) ? 95 : 0);
    game.spawnHazard({
      kind: 'warden', x: p.x + p.moveX * lead + rand(-35, 35), y: p.y + p.moveY * lead + rand(-35, 35),
      r: 74, warn: 1.05, life: 3.8, dmg: 12, tick: 0.55,
      color: '#41f0ff', source: 'warden:hazard', label: 'WARDEN',
    });
    game.spawnBurst(e.x, e.y, '#41f0ff', 5, 90, 4, 0.25);
  }
  if (dist > 330) return { mvx: dx / dist * e.spd, mvy: dy / dist * e.spd };
  return { mvx: -dy / dist * e.spd * 0.42, mvy: dx / dist * e.spd * 0.42 };
}
