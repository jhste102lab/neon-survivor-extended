'use strict';
// Capped player healing used by upgrade application.
const UpgradeApplyHealth = {
  restore(game, amount) {
    const p = game.player;
    p.hp = Math.min(game.stat().maxHp, p.hp + amount);
  },
};
