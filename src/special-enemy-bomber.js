'use strict';
// Bomber special enemy: approaches, stops near the player, then explodes after a warning.
function updateSpecialEnemyBomber(game, e, dt, _st, dx, dy, dist) {
  const cfg = CFG.specialPatterns || {};
  if (e.bomberState === 2) return { mvx: 0, mvy: 0 };
  if (e.bomberState === 1) {
    e.bomberWarn -= dt;
    if (e.bomberWarn <= 0 && game.spawnHazard) {
      e.bomberState = 2;
      const hard = game.time >= (cfg.bomberHardStart || CFG.winTime);
      game.spawnHazard({
        kind: 'bomber-blast', x: e.x, y: e.y, r: (cfg.bomberRadius || 82) * (hard ? 1.12 : 0.9),
        warn: 0.08, life: 0.42, dmg: (cfg.bomberDamage || 24) * (hard ? 1.15 : 0.8), tick: 0.6,
        color: '#ff6b3d', source: 'special:bomber-blast', label: 'BOOM',
      });
      e.hp = 0;
      game.killEnemy(e);
      return { mvx: 0, mvy: 0 };
    }
    return { mvx: 0, mvy: 0 };
  }
  if (dist < 118) {
    e.bomberState = 1;
    e.bomberWarn = cfg.bomberWarn || 1.05;
    game.spawnHazard({
      kind: 'bomber-warn', x: e.x, y: e.y, r: cfg.bomberRadius || 82,
      warn: cfg.bomberWarn || 1.05, life: (cfg.bomberWarn || 1.05) + 0.16, dmg: 0, tick: 9,
      color: '#ff6b3d', source: 'special:bomber-warn', label: '폭발',
    });
    return { mvx: 0, mvy: 0 };
  }
  return { mvx: dx / dist * e.spd * 1.08, mvy: dy / dist * e.spd * 1.08 };
}
