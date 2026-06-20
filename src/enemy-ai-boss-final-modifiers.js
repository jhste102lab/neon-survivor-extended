'use strict';
// Boss final-phase movement modifiers.
function applyBossFinalMovementModifiers(e, movement) {
  if (e.hp < e.maxHp * 0.3) return { mvx: movement.mvx * 1.25, mvy: movement.mvy * 1.25 };
  return movement;
}
