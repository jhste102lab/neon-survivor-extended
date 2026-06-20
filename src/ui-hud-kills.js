'use strict';
// Kill counter dirty-state and text rendering.
const UIHudKills = {
  markDirty() {
    UI.killDirty = true;
  },

  reset() {
    $('killNum').textContent = '💀 0';
  },

  updateIfDirty(game) {
    if (!UI.killDirty) return;
    $('killNum').textContent = `💀 ${game.kills}`;
    UI.killDirty = false;
  },
};
