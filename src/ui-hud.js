'use strict';
// Public HUD facade. Focused ui-hud-* modules own the actual panel behavior.
function assertUiHudHelpers() {
  const missing = [];
  if (typeof UIHudLevel === 'undefined') missing.push('ui-hud-level.js');
  if (typeof UIHudTimer === 'undefined') missing.push('ui-hud-timer.js');
  if (typeof UIHudCombo === 'undefined') missing.push('ui-hud-combo.js');
  if (typeof UIHudRun === 'undefined') missing.push('ui-hud-run.js');
  if (typeof UIHudFrame === 'undefined') missing.push('ui-hud-frame.js');
  if (typeof UIHudBanner === 'undefined') missing.push('ui-hud-banner.js');
  if (typeof UIHudBoss === 'undefined') missing.push('ui-hud-boss.js');
  if (missing.length) throw new Error(`UI HUD helper scripts missing: ${missing.join(', ')}. Load ui-hud-* helpers before ui-hud.js.`);
}
assertUiHudHelpers();

/* ================================================================
   UI HUD
   ================================================================ */
Object.assign(UI, {
  syncLevelTier(level, force = false) {
    return UIHudLevel.syncLevelTier(level, force);
  },

  timeCheckpoint(time) {
    return UIHudTimer.timeCheckpoint(time);
  },

  updateTimer(time) {
    return UIHudTimer.updateTimer(time);
  },

  resetComboHud() {
    return UIHudCombo.resetComboHud();
  },

  resetRunHud() {
    return UIHudRun.resetRunHud();
  },

  frame() {
    return UIHudFrame.frame();
  },

  combo(n) {
    return UIHudCombo.combo(n);
  },

  banner(txt, cls) {
    return UIHudBanner.banner(txt, cls);
  },

  showBossBar(name) {
    return UIHudBoss.showBossBar(name);
  },

  updateBossBar(enemy) {
    return UIHudBoss.updateBossBar(enemy);
  },

  hideBossBar() {
    return UIHudBoss.hideBossBar();
  },

  updateDashHud(game = Game) {
    return UIHudBoss.updateDashHud(game);
  },

  updateFocusChip(game = Game) {
    return UIHudBoss.updateFocusChip(game);
  },
});
