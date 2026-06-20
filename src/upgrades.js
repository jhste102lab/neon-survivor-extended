'use strict';
// Public UpgradeRules interface. Responsibility-specific behavior lives in upgrade-*.js.
const UpgradeRules = {
  choiceKey: UpgradeChoiceRules.choiceKey,
  adjustedChoiceWeight: UpgradeChoiceRules.adjustedChoiceWeight,
  weightedChoice: UpgradeChoiceRules.weightedChoice,
  removeChoice: UpgradeChoiceRules.removeChoice,
  shuffleChoices: UpgradeChoiceRules.shuffleChoices,
  generateChoices: UpgradeChoiceRules.generateChoices,

  describeChoice: UpgradeDescriptions.describeChoice,
  healDescription: UpgradeDescriptions.healDescription,
  chestRewardText: UpgradeDescriptions.chestRewardText,

  apply: UpgradeApplicator.apply,
};

Object.assign(Game, {
  applyUpgrade(choice) {
    const result = UpgradeRules.apply(this, choice);
    return result.applied ? result.choice : null;
  },
});
