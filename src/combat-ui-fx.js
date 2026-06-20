'use strict';
// Combat presentation side effects: HUD nudges, sounds, bursts, and floating text.
const CombatUiFx = {
  resetComboHud() {
    GameRuntime.resetComboHud();
  },

  showCombo(combo) {
    GameRuntime.showCombo(combo);
  },

  markKillsDirty() {
    GameRuntime.markKillsDirty();
  },

  playEnemyDeathSound() {
    GameRuntime.playSound('enemyDie');
  },

  showEnemyDamage(game, enemy, damage, crit) {
    game.spawnText(enemy.x + rand(-10, 10), enemy.y - enemy.r - 4, Math.round(damage), crit);
  },

  updateBossDamageBar(game, enemy) {
    if (enemy.boss && enemy === game.boss) GameRuntime.updateBossBar(enemy);
  },

  showEnemyDeathBurst(game, enemy) {
    game.spawnBurst(enemy.x, enemy.y, enemy.elite ? '#ffd23d' : enemy.def.color, enemy.boss ? 40 : (enemy.elite ? 18 : 8), enemy.boss ? 320 : 170, enemy.boss ? 9 : 6, enemy.boss ? 0.9 : 0.45);
  },

  showBarrierBlock(game, player) {
    game.spawnText(player.x, player.y - 36, 'BLOCK', false, '#7dffc1');
  },

  playPlayerHurtFeedback(game) {
    GameRuntime.playSound('hurt');
    game.shake(7, 0.3);
    GameRuntime.flashEffect('hurtfx', 0.5);
  },

  playPlayerDeathFeedback(game, player) {
    GameRuntime.playSound('death');
    GameRuntime.stopMusic();
    game.spawnBurst(player.x, player.y, '#19e3ff', 50, 360, 10, 1.1);
    game.spawnBurst(player.x, player.y, '#ffffff', 24, 220, 7, 0.8);
    game.shake(16, 0.9);
    game.hitStop(0.5, 0.12);
  },
};
