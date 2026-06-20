'use strict';
// Public combat facade. Responsibility-specific behavior lives in combat-*.js.
(function attachCombatModules() {
  const missing = [];
  if (typeof CombatUiFx === 'undefined') missing.push('combat-ui-fx.js');
  if (typeof CombatDamage === 'undefined') missing.push('combat-damage.js');
  if (typeof CombatKills === 'undefined') missing.push('combat-kills.js');
  if (typeof CombatPlayer === 'undefined') missing.push('combat-player.js');
  if (typeof Game.grantEnemyDeathRewards !== 'function') missing.push('enemy-death-rewards.js');
  if (missing.length) {
    throw new Error(`Combat helper scripts missing: ${missing.join(', ')}. Load enemy-death-rewards.js and combat-*.js before combat.js.`);
  }

  Object.assign(Game, CombatKills, CombatDamage, CombatPlayer);
})();
