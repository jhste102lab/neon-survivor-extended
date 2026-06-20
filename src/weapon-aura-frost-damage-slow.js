'use strict';
// Applies frost aura enemy slow and damage only.
(function () {
  const frost = globalThis.WeaponAuraFrostDamageSlow || (globalThis.WeaponAuraFrostDamageSlow = Object.create(null));

  function auraRadius(stats, evolved) {
    return stats.radius * (evolved ? 1.18 : 1);
  }

  function stepDamageTick(weapon, dt, evolved) {
    weapon.tick = (weapon.tick || 0) - dt;
    const doDamage = weapon.tick <= 0;
    if (doDamage) weapon.tick = evolved ? 0.48 : 0.55;
    return doDamage;
  }

  function slowAmount(stats, evolved) {
    return Math.min(0.82, stats.slow + (evolved ? 0.08 : 0));
  }

  function applySlow(enemy, stats, evolved) {
    enemy.slowT = 0.25;
    enemy.slowK = slowAmount(stats, evolved);
  }

  function frostDamage(stats, combatStats, evolved) {
    return stats.dps * (evolved ? 0.68 : 0.55) * combatStats.dmg;
  }

  function frostDamageSource(evolved) {
    return evolved ? 'weapon:frost:evolved' : 'weapon:frost';
  }

  function enemyInsideDamageRadius(player, enemy, radius) {
    return dist2(player.x, player.y, enemy.x, enemy.y) < radius * radius;
  }

  function damageEnemyIfReady(game, enemy, context) {
    if (!context.doDamage) return;
    if (!enemyInsideDamageRadius(context.player, enemy, context.radius)) return;
    game.damageEnemy(
      enemy,
      frostDamage(context.stats, context.combatStats, context.evolved),
      0,
      0,
      frostDamageSource(context.evolved)
    );
  }

  function applyAuraToEnemy(game, enemy, context) {
    applySlow(enemy, context.stats, context.evolved);
    damageEnemyIfReady(game, enemy, context);
  }

  function applyToEnemies(game, player, stats, combatStats, evolved, radius, doDamage) {
    const context = { player, stats, combatStats, evolved, radius, doDamage };
    Grid.forEachInCircle(player.x, player.y, radius, enemy => {
      applyAuraToEnemy(game, enemy, context);
    });
  }

  frost.auraRadius = auraRadius;
  frost.stepDamageTick = stepDamageTick;
  frost.applyToEnemies = applyToEnemies;
}());
