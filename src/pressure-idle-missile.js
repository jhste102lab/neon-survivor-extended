'use strict';
// Idle-pressure missile hazard pattern.
Object.assign(Game, {
  spawnIdleMissilePattern(context) {
    const rolls = [];
    for (let i = 0; i < context.n; i++) rolls.push({ angle: rand(0, TAU), spread: rand(58, 122 + context.idleK * 38) });
    const commands = PressurePatternPlans.idleMissiles(context, rolls);
    PressurePatternPlans.apply(this, commands);
    return commands;
  },
});
