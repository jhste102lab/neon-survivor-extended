'use strict';
// Enemy post-construction initialization.
const EnemyFactoryInitialization = Object.freeze({
  initializeEnemy(game, enemy) {
    if (game.initSpecialEnemy) game.initSpecialEnemy(enemy);
    return enemy;
  },
});

