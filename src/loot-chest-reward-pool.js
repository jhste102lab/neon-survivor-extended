'use strict';
// Chest reward pool construction.
const LootChestRewardPool = {
  build(game) {
    const pool = [];
    this.addWeaponRewards(game, pool);
    this.addEvolutionRewards(game, pool);
    this.addPassiveRewards(game, pool);
    this.addNewPassiveRewards(game, pool);
    this.addNewWeaponRewards(game, pool);
    this.addCompanionRewards(game, pool);
    this.addTranscendRewardsIfEmpty(pool);
    return pool;
  },

  addWeaponRewards(game, pool) {
    for (const weapon of game.player.weapons) {
      if (weapon.lv < MAX_LV) pool.push({ kind: 'w', id: weapon.id });
      else if (game.endless) pool.push({ kind: 'ow', id: weapon.id });
    }
  },

  addEvolutionRewards(game, pool) {
    const choices = game.evolutionChoices ? game.evolutionChoices() : [];
    pool.push(...choices);
  },

  addPassiveRewards(game, pool) {
    for (const id in game.player.passives) {
      if (game.player.passives[id] < MAX_LV) pool.push({ kind: 'p', id });
    }
  },

  addNewPassiveRewards(game, pool) {
    if (Object.keys(game.player.passives).length >= maxPassiveSlotsFor(game)) return;
    for (const id in PASSIVES) {
      if (!(id in game.player.passives)) pool.push({ kind: 'np', id });
    }
  },

  addNewWeaponRewards(game, pool) {
    if (game.player.weapons.length >= maxWeaponSlotsFor(game)) return;
    for (const id in WEAPONS) {
      if (!game.player.weapons.find(weapon => weapon.id === id)) pool.push({ kind: 'nw', id });
    }
  },

  addCompanionRewards(game, pool) {
    if (!game.companionChoices) return;
    pool.push(...game.companionChoices());
  },

  addTranscendRewardsIfEmpty(pool) {
    if (pool.length) return;
    for (const upgrade of TRANSCEND) pool.push({ kind: 't', id: upgrade.id });
  },
};
