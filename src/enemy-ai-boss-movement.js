'use strict';
// Boss movement vector from current dash state.
function getBossMovement(e, dx, dy, dist, enrage) {
  if (e.dashState === 2) {
    const dashMul = e.bossDef && e.bossDef.mega ? 1.55 : 4.4;
    return {
      mvx: Math.cos(e.dashDir) * e.spd * dashMul * (1 + enrage * 0.12),
      mvy: Math.sin(e.dashDir) * e.spd * dashMul * (1 + enrage * 0.12),
    };
  }
  if (e.dashState === 1) return { mvx: dx / dist * e.spd * 0.2, mvy: dy / dist * e.spd * 0.2 };
  return { mvx: dx / dist * e.spd * (1 + enrage * 0.10), mvy: dy / dist * e.spd * (1 + enrage * 0.10) };
}
