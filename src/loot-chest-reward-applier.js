'use strict';
// Chest reward application through the existing upgrade seam.
const LootChestRewardApplier = {
  applyRandom(game, pool) {
    return game.applyUpgrade(pick(pool));
  },
};
