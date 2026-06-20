'use strict';
// XP HUD panel rendering.
const UIHudXp = {
  reset() {
    $('xpfill').style.width = '0%';
  },

  update(player) {
    $('xpfill').style.width = clamp(player.xp / player.xpNeed * 100, 0, 100) + '%';
  },
};
