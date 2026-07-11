'use strict';
// Post-update combo, camera, music, unlock, and endless helpers.
Object.assign(Game, {
  updateComboTimer(dt) {
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.breakCombo();
    }
  },

  updateCameraFollow(dt, player) {
    this.cam.x = lerp(this.cam.x, player.x, 1 - Math.pow(0.0001, dt));
    this.cam.y = lerp(this.cam.y, player.y, 1 - Math.pow(0.0001, dt));
  },

  updateMusicIntensity() {
    GameRuntime.setMusicIntensity(1 + (this.time >= 170 ? 1 : 0) + (this.time >= 420 ? 1 : 0));
  },

  showUnlockNotificationIfReady(player) {
    if (!this.unlockNotified && this.time >= (CFG.unlockTime || CFG.winTime) && !player.dead) {
      this.unlockNotified = true;
      this.slotsDirty = true;
      GameRuntime.banner(tr('banner.unlock'), 'good');
    }
  },

  updateLateFairnessRewards(dt) {
    if (this.updateLateSurvivalBonus) this.updateLateSurvivalBonus(dt);
  },

  enterEndlessIfReady(player) {
    if (this.shouldDelayEndlessForDimension && this.shouldDelayEndlessForDimension()) return;
    if (this.time >= CFG.winTime && !player.dead && !this.endless) this.enterEndlessLoop();
  },

  showEndingIfReady(player) {
    if (this.cleared20 || this.time < (CFG.clearTime || 1200) || player.dead) return;
    if (this.isDimensionSpaceActive && this.isDimensionSpaceActive()) return;
    if (this.activeEvent || this.levelQueue > 0 || this.state !== 'play') return;
    this.cleared20 = true;
    if (typeof UI !== 'undefined' && UI.win) UI.win();
  },

  saveRunSnapshotIfDue() {
    if (typeof RunSnapshot !== 'undefined') RunSnapshot.schedule(this);
  },
});
