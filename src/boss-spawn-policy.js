'use strict';
// Boss spawn admission and cap policy.
const BossSpawnPolicy = Object.freeze({
  activeBossCount(enemies) {
    return enemies.filter(e => e.boss).length;
  },

  bossCap(time) {
    return time < CFG.winTime + 480 ? 1 : 2;
  },

  activeEventBlocksSpawn(game) {
    return game.activeEvent && game.activeEvent.state === 'active';
  },

  activeBossCapBlocksSpawn(game) {
    return game.activeBossCount && game.activeBossCount() >= game.bossCap();
  },

  canSpawnBoss(game) {
    return true;
  },
});
