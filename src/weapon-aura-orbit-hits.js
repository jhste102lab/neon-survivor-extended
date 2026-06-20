'use strict';
// Applies orbit blade combat hits without geometry or effects responsibilities.
(function () {
  const hits = globalThis.WeaponAuraOrbitHits || (globalThis.WeaponAuraOrbitHits = Object.create(null));
  const BLADE_HIT_RADIUS = 26;

  function canHitEnemy(enemy) {
    return !(enemy.orbitCd > 0);
  }

  function setHitCooldown(enemy, stats, evolved) {
    enemy.orbitCd = stats.hitCd * (evolved ? 0.88 : 1);
  }

  function orbitDamage(stats, combatStats, evolved, ringIndex) {
    return stats.dmg * combatStats.dmg * (ringIndex ? 0.62 : 1) * (evolved ? 1.05 : 1);
  }

  function orbitKnockback(enemy) {
    return 160 * enemy.def.knock;
  }

  function orbitDamageSource(evolved) {
    return evolved ? 'weapon:orbit:evolved' : 'weapon:orbit';
  }

  function damageEnemyWithBlade(game, enemy, blade, context) {
    const kb = orbitKnockback(enemy);
    game.damageEnemy(
      enemy,
      orbitDamage(context.stats, context.combatStats, context.evolved, blade.ringIndex),
      Math.cos(blade.angle) * kb,
      Math.sin(blade.angle) * kb,
      orbitDamageSource(context.evolved)
    );
  }

  function grantEvolvedBarrier(game, player) {
    const idleK = game.idleRecoverySuppression ? game.idleRecoverySuppression() : 0;
    const gain = 0.45 * (1 - idleK * 0.88);
    if (gain > 0.03) player.barrier = Math.min(36 * (1 - idleK * 0.5), (player.barrier || 0) + gain);
  }

  function hitEnemyWithBlade(game, enemy, blade, context) {
    if (!canHitEnemy(enemy)) return false;
    setHitCooldown(enemy, context.stats, context.evolved);
    damageEnemyWithBlade(game, enemy, blade, context);
    if (context.evolved) grantEvolvedBarrier(game, context.player);
    return true;
  }

  function hitEnemiesNearBlade(game, blade, context, onHit) {
    Grid.forEachInCircle(blade.x, blade.y, BLADE_HIT_RADIUS, enemy => {
      if (!hitEnemyWithBlade(game, enemy, blade, context)) return;
      if (onHit) onHit(blade, enemy);
    });
  }

  hits.hitEnemiesNearBlade = hitEnemiesNearBlade;
}());
