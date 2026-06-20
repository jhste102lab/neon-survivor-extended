'use strict';
// Public UpgradeApplicator interface for applying upgrade side effects.
const UpgradeApplicator = {
  apply(game = Game, choice) {
    return UpgradeApplyDispatcher.apply(game, choice);
  },
};
