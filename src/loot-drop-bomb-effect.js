'use strict';
// Bomb drop effect plan.
const LootDropBombEffect = {
  plan(game, opts = {}) {
    const stack = Math.max(1, Math.min(CFG.maxDropStack || 3, Math.round(Number(opts.stack) || 1)));
    const damage = Math.round(250 * Math.pow(1.3, stack - 1));
    return [
      { type: 'damageVisibleEnemies', damage, source: 'drop:bomb' },
      { type: 'flash', id: 'lvlfx', duration: 0.6 },
      { type: 'sound', name: 'boom' },
      { type: 'shake', amount: 12, duration: 0.5 },
    ];
  },
};
