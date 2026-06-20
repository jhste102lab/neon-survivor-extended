'use strict';
// Late-pressure lane trap pattern.
Object.assign(Game, {
  spawnLateLaneTrap(context) {
    const commands = PressurePatternPlans.lateLane(context, randi(-1, 1));
    PressurePatternPlans.apply(this, commands);
    return commands;
  },
});
