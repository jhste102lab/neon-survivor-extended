'use strict';
// Result DTO helpers for upgrade application.
const UpgradeApplyResults = {
  missingGameOrChoice() {
    return { applied: false, choice: null, reason: 'missing game or choice' };
  },

  reject(choice, reason) {
    return { applied: false, choice, reason };
  },

  done() {
    return { applied: true };
  },

  appliedChoice(choice) {
    return { ...choice };
  },

  finalize(game, result, appliedChoice) {
    if (!result || !result.applied) return result;
    game.slotsDirty = true;
    return { applied: true, choice: appliedChoice };
  },
};
