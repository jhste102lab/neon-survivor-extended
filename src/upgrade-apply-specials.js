'use strict';
// Delegates special upgrade choices to their owning game systems.
const SpecialUpgradeApplicator = {
  apply(game, choice) {
    if (choice.kind === 'ev') return this.applyEvolution(game, choice);
    return this.applyCompanion(game, choice);
  },

  applyEvolution(game, choice) {
    if (!game.applyEvolution || !game.applyEvolution(choice.id)) return UpgradeApplyResults.reject(choice, 'evolution not ready');
    return UpgradeApplyResults.done();
  },

  applyCompanion(game, choice) {
    if (!game.applyCompanionUpgrade || !game.applyCompanionUpgrade(choice)) return UpgradeApplyResults.reject(choice, 'companion upgrade not ready');
    return UpgradeApplyResults.done();
  },
};
