'use strict';
// Enemy spawn admission rules.
const EnemyFactorySpawnRules = Object.freeze({
  enemyLimit(game) {
    return game.enemyLimit ? game.enemyLimit() : CFG.maxEnemies + (game.endless ? 55 : 0);
  },

  hasEnemyCapacity(game) {
    return game.enemies.length < EnemyFactorySpawnRules.enemyLimit(game);
  },

  allowsSpecialEnemy(game, typeId, def) {
    if (!def.special || !game.specialActiveCount) return true;
    if (game.specialActiveCount() >= game.specialEnemyCap()) return false;
    if (game.specialCountByType && game.specialCountByType(typeId) >= game.specialTypeCap(typeId)) return false;
    return true;
  },
});

