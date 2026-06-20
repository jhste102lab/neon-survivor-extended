'use strict';
// Enemy registration side effects on Game state.
const EnemyFactoryRegistration = Object.freeze({
  registerEnemy(game, enemy) {
    game.enemies.push(enemy);
    return enemy;
  },
});

