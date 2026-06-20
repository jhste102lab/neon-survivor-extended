'use strict';
// Weapon-slot cap refresh for Game.update.
Object.assign(Game, {
  refreshWeaponSlotCap(player) {
    const weaponSlotCap = maxWeaponSlotsFor(this);
    if (weaponSlotCap !== this.lastWeaponSlotCap) {
      const previous = this.lastWeaponSlotCap || MAX_WEAPONS;
      this.lastWeaponSlotCap = weaponSlotCap;
      this.slotsDirty = true;
      if (weaponSlotCap > previous && !player.dead) GameRuntime.banner(tr('banner.weaponSlots', { max: weaponSlotCap }), 'good');
    }
  },
});

