'use strict';
// Late-pressure ring trap pattern.
Object.assign(Game, {
  spawnLateRingTrap(context) {
    const n = 5 + Math.min(4, Math.floor(context.threat / 1.8));
    const commands = PressurePatternPlans.lateRing(context, rand(0, TAU), randi(0, n - 1));
    PressurePatternPlans.apply(this, commands);
    return commands;
  },
});
