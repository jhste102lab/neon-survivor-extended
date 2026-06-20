'use strict';
// Transcend upgrade side effects on uncapped growth stats.
const TranscendUpgradeApplicator = {
  apply(game, choice) {
    if (choice.id === 'tdmg') return this.increaseDamage(game.player);
    if (choice.id === 'tcd') return this.increaseCooldown(game.player);
    if (choice.id === 'tspd') return this.increaseSpeed(game.player);
    if (choice.id === 'thp') return this.increaseHealth(game);
    return UpgradeApplyResults.reject(choice, 'unknown transcend upgrade');
  },

  increaseDamage(player) {
    player.transcend.dmg++;
    return UpgradeApplyResults.done();
  },

  increaseCooldown(player) {
    player.transcend.cd++;
    return UpgradeApplyResults.done();
  },

  increaseSpeed(player) {
    player.transcend.spd++;
    return UpgradeApplyResults.done();
  },

  increaseHealth(game) {
    game.player.transcend.hp++;
    UpgradeApplyHealth.restore(game, 20);
    return UpgradeApplyResults.done();
  },
};
