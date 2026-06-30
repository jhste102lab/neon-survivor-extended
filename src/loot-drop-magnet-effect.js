'use strict';
// Magnet drop gem-attraction effect plan.
const LootDropMagnetEffect = {
  plan(game, opts = {}) {
    const stack = Math.max(1, Math.min(CFG.maxDropStack || 3, Math.round(Number(opts.stack) || 1)));
    const baseLimit = CFG.magnetMotionLimit || 80;
    const outcomes = [
      { type: 'magnetizeGems', speed: 500, motionLimit: Math.min(140, baseLimit + (stack - 1) * 20) },
      { type: 'sound', name: 'pickup' },
    ];
    if (game && game.lateMagnetGravityActive && game.lateMagnetGravityActive()) {
      outcomes.unshift({ type: 'lateMagnetGravity', x: opts.x, y: opts.y });
    }
    return outcomes;
  },
};
