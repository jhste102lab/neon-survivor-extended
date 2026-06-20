'use strict';
// Bomb drop effect plan.
const LootDropBombEffect = {
  plan() {
    return [
      { type: 'damageVisibleEnemies', damage: 250, source: 'drop:bomb' },
      { type: 'flash', id: 'lvlfx', duration: 0.6 },
      { type: 'sound', name: 'boom' },
      { type: 'shake', amount: 12, duration: 0.5 },
    ];
  },
};
