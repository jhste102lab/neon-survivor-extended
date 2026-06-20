'use strict';
// Chest fallback reward when no upgrade pool is available.
const LootChestRewardFallback = {
  apply(game) {
    const p = game.player;
    p.hp = Math.min(game.stat().maxHp, p.hp + 50);
    GameRuntime.banner(tr('chest.heal'), 'good');
  },
};
