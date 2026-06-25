'use strict';
// Spawn placement helpers for enemies and bosses.
const EnemyFactoryPlacement = Object.freeze({
  enemySpawnPad(game) {
    const speedK = clamp(((game && game.userTimeScale) || 1) - 1, 0, 2) / 2;
    const mobile = game && game.isMobileRuntime && game.isMobileRuntime();
    return mobile ? lerp(260, 520, speedK) : lerp(130, 300, speedK);
  },

  enemyPosition(game, fx, fy) {
    const view = GameRuntime.viewportHalf();
    const W = view.w, H = view.h;
    let x = fx, y = fy;
    if (x === null) {
      const pad = EnemyFactoryPlacement.enemySpawnPad(game);
      const a = rand(0, TAU), R = Math.hypot(W, H) + rand(pad, pad + 180);
      x = game.player.x + Math.cos(a) * R;
      y = game.player.y + Math.sin(a) * R;
    }
    return { x, y };
  },

  swarmBurstRadius(game) {
    const view = GameRuntime.viewportHalf();
    return Math.hypot(view.w, view.h) + EnemyFactoryPlacement.enemySpawnPad(game) + 80;
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
