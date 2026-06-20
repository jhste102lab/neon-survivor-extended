'use strict';
// Computes orbit blade geometry without combat or effects side effects.
(function () {
  const geometry = globalThis.WeaponAuraOrbitGeometry || (globalThis.WeaponAuraOrbitGeometry = Object.create(null));

  function advanceAngle(blades, stats, evolved, dt) {
    blades.angle += stats.rot * (evolved ? 1.08 : 1) * dt;
  }

  function ringCount(evolved) {
    return evolved ? 2 : 1;
  }

  function ringRadius(stats, evolved, ringIndex) {
    if (evolved && ringIndex === 1) return stats.radius * 0.64;
    return stats.radius;
  }

  function bladeCount(stats, evolved, ringIndex) {
    return stats.count + (evolved && ringIndex === 0 ? 1 : 0);
  }

  function bladeAngle(baseAngle, ringIndex, bladeIndex, count) {
    return baseAngle * (ringIndex ? -1.15 : 1) + bladeIndex / count * TAU;
  }

  function bladePosition(player, radius, angle, ringIndex) {
    return {
      x: player.x + Math.cos(angle) * radius,
      y: player.y + Math.sin(angle) * radius,
      angle,
      ringIndex,
    };
  }

  function bladePositions(player, stats, evolved, baseAngle) {
    const blades = [];
    for (let ringIndex = 0; ringIndex < ringCount(evolved); ringIndex++) {
      const radius = ringRadius(stats, evolved, ringIndex);
      const count = bladeCount(stats, evolved, ringIndex);
      for (let bladeIndex = 0; bladeIndex < count; bladeIndex++) {
        const angle = bladeAngle(baseAngle, ringIndex, bladeIndex, count);
        blades.push(bladePosition(player, radius, angle, ringIndex));
      }
    }
    return blades;
  }

  geometry.advanceAngle = advanceAngle;
  geometry.bladePositions = bladePositions;
}());
