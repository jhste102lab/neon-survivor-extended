'use strict';
// Public loot facade. Responsibility-specific behavior lives in loot-*.js.
(function attachLootModules() {
  const missing = [];
  if (typeof LootOutcomes === 'undefined') missing.push('loot-outcomes.js');
  if (typeof LootGems === 'undefined') missing.push('loot-gems.js');
  if (typeof LootDrops === 'undefined') missing.push('loot-drops.js');
  if (typeof LootChest === 'undefined') missing.push('loot-chest.js');
  if (missing.length) {
    throw new Error(`Loot helper scripts missing: ${missing.join(', ')}. Load loot-gems.js, loot-drops.js, and loot-chest.js before loot.js.`);
  }

  Object.assign(Game, LootGems, LootDrops, LootChest);
})();
