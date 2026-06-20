'use strict';
// Upgrade choice utilities and generation. Depends on game/content globals loaded before upgrades.js.
function buildWeaponChoicePools(game, player) {
  const opts = [], newWeaponOpts = [];
  const weaponCap = maxWeaponSlotsFor(game);
  for (const w of player.weapons) {
    if (w.lv < MAX_LV) opts.push({ kind: 'w', id: w.id, w: 3 });
    else if (game.endless) opts.push({ kind: 'ow', id: w.id, w: 2.15 });
  }
  if (player.weapons.length < weaponCap) {
    for (const id in WEAPONS) {
      if (player.weapons.find(w => w.id === id)) continue;
      const option = { kind: 'nw', id, w: game.endless ? 3.2 : 2.2 };
      opts.push(option);
      newWeaponOpts.push(option);
    }
  }
  return { opts, newWeaponOpts };
}

function addPassiveChoicePool(game, player, opts) {
  const passiveCount = Object.keys(player.passives).length;
  const passiveCap = maxPassiveSlotsFor(game);
  for (const id in player.passives) if (player.passives[id] < MAX_LV) opts.push({ kind: 'p', id, w: 2.6 });
  if (passiveCount < passiveCap) {
    for (const id in PASSIVES) if (!(id in player.passives)) opts.push({ kind: 'np', id, w: game.endless ? 2.4 : 1.9 });
  }
}

function reserveChoice(selected, pool, fallbackWeight) {
  if (!Array.isArray(pool) || !pool.length || selected.length >= 3) return null;
  const choice = UpgradeChoiceRules.weightedChoice(pool, fallbackWeight);
  if (choice) selected.push(choice);
  return choice;
}

function reserveSpecialChoicePools(game, selected) {
  if (game.evolutionChoices) reserveChoice(selected, game.evolutionChoices(), 7);
  if (game.companionChoices) reserveChoice(selected, game.companionChoices(), 5);
}

function reserveNewWeaponChoice(opts, newWeaponOpts, selected) {
  if (!newWeaponOpts.length || selected.length >= 3) return;
  const choice = reserveChoice(selected, newWeaponOpts, 2);
  if (choice) UpgradeChoiceRules.removeChoice(opts, choice);
}

function fillOrdinaryChoices(opts, selected) {
  while (selected.length < 3 && opts.length) {
    const choice = UpgradeChoiceRules.weightedChoice(opts, 1);
    UpgradeChoiceRules.removeChoice(opts, choice);
    if (choice) selected.push(choice);
  }
}

function fillTranscendChoices(selected) {
  const tpool = [...TRANSCEND];
  while (selected.length < 3 && tpool.length) {
    const choice = tpool.splice(randi(0, tpool.length - 1), 1)[0];
    selected.push({ kind: 't', id: choice.id });
  }
}

const UpgradeChoiceRules = {
  choiceKey(o) {
    return `${o && o.kind || ''}:${o && o.id || ''}`;
  },

  adjustedChoiceWeight(o) {
    return Math.max(0.05, o && o.w || 1);
  },

  weightedChoice(pool, fallbackWeight = 1) {
    if (!Array.isArray(pool) || !pool.length) return null;
    const weighted = pool.map((o, idx) => ({ ...o, _idx: idx, w: this.adjustedChoiceWeight({ ...o, w: o.w || fallbackWeight }) }));
    const picked = weightedPick(weighted);
    return pool[picked._idx];
  },

  removeChoice(pool, choice) {
    if (!Array.isArray(pool) || !choice) return;
    const key = this.choiceKey(choice);
    const idx = pool.findIndex(o => this.choiceKey(o) === key);
    if (idx >= 0) pool.splice(idx, 1);
  },

  shuffleChoices(choices) {
    if (!Array.isArray(choices)) return [];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = randi(0, i);
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  },

  generateChoices(game = Game) {
    if (!game || !game.player) return [];
    const { opts, newWeaponOpts } = buildWeaponChoicePools(game, game.player);
    addPassiveChoicePool(game, game.player, opts);
    const selected = [];
    reserveSpecialChoicePools(game, selected);
    reserveNewWeaponChoice(opts, newWeaponOpts, selected);
    fillOrdinaryChoices(opts, selected);
    fillTranscendChoices(selected);
    return this.shuffleChoices(selected);
  },
};
