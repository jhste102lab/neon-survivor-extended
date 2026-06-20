'use strict';
// Player projectile outcome application: gameplay iteration returns data, this owns side effects.
const PlayerBulletOutcomes = {
  applyAll(game, outcomes = [], st = null) {
    for (const outcome of outcomes) this.apply(game, outcome, st);
  },

  apply(game, outcome, st = null) {
    if (!outcome || !outcome.type) return;
    if (outcome.type === 'setBoomCooldown') {
      outcome.enemy.boomCd = outcome.value;
    } else if (outcome.type === 'rememberHit') {
      outcome.bullet.hitSet = outcome.bullet.hitSet || new Set();
      outcome.bullet.hitSet.add(outcome.enemy);
    } else if (outcome.type === 'slowEnemy') {
      outcome.enemy.slowT = Math.max(outcome.enemy.slowT || 0, outcome.duration);
      outcome.enemy.slowK = Math.max(outcome.enemy.slowK || 0, outcome.factor);
    } else if (outcome.type === 'vulnerableEnemy') {
      outcome.enemy.vulnerableT = Math.max(outcome.enemy.vulnerableT || 0, outcome.duration);
      outcome.enemy.vulnerableK = Math.max(outcome.enemy.vulnerableK || 0, outcome.factor);
    } else if (outcome.type === 'damageEnemy') {
      game.damageEnemy(outcome.enemy, outcome.damage, outcome.knockX, outcome.knockY, outcome.source);
    } else if (outcome.type === 'explode') {
      game.explode(outcome.x, outcome.y, outcome.radius, outcome.damage, outcome.source, !!outcome.child, outcome.color);
    } else if (outcome.type === 'burst') {
      game.spawnBurst(outcome.x, outcome.y, outcome.color, outcome.count, outcome.speed, outcome.size, outcome.life);
    } else if (outcome.type === 'particle') {
      game.spawnParticle(outcome.x, outcome.y, outcome.vx, outcome.vy, outcome.life, outcome.size, outcome.color, outcome.alpha);
    } else if (outcome.type === 'sound') {
      GameRuntime.playSound(outcome.name, ...(outcome.args || []));
    } else if (outcome.type === 'healPlayer') {
      const stNow = game.st || st || game.stat();
      if (outcome.hp) game.player.hp = Math.min(stNow.maxHp, game.player.hp + outcome.hp);
      if (outcome.barrier) game.player.barrier = Math.min(outcome.maxBarrier || 42, (game.player.barrier || 0) + outcome.barrier);
    } else if (outcome.type === 'decrementPierce') {
      outcome.bullet.pierce = Math.max(0, (outcome.bullet.pierce || 0) - (outcome.amount || 1));
    } else if (outcome.type === 'spawnPlayerBullet') {
      game.pushPlayerBullet(outcome.bullet);
    }
  },
};
