'use strict';
// Dispatches upgrade choices to responsibility-specific applicators.
const UpgradeApplyDispatcher = {
  apply(game, choice) {
    if (!this.hasTarget(game, choice)) return UpgradeApplyResults.missingGameOrChoice();
    const appliedChoice = UpgradeApplyResults.appliedChoice(choice);
    const result = this.applyKnownKind(game, choice);
    if (result && result.applied && this.isWeaponKind(choice.kind)) this.recordRecentWeaponChoice(game, choice.id);
    return UpgradeApplyResults.finalize(game, result, appliedChoice);
  },

  hasTarget(game, choice) {
    return !!(game && game.player && choice);
  },

  applyKnownKind(game, choice) {
    const applicator = UpgradeKindContract.applicator(choice.kind);
    if (applicator === 'weapon') return WeaponUpgradeApplicator.apply(game, choice);
    if (applicator === 'special') return SpecialUpgradeApplicator.apply(game, choice);
    if (applicator === 'passive') return PassiveUpgradeApplicator.apply(game, choice);
    if (applicator === 'transcend') return TranscendUpgradeApplicator.apply(game, choice);
    if (applicator === 'heal') return HealUpgradeApplicator.apply(game, choice);
    if (applicator === 'dimensionReward' && game.pickDimensionReward) {
      const ok = game.pickDimensionReward(choice);
      return ok ? UpgradeApplyResults.done() : UpgradeApplyResults.reject(choice, 'dimension reward unavailable');
    }
    return UpgradeApplyResults.reject(choice, 'unknown upgrade kind');
  },

  isWeaponKind(kind) {
    return kind === 'w' || kind === 'ow' || kind === 'nw';
  },

  isSpecialKind(kind) {
    return kind === 'ev' || kind === 'nc';
  },

  isPassiveKind(kind) {
    return kind === 'p' || kind === 'np';
  },

  recordRecentWeaponChoice(game, id) {
    if (!game || !game.player || !id) return;
    const recent = (game.player.recentWeaponIds || []).filter(existing => existing !== id);
    recent.unshift(id);
    game.player.recentWeaponIds = recent.slice(0, 8);
  },
};
