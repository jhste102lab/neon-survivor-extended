'use strict';
// Chest reward feedback banner.
const LootChestRewardFeedback = {
  announce(reward) {
    if (!reward) return;
    GameRuntime.banner(UpgradeRules.chestRewardText(reward), 'good');
  },
};
