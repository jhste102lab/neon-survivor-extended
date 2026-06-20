'use strict';
// Whole-run HUD reset orchestration.
const UIHudRun = {
  resetRunHud() {
    if (Game.test && Game.test.headless) return;
    UIHudKills.markDirty();
    UI.resetComboHud();
    UIHudKills.reset();
    UIHudLevel.reset();
    UI.updateTimer(0);
    UIHudXp.reset();
    UIHudHp.reset();
    UI.refreshSlots();
  },
};
