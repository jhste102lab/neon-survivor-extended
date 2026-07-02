'use strict';
// Enemy damage resolution: damage modifiers, hit state, and kill/boss handoff.
const CombatDamage = (() => {
  function enemyCanTakeDamage(enemy) {
    return !(enemy.hp <= 0);
  }

  function applyProtectionModifier(game, enemy, damage) {
    return game.enemyProtected && game.enemyProtected(enemy) ? damage * 0.55 : damage;
  }

  function applyVulnerabilityModifier(enemy, damage) {
    return enemy.vulnerableT > 0 ? damage * (1 + (enemy.vulnerableK || 0.12)) : damage;
  }

  function rollCriticalHit(game) {
    return RNG.next() < (game.st ? game.st.crit : CFG.critChance);
  }

  function applyCriticalModifier(damage, crit) {
    return crit ? damage * CFG.critMult : damage;
  }

  function resolveEnemyDamageAmount(game, enemy, damage) {
    let resolvedDamage = damage;
    if (game.dimensionDamageMultiplierForEnemy) resolvedDamage *= game.dimensionDamageMultiplierForEnemy(enemy);
    resolvedDamage = applyProtectionModifier(game, enemy, resolvedDamage);
    resolvedDamage = applyVulnerabilityModifier(enemy, resolvedDamage);
    const crit = rollCriticalHit(game);
    resolvedDamage = applyCriticalModifier(resolvedDamage, crit);
    return { damage: resolvedDamage, crit };
  }

  function recordDamageSource(game, source, damage) {
    if (game.metrics && game.metrics.damageBySource) game.metrics.damageBySource[source] = (game.metrics.damageBySource[source] || 0) + damage;
  }

  function subtractEnemyHealth(enemy, damage) {
    enemy.hp -= damage;
  }

  function rememberEnemyHitSource(enemy, source) {
    enemy.lastHitSource = source;
  }

  function flashEnemy(enemy) {
    enemy.flash = 0.09;
  }

  function applyEnemyKnockback(enemy, kx, ky) {
    const controlScale = CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale;
    enemy.kx += kx * controlScale * (enemy.boss ? 0.05 : 1);
    enemy.ky += ky * controlScale * (enemy.boss ? 0.05 : 1);
  }

  function applyEnemyHitState(enemy, damage, kx, ky, source) {
    subtractEnemyHealth(enemy, damage);
    rememberEnemyHitSource(enemy, source);
    flashEnemy(enemy);
    applyEnemyKnockback(enemy, kx, ky);
  }

  function finishEnemyDamage(game, enemy) {
    if (enemy.hp <= 0) game.killEnemy(enemy);
    else if (game.resolveStackDamageDeaths && game.resolveStackDamageDeaths(enemy)) CombatUiFx.updateBossDamageBar(game, enemy);
    else CombatUiFx.updateBossDamageBar(game, enemy);
  }

  function buildEnemyDamageOutcome(game, enemy, damage, kx, ky, source) {
    if (!enemyCanTakeDamage(enemy)) return { hit: false, source, damage: 0, crit: false, kx: 0, ky: 0, kill: false };
    const hit = resolveEnemyDamageAmount(game, enemy, damage);
    return { hit: true, source, damage: hit.damage, crit: hit.crit, kx, ky, kill: enemy.hp - hit.damage <= 0 };
  }

  function applyEnemyDamageOutcome(game, enemy, outcome) {
    if (!outcome.hit) return;
    recordDamageSource(game, outcome.source, outcome.damage);
    applyEnemyHitState(enemy, outcome.damage, outcome.kx, outcome.ky, outcome.source);
    CombatUiFx.showEnemyDamage(game, enemy, outcome.damage, outcome.crit);
    finishEnemyDamage(game, enemy);
  }

  return {
    buildEnemyDamageOutcome(e, dmg, kx = 0, ky = 0, source = 'unknown') {
      return buildEnemyDamageOutcome(this, e, dmg, kx, ky, source);
    },

    damageEnemy(e, dmg, kx = 0, ky = 0, source = 'unknown') {
      const outcome = buildEnemyDamageOutcome(this, e, dmg, kx, ky, source);
      applyEnemyDamageOutcome(this, e, outcome);
    },
  };
})();
