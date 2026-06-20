'use strict';
// Weapon upgrade side effects on player weapon slots.
const WeaponUpgradeApplicator = {
  apply(game, choice) {
    if (choice.kind === 'nw') return this.acquireWeapon(game, choice);
    return this.levelOwnedWeapon(game, choice);
  },

  levelOwnedWeapon(game, choice) {
    const weapon = this.ownedWeapon(game.player, choice.id);
    if (!weapon) return UpgradeApplyResults.reject(choice, 'weapon not owned');
    if (choice.kind === 'w' && weapon.lv >= MAX_LV) return UpgradeApplyResults.reject(choice, 'weapon already maxed');
    if (choice.kind === 'ow' && !game.endless) return UpgradeApplyResults.reject(choice, 'weapon overlevel locked');
    weapon.lv++;
    return UpgradeApplyResults.done();
  },

  acquireWeapon(game, choice) {
    if (!WEAPONS[choice.id]) return UpgradeApplyResults.reject(choice, 'unknown weapon');
    if (this.ownedWeapon(game.player, choice.id)) return UpgradeApplyResults.reject(choice, 'weapon duplicate');
    if (this.weaponSlotsFull(game)) return UpgradeApplyResults.reject(choice, 'weapon slots full');
    game.player.weapons.push(this.initialWeapon(choice.id));
    return UpgradeApplyResults.done();
  },

  ownedWeapon(player, id) {
    return player.weapons.find(w => w.id === id);
  },

  weaponSlotsFull(game) {
    return game.player.weapons.length >= maxWeaponSlotsFor(game);
  },

  initialWeapon(id) {
    return { id, lv: 1, timer: 0.2 };
  },
};
