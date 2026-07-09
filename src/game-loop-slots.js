'use strict';
// Weapon-slot cap refresh for Game.update.
Object.assign(Game, {
  refreshWeaponSlotCap(player) {
    if (this.applyWeaponCapBonusThresholds) this.applyWeaponCapBonusThresholds();
    const weaponSlotCap = maxWeaponSlotsFor(this);
    if (weaponSlotCap !== this.lastWeaponSlotCap) {
      const previous = this.lastWeaponSlotCap || MAX_WEAPONS;
      this.lastWeaponSlotCap = weaponSlotCap;
      this.slotsDirty = true;
      if (weaponSlotCap > previous && !player.dead) GameRuntime.banner(tr('banner.weaponSlots', { max: weaponSlotCap }), 'good');
    }
  },
});


Object.assign(Game, {
  applyWeaponCapBonusThresholds() {
    if (!this.runSettings || typeof baseWeaponSlotsFor !== 'function' || typeof selectedWeaponCapFor !== 'function') return;
    const cap = selectedWeaponCapFor(this);
    const base = baseWeaponSlotsFor(this);
    const granted = Array.isArray(this.runSettings.weaponCapBonusThresholds) ? this.runSettings.weaponCapBonusThresholds : [];
    let changed = false;
    for (const threshold of [10, 15, 20]) {
      if (base >= threshold && cap < threshold && !granted.includes(threshold)) {
        granted.push(threshold);
        changed = true;
      }
    }
    if (!changed) return;
    this.runSettings.weaponCapBonusThresholds = granted;
    this.runSettings.weaponCapBonusCount = granted.length;
    this.runSettings.weaponCapBonusDamage = Math.round(granted.length * 10);
    if (this.player && !this.player.dead) GameRuntime.banner(`무기 제한 보너스: 모든 무기 피해 +${this.runSettings.weaponCapBonusDamage}%`, 'good');
  },
});
