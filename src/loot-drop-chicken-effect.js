'use strict';
// Chicken drop healing effect plan.
const LootDropChickenEffect = {
  plan(game, opts = {}) {
    const p = game.player;
    const idleK = game.idleRecoverySuppression ? game.idleRecoverySuppression() : 0;
    const stack = Math.max(1, Math.min(CFG.maxDropStack || 3, Math.round(Number(opts.stack) || 1)));
    const stackMul = Math.pow(1.3, stack - 1);
    const heal = Math.max(4, Math.round(30 * stackMul * (1 - idleK * 0.86)));
    return [
      { type: 'healPlayer', amount: heal },
      { type: 'spawnText', x: p.x, y: p.y - 26, text: `+${heal}`, color: '#7dffc1' },
      { type: 'sound', name: 'pickup' },
    ];
  },
};
