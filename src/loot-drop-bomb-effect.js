'use strict';
// Bomb drop screen-clearing effect.
const LootDropBombEffect = {
  apply(game) {
    this.damageVisibleEnemies(game);
    this.playFeedback(game);
  },

  damageVisibleEnemies(game) {
    const view = GameRuntime.viewportHalf(100);
    const W = view.w, H = view.h;
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];
      if (Math.abs(e.x - game.cam.x) < W && Math.abs(e.y - game.cam.y) < H) {
        game.damageEnemy(e, 250, 0, 0, 'drop:bomb');
      }
    }
  },

  playFeedback(game) {
    GameRuntime.flashEffect('lvlfx', 0.6);
    GameRuntime.playSound('boom');
    game.shake(12, 0.5);
  },
};
