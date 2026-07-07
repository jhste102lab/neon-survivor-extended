'use strict';
// Field event reward grants. Events now give small two-card choices instead of full level-up strength.
const EVENT_MINOR_REWARDS = Object.freeze(['minor_heal', 'minor_barrier', 'minor_xp', 'minor_power', 'minor_speed']);

function uniqueMinorRewardChoices(count = 2, forced = []) {
  const ids = [...new Set(forced.filter(Boolean))];
  const pool = EVENT_MINOR_REWARDS.filter(id => !ids.includes(id));
  while (ids.length < count && pool.length) ids.push(pool.splice(randi(0, pool.length - 1), 1)[0]);
  return ids.slice(0, count).map(id => ({ kind: 'minor', id }));
}

function eventRewardChoices(game, ev) {
  if (ev && ev.type === 'rift' && ev.dimension === 'casino') return uniqueMinorRewardChoices(2, ['casino_gamble']);
  return uniqueMinorRewardChoices(2);
}

Object.assign(Game, {
  grantEventReward(ev) {
    const choices = eventRewardChoices(this, ev);
    const first = choices[0] || { kind: 'heal' };
    if (GameRuntime.isHeadless(this) || typeof UI === 'undefined' || !UI.showRewardCard) {
      this.applyUpgrade(first);
      return;
    }
    const field = FIELD_EVENTS[ev.type] || {};
    const label = ev.type === 'rift' && typeof DimensionRiftRules !== 'undefined'
      ? DimensionRiftRules.displayName(ev.dimension)
      : (field.name || '');
    GameRuntime.showRewardChoices(choices, label);
  },
});
