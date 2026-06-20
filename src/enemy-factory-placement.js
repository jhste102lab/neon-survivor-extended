'use strict';
// Spawn placement helpers for enemies and bosses.
const EnemyFactoryPlacement = Object.freeze({
  enemyPosition(game, fx, fy) {
    const view = GameRuntime.viewportHalf();
    const W = view.w, H = view.h;
    let x = fx, y = fy;
    if (x === null) {
      const a = rand(0, TAU), R = Math.hypot(W, H) + rand(60, 180);
      x = game.player.x + Math.cos(a) * R;
      y = game.player.y + Math.sin(a) * R;
    }
    return { x, y };
  },

  bossPosition(game) {
    const view = GameRuntime.viewportHalf();
    const a = rand(0, TAU), R = Math.hypot(view.w * 2, view.h * 2) / 2 + 140;
    return {
      x: game.player.x + Math.cos(a) * R,
      y: game.player.y + Math.sin(a) * R,
    };
  },
});

