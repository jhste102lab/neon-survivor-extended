'use strict';
// Charger special enemy charge-state behavior and movement.
function updateSpecialEnemyCharger(_game, e, dt, _st, dx, dy, dist) {
  e.chargeT -= dt;
  if (e.chargeState === 0 && e.chargeT <= 0 && dist < 620) {
    e.chargeState = 1;
    e.chargeWarn = 0.72;
    e.chargeDir = Math.atan2(dy, dx);
  } else if (e.chargeState === 1) {
    e.chargeWarn -= dt;
    if (e.chargeWarn <= 0) {
      e.chargeState = 2;
      e.chargeT = 0.58;
      GameRuntime.playSound('missile');
    }
  } else if (e.chargeState === 2) {
    e.chargeT -= dt;
    if (e.chargeT <= 0) {
      e.chargeState = 0;
      e.chargeT = rand(3.0, 4.6);
    }
  }
  if (e.chargeState === 2) return { mvx: Math.cos(e.chargeDir) * e.spd * 4.8, mvy: Math.sin(e.chargeDir) * e.spd * 4.8 };
  if (e.chargeState === 1) return { mvx: dx / dist * e.spd * 0.2, mvy: dy / dist * e.spd * 0.2 };
  return { mvx: dx / dist * e.spd * 1.12, mvy: dy / dist * e.spd * 1.12 };
}
