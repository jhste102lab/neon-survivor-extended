'use strict';
// Pulls pickups for evolved frost only.
(function () {
  const pickupPull = globalThis.WeaponAuraFrostPickupPull || (globalThis.WeaponAuraFrostPickupPull = Object.create(null));

  function pullDistanceSquared(radius) {
    return (radius * 1.55) ** 2;
  }

  function magnetizeGemIfNear(player, gem, pull2) {
    if (gem.mag) return;
    if (dist2(player.x, player.y, gem.x, gem.y) >= pull2) return;
    const controlScale = CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale;
    gem.mag = true;
    gem.ms = Math.max(gem.ms || 0, 420 * controlScale);
  }

  function pullDropIfNear(player, drop, pull2, dt) {
    if (dist2(player.x, player.y, drop.x, drop.y) >= pull2) return;
    const distance = Math.hypot(player.x - drop.x, player.y - drop.y) || 1;
    const controlScale = CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale;
    drop.x += (player.x - drop.x) / distance * 210 * controlScale * dt;
    drop.y += (player.y - drop.y) / distance * 210 * controlScale * dt;
  }

  function pullPickups(game, player, radius, dt) {
    const pull2 = pullDistanceSquared(radius);
    for (const gem of game.gems) magnetizeGemIfNear(player, gem, pull2);
    for (const drop of game.drops) pullDropIfNear(player, drop, pull2, dt);
  }

  pickupPull.pullPickups = pullPickups;
}());
