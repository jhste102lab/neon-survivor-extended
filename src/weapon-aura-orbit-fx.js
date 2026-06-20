'use strict';
// Spawns orbit blade hit audiovisual feedback only.
(function () {
  const fx = globalThis.WeaponAuraOrbitFx || (globalThis.WeaponAuraOrbitFx = Object.create(null));

  function hitColor(evolved) {
    return evolved ? '#7dffc1' : '#3dff8e';
  }

  function spawnHitBurst(game, blade, evolved) {
    game.spawnBurst(blade.x, blade.y, hitColor(evolved), 3, 90, 4, 0.2);
  }

  function playHitSound() {
    GameRuntime.playSound('hit');
  }

  function spawnBladeHitFx(game, blade, evolved) {
    spawnHitBurst(game, blade, evolved);
    playHitSound();
  }

  fx.spawnBladeHitFx = spawnBladeHitFx;
}());
