'use strict';
// Boss spawn UI and feedback side effects.
const BossSpawnEffects = Object.freeze({
  showBossSpawnWarning(game, def) {
    GameRuntime.banner(tr('banner.bossSpawn', { name: def.name }), 'warn');
    GameRuntime.showBossBar(def.name);
    GameRuntime.playSound('bossWarn');
    GameRuntime.restartCssAnimation('dangerfx', 'on');
    game.shake(8, 0.6);
  },
});

