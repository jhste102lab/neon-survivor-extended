'use strict';
// Boss movement vector from current dash state.
function getMegaBossCloseOrbitMovement(e, dx, dy, dist) {
  if (!(e.bossDef && e.bossDef.mega) || e.dashState === 2) return null;
  const contactDist = (e.r || 0) + CFG.player.radius;
  const orbitDist = contactDist + 46;
  if (dist >= orbitDist) return null;
  const d = Math.max(1, dist);
  if (e.closeOrbitDir == null) e.closeOrbitDir = (Math.floor(e.x + e.y) & 1) ? -1 : 1;
  const tangent = e.spd * 0.46 * clamp((orbitDist - dist) / Math.max(1, orbitDist - contactDist), 0.35, 1);
  const outward = dist < contactDist ? e.spd * 0.28 * (1 - dist / Math.max(1, contactDist)) : 0;
  return {
    mvx: (-dy / d) * tangent * e.closeOrbitDir - (dx / d) * outward,
    mvy: (dx / d) * tangent * e.closeOrbitDir - (dy / d) * outward,
  };
}

function getBossMovement(e, dx, dy, dist, enrage) {
  const closeOrbit = getMegaBossCloseOrbitMovement(e, dx, dy, dist);
  if (closeOrbit) return closeOrbit;
  if (e.dashState === 2) {
    const dashMul = e.bossDef && e.bossDef.mega ? 1.16 : 4.4;
    return {
      mvx: Math.cos(e.dashDir) * e.spd * dashMul * (1 + enrage * 0.12),
      mvy: Math.sin(e.dashDir) * e.spd * dashMul * (1 + enrage * 0.12),
    };
  }
  if (e.dashState === 1) return { mvx: dx / dist * e.spd * 0.2, mvy: dy / dist * e.spd * 0.2 };
  const chaseMul = e.bossDef && e.bossDef.mega ? (1 + enrage * 0.035) : (1 + enrage * 0.10);
  return { mvx: dx / dist * e.spd * chaseMul, mvy: dy / dist * e.spd * chaseMul };
}
