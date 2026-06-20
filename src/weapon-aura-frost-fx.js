'use strict';
// Spawns frost aura ambient particles only.
(function () {
  const fx = globalThis.WeaponAuraFrostFx || (globalThis.WeaponAuraFrostFx = Object.create(null));

  function shouldSpawnAuraParticle() {
    return RNG.next() < 0.25;
  }

  function auraParticleColor(evolved) {
    return evolved ? '#e8fbff' : '#bfe9ff';
  }

  function spawnAuraParticle(game, player, radius, evolved) {
    const angle = rand(0, TAU);
    const ringRadius = rand(20, radius);
    game.spawnParticle(
      player.x + Math.cos(angle) * ringRadius,
      player.y + Math.sin(angle) * ringRadius,
      rand(-8, 8),
      rand(-16, -5),
      0.9,
      4,
      auraParticleColor(evolved),
      0.985
    );
  }

  function maybeSpawnAuraParticle(game, player, radius, evolved) {
    if (!shouldSpawnAuraParticle()) return;
    spawnAuraParticle(game, player, radius, evolved);
  }

  fx.maybeSpawnAuraParticle = maybeSpawnAuraParticle;
}());
