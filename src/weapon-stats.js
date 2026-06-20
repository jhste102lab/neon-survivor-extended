'use strict';
// Upgrade caps and weapon stat scaling helpers.
const MAX_WEAPONS = 5, ENDLESS_MAX_WEAPONS = Object.keys(WEAPONS).length, MAX_PASSIVES = 4, MAX_LV = 5;


function weaponStats(id, lv) {
  const base = { ...WEAPONS[id].stats(Math.min(lv, MAX_LV)) };
  const over = Math.max(0, lv - MAX_LV);
  if (!over) return base;
  const earlyOver = Math.min(over, 5);
  const lateOver = Math.max(0, over - 5);
  const shapeOver = earlyOver + Math.sqrt(lateOver) * 1.15;
  const dmgMul = Math.pow(1.13, earlyOver) * Math.pow(1.045, lateOver);
  if ('dmg' in base) base.dmg *= dmgMul;
  if ('dps' in base) base.dps *= dmgMul;
  if ('cd' in base) base.cd *= Math.pow(0.965, earlyOver) * Math.pow(0.985, lateOver);
  if ('radius' in base) base.radius *= 1 + shapeOver * 0.04;
  if ('blast' in base) base.blast *= 1 + shapeOver * 0.04;
  if ('dist' in base) base.dist *= 1 + shapeOver * 0.035;
  if ('speed' in base) base.speed *= 1 + Math.min(0.28, shapeOver * 0.025);
  if ('count' in base) base.count += Math.floor((shapeOver + 2) / 5);
  if ('pierce' in base) base.pierce += Math.floor((shapeOver + 1) / 3);
  if ('chain' in base) base.chain += Math.floor((shapeOver + 1) / 3);
  if ('strikes' in base) base.strikes += Math.floor((shapeOver + 2) / 5);
  if ('pulses' in base) base.pulses += Math.floor((shapeOver + 3) / 5);
  if ('slow' in base) base.slow = Math.min(0.74, base.slow + shapeOver * 0.012);
  return base;
}

function maxWeaponSlotsFor(game) {
  const interval = CFG.weaponSlotInterval || 300;
  const step = CFG.weaponSlotStep || 5;
  const t = Math.max(0, game && Number.isFinite(game.time) ? game.time : 0);
  const slots = MAX_WEAPONS + Math.floor(t / interval) * step;
  return Math.min(ENDLESS_MAX_WEAPONS, slots);
}

function maxPassiveSlotsFor(game) {
  return (game.endless || game.time >= (CFG.unlockTime || CFG.winTime)) ? Object.keys(PASSIVES).length : MAX_PASSIVES;
}
