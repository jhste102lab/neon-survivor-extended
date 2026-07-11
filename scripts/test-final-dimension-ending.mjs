import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({
  console,
  CFG: { winTime: 600, clearTime: 1200, dimensionRift: { firstCheck: 120, lastRandomCheck: 480, interval: 120, chance: 0.3, offerLife: 36, offerRadius: 104 } },
  DIMENSIONS: [{ id: 'mirror_corridor', icon: '🔷', name: '거울 회랑', color: '#9ff3ff' }],
  DimensionRiftRules: { get: () => ({ icon: '🌀', name: '균열', color: '#fff' }) },
  FIELD_EVENTS: { rift: { icon: '🌀', name: '균열', color: '#fff' } },
  FieldEventDefinitions: { ids: () => ['rift'], require: () => ({ offerLife: 28, offerRadius: 92, activeLife: 24, activeRadius: 122, update() {} }) },
  RNG: { next: () => 0.1 },
  GameRuntime: { banner() {} },
  tr: key => key,
  pick: items => items[0],
  rand: (a, b) => (a + b) / 2,
  TAU: Math.PI * 2,
  dist2: () => 0,
  Game: {
    time: 120, player: { x: 10, y: 20, dead: false }, metrics: { eventOffers: 0 },
    nextDimensionRiftT: 120, finalDimensionRiftOffered: false, activeEvent: null,
    eventSpawnBlocked: () => false,
    enterAutomaticDimensionRift(id) { this.entered = id; return true; },
  },
});
vm.runInContext(readFileSync('src/events.js', 'utf8'), context, { filename: 'src/events.js' });

context.Game.updateDimensionRiftOfferSchedule();
assert.equal(context.Game.activeEvent.dimension, 'mirror_corridor');
assert.equal(context.Game.nextDimensionRiftT, 240);
context.Game.activateEvent(context.Game.activeEvent);
assert.equal(context.Game.entered, 'mirror_corridor', 'entering the portal should start the dimension immediately');
assert.equal(context.Game.activeEvent, null);

context.Game.time = 600;
context.Game.activeEvent = null;
assert.equal(context.Game.offerFinalDimensionRift(30, 40), true);
assert.equal(context.Game.finalDimensionRiftOffered, true);
assert.equal(context.Game.activeEvent.final, undefined); // final is scheduler state, not trusted event payload
context.Game.activeEvent = null;
assert.equal(context.Game.offerFinalDimensionRift(30, 40), false, 'final boss portal must be offered only once');

const ending = vm.createContext({
  CFG: { clearTime: 1200 }, UI: { calls: 0, win() { this.calls++; } },
  Game: { time: 1200, state: 'play', player: { dead: false }, cleared20: false, activeEvent: null, levelQueue: 0, isDimensionSpaceActive: () => false },
});
vm.runInContext(readFileSync('src/game-loop-post-update.js', 'utf8'), ending, { filename: 'src/game-loop-post-update.js' });
ending.Game.showEndingIfReady(ending.Game.player);
assert.equal(ending.Game.cleared20, true);
assert.equal(ending.UI.calls, 1);
ending.Game.showEndingIfReady(ending.Game.player);
assert.equal(ending.UI.calls, 1, 'ending must not repeat');

console.log('Final dimension portal and 20-minute ending tests passed.');
