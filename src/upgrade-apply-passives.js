'use strict';
// Passive upgrade side effects on player passive slots.
const PassiveUpgradeApplicator = {
  apply(game, choice) {
    const passives = game.player.passives;
    if (!PASSIVES[choice.id]) return UpgradeApplyResults.reject(choice, 'unknown passive');
    if (this.newPassiveAlreadyOwned(passives, choice)) return UpgradeApplyResults.reject(choice, 'passive duplicate');
    if (this.passiveSlotsFull(game, passives, choice.id)) return UpgradeApplyResults.reject(choice, 'passive slots full');
    if (this.passiveMaxed(passives, choice.id)) return UpgradeApplyResults.reject(choice, 'passive already maxed');
    this.increasePassive(passives, choice.id);
    this.applyPassiveSideEffect(game, choice.id);
    return UpgradeApplyResults.done();
  },

  newPassiveAlreadyOwned(passives, choice) {
    return choice.kind === 'np' && choice.id in passives;
  },

  passiveSlotsFull(game, passives, id) {
    return !(id in passives) && Object.keys(passives).length >= maxPassiveSlotsFor(game);
  },

  passiveMaxed(passives, id) {
    return (passives[id] || 0) >= MAX_LV;
  },

  increasePassive(passives, id) {
    passives[id] = (passives[id] || 0) + 1;
  },

  applyPassiveSideEffect(game, id) {
    if (id === 'vitality') UpgradeApplyHealth.restore(game, 20);
  },
};
