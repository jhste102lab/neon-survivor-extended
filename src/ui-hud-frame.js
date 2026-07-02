'use strict';
// Per-frame HUD refresh orchestration.
const UIHudFrame = {
  updateFieldTestBadge(G) {
    let badge = $('fieldTestBadge');
    const on = !!(G.fieldTestRun || G.fieldTestInvincible);
    if (!badge && on) {
      badge = document.createElement('div');
      badge.id = 'fieldTestBadge';
      document.body.appendChild(badge);
    }
    if (!badge) return;
    badge.textContent = G.fieldTestInvincible ? 'FIELD TEST · INVINCIBLE' : 'FIELD TEST';
    badge.classList.toggle('on', on);
  },

  frame() {
    if (Game.test && Game.test.headless) return;
    const G = Game;
    UIHudPause.updateButton(G);
    const player = G.player;
    if (!player) return;
    if (G.state === 'play' || G.state === 'levelup' || G.state === 'pause') {
      const stats = G.stat();
      UIHudHp.update(player, stats);
      UIHudXp.update(player);
      UIHudLevel.update(player.level);
      UI.updateTimer(G.time);
      if (UI.syncSpeedControls) UI.syncSpeedControls(G.userTimeScale || 1);
      if (UI.updateDashHud) UI.updateDashHud(G);
      if (UI.updateFocusChip) UI.updateFocusChip(G);
      UIHudKills.updateIfDirty(G);
      if (G.slotsDirty) { UI.refreshSlots(); G.slotsDirty = false; }
      if (G.boss) UI.updateBossBar(G.boss);
      if (UI.updateDimensionHud) UI.updateDimensionHud(G);
      UIHudFrame.updateFieldTestBadge(G);
    }
  },
};
