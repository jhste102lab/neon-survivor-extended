'use strict';
// Per-frame HUD refresh orchestration.
const UIHudFrame = {
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
      UIHudKills.updateIfDirty(G);
      if (G.slotsDirty) { UI.refreshSlots(); G.slotsDirty = false; }
      if (G.boss) UI.updateBossBar(G.boss);
    }
  },
};
