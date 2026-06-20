'use strict';
// Enemy kill resolution: removal, metrics, combo, and death reward delegation.
const CombatKills = (() => {
  function clearComboState(game) {
    game.combo = 0;
    game.comboT = 0;
  }

  function removeEnemy(game, enemy) {
    const idx = game.enemies.indexOf(enemy);
    if (idx < 0) return false;
    game.enemies[idx] = game.enemies[game.enemies.length - 1];
    game.enemies.pop();
    return true;
  }

  function incrementKillCount(game) {
    game.kills++;
  }

  function recordKillSource(game, enemy) {
    game.metrics.killsBySource[enemy.lastHitSource || 'unknown'] = (game.metrics.killsBySource[enemy.lastHitSource || 'unknown'] || 0) + 1;
  }

  function recordSpecialKill(game, enemy) {
    if (enemy.special) game.metrics.specialKills[enemy.special] = (game.metrics.specialKills[enemy.special] || 0) + 1;
  }

  function recordBossKill(game, enemy) {
    if (enemy.boss) game.metrics.bossesKilled = (game.metrics.bossesKilled || 0) + 1;
  }

  function recordKillMetrics(game, enemy) {
    recordKillSource(game, enemy);
    recordSpecialKill(game, enemy);
    recordBossKill(game, enemy);
  }

  function advanceCombo(game) {
    game.combo++;
    game.comboT = 2;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
  }

  function showComboIfReady(game) {
    if (game.combo >= 1) CombatUiFx.showCombo(game.combo);
  }

  function notifyKillHud() {
    CombatUiFx.markKillsDirty();
  }

  function playKillSound() {
    CombatUiFx.playEnemyDeathSound();
  }

  function showKillBurst(game, enemy) {
    CombatUiFx.showEnemyDeathBurst(game, enemy);
  }

  function requireEnemyDeathRewards(game) {
    if (typeof game.grantEnemyDeathRewards !== 'function') {
      throw new Error('Enemy death reward helper missing. Load enemy-death-rewards.js after loot.js and before gameplay starts.');
    }
  }

  function grantEnemyDeathRewards(game, enemy) {
    requireEnemyDeathRewards(game);
    game.grantEnemyDeathRewards(enemy);
  }

  function buildKillEnemyOutcome(game, enemy) {
    const idx = game.enemies.indexOf(enemy);
    if (idx < 0) return { killed: false, enemy, index: -1, effects: [] };
    return {
      killed: true,
      enemy,
      index: idx,
      source: enemy.lastHitSource || 'unknown',
      special: enemy.special || '',
      boss: !!enemy.boss,
      effects: [
        { type: 'combo' },
        { type: 'hudKillsDirty' },
        { type: 'soundEnemyDie' },
        { type: 'deathBurst' },
        { type: 'deathRewards' },
      ],
    };
  }

  function applyKillEnemyOutcome(game, outcome) {
    if (!outcome.killed) return false;
    if (!removeEnemy(game, outcome.enemy)) return false;
    incrementKillCount(game);
    recordKillMetrics(game, outcome.enemy);
    for (const effect of outcome.effects) {
      if (effect.type === 'combo') { advanceCombo(game); showComboIfReady(game); }
      else if (effect.type === 'hudKillsDirty') notifyKillHud();
      else if (effect.type === 'soundEnemyDie') playKillSound();
      else if (effect.type === 'deathBurst') showKillBurst(game, outcome.enemy);
      else if (effect.type === 'deathRewards') grantEnemyDeathRewards(game, outcome.enemy);
    }
    return true;
  }

  return {
    buildKillEnemyOutcome(e) {
      return buildKillEnemyOutcome(this, e);
    },

    applyKillEnemyOutcome(outcome) {
      return applyKillEnemyOutcome(this, outcome);
    },

    breakCombo() {
      clearComboState(this);
      CombatUiFx.resetComboHud();
    },

    killEnemy(e) {
      const outcome = buildKillEnemyOutcome(this, e);
      applyKillEnemyOutcome(this, outcome);
    },
  };
})();
