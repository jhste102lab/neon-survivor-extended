'use strict';
// Chest drop opening effect.
const LootDropChestEffect = {
  apply(game) {
    GameRuntime.playSound('chest');
    game.openChest();
  },
};
