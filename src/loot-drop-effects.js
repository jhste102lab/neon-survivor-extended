'use strict';
// Drop effect registry and dispatch.
const LootDropEffects = {
  effects: {
    chicken: LootDropChickenEffect,
    magnet: LootDropMagnetEffect,
    bomb: LootDropBombEffect,
    chest: LootDropChestEffect,
  },

  apply(game, kind) {
    const effect = this.effects[kind];
    if (!effect) return;
    effect.apply(game);
  },
};
