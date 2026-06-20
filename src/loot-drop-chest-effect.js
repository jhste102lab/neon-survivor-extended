'use strict';
// Chest drop effect plan.
const LootDropChestEffect = {
  plan() {
    return [
      { type: 'sound', name: 'chest' },
      { type: 'openChest' },
    ];
  },
};
