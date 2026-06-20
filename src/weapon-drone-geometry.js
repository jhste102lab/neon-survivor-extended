'use strict';
// Shared drone mount geometry for firing and rendering.
const WeaponDroneGeometry = {
  count(stats) {
    return Math.max(2, stats.count || 1);
  },

  mount(player, gameTime, count, index) {
    const angle = gameTime * 2.1 + index / count * TAU;
    const bob = Math.sin(gameTime * 5.4 + index * 1.9) * 3.2;
    const radius = 52 + Math.min(20, count * 2.8);
    return {
      angle,
      x: player.x + Math.cos(angle) * radius,
      y: player.y + Math.sin(angle) * radius + bob,
    };
  },
};
