'use strict';
// Special enemy per-frame behavior dispatcher. Load special-enemy-* helpers before this file.
const SPECIAL_ENEMY_BEHAVIOR_BY_TYPE = Object.freeze({
  charger: updateSpecialEnemyCharger,
  warden: updateSpecialEnemyWarden,
  miner: updateSpecialEnemyMiner,
  spawner: updateSpecialEnemySpawner,
  bulwark: updateSpecialEnemyBulwark,
  bomber: updateSpecialEnemyBomber,
});

Object.assign(Game, {
  updateSpecialEnemy(e, dt, st, dx, dy, dist) {
    if (!e.special) return null;
    const behavior = SPECIAL_ENEMY_BEHAVIOR_BY_TYPE[e.special];
    return behavior ? behavior(this, e, dt, st, dx, dy, dist) : null;
  },
});
