'use strict';
// Magnet drop gem-attraction effect.
const LootDropMagnetEffect = {
  apply(game) {
    for (const gem of game.gems) {
      gem.mag = true;
      gem.ms = 500;
    }
    GameRuntime.playSound('pickup');
  },
};
