'use strict';
// Chest opening orchestration.
const LootChest = {
  openChest() {
    const pool = LootChestRewardPool.build(this);
    if (!pool.length) {
      LootChestRewardFallback.apply(this);
      return;
    }

    const reward = LootChestRewardApplier.applyRandom(this, pool);
    LootChestRewardFeedback.announce(reward);
  },
};
