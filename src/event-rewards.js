'use strict';
// Field event reward grants.
function eventRewardChoice(game) {
  const choices = UpgradeRules.generateChoices(game);
  if (!choices.length) return { kind: 'heal' };
  return choices[0];
}

Object.assign(Game, {
  grantEventReward(ev) {
    const choice = eventRewardChoice(this);
    if (GameRuntime.isHeadless(this) || typeof UI === 'undefined' || !UI.showRewardCard) {
      this.applyUpgrade(choice);
      return;
    }
    const info = FIELD_EVENTS[ev.type] || {};
    GameRuntime.showRewardCard(choice, info.name || '');
  },
});
