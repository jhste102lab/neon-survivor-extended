'use strict';
// Bulwark special enemy shielding-body movement.
function updateSpecialEnemyBulwark(_game, e, dt, _st, dx, dy, dist) {
  e.wobble += dt * 1.5;
  return { mvx: dx / dist * e.spd * 0.75 + Math.cos(e.wobble) * 10, mvy: dy / dist * e.spd * 0.75 + Math.sin(e.wobble) * 10 };
}
