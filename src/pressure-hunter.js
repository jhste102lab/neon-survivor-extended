'use strict';
// Late-pressure hunter bullet pattern.
Object.assign(Game, {
  spawnLateHunterTrap(context) {
    const commands = PressurePatternPlans.lateHunter(context, rand(0, TAU));
    PressurePatternPlans.apply(this, commands);
    return commands;
  },
});
