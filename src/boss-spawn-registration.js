'use strict';
// Boss registration side effects on Game state.
const BossSpawnRegistration = Object.freeze({
  registerBoss(game, boss) {
    game.enemies.push(boss);
    game.boss = boss;
    game.lastBossSpawnT = game.time;
  },
});

