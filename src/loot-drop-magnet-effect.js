'use strict';
// Magnet drop gem-attraction effect plan.
const LootDropMagnetEffect = {
  plan() {
    return [
      { type: 'magnetizeGems', speed: 500 },
      { type: 'sound', name: 'pickup' },
    ];
  },
};
