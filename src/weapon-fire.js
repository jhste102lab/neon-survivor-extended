'use strict';
// Dispatches active weapon firing to registered one-responsibility weapon handlers.
(function () {
  const registry = globalThis.NeonSurvivorRegistry;
  if (!registry || typeof registry.getWeaponFireHandler !== 'function') {
    throw new Error('NeonSurvivorRegistry missing. Load namespace.js before weapon fire handlers.');
  }

  function currentPlayerDirectionAngle(game, player) {
    if (Math.hypot(player.moveX || 0, player.moveY || 0) > 0.2) return Math.atan2(player.moveY, player.moveX);
    const target = game.visibleOrNearestEnemies
      ? game.visibleOrNearestEnemies(player.x, player.y, 1, 900, 240)[0]
      : (game.nearestEnemies(player.x, player.y, 1, 900)[0] || game.strongestEnemy());
    return target ? Math.atan2(target.y - player.y, target.x - player.x) : rand(0, TAU);
  }

  function requiredWeaponIds() {
    return Object.keys(typeof WEAPONS !== 'undefined' ? WEAPONS : {}).filter(id => id !== 'orbit' && id !== 'frost');
  }

  Object.assign(Game, {
    assertWeaponFireHandlers() {
      registry.assertWeaponFireHandlers(requiredWeaponIds());
    },

    fireWeapon(w, s, st) {
      const p = this.player;
      const evolved = this.weaponEvolved && this.weaponEvolved(w.id);
      const handler = registry.getWeaponFireHandler(w.id);
      if (!handler) {
        throw new Error(`Missing weapon fire handler for active weapon: ${w.id}`);
      }

      handler.call(this, w, s, st, {
        player: p,
        evolved,
        playerDirAngle: () => currentPlayerDirectionAngle(this, p),
      });
    },
  });
}());
