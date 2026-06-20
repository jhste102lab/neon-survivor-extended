'use strict';
// Direct heal upgrade side effect on player health.
const HealUpgradeApplicator = {
  apply(game) {
    UpgradeApplyHealth.restore(game, 50);
    return UpgradeApplyResults.done();
  },
};
