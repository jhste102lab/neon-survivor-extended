import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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

for (const asset of ['portal-twirl.png', 'nebula-smoke.png', 'circuit-spark.png', 'gravity-ring.png', 'judgement-burst.png', 'mirror-window.png', 'train-trace.png', 'casino-symbol.png', 'ending-flare.png']) {
  assert.equal(existsSync(`assets/vfx/kenney-particle-pack/${asset}`), true, `missing VFX asset: ${asset}`);
}
assert.match(readFileSync('assets/vfx/NOTICE.md', 'utf8'), /Creative Commons CC0 1\.0/);
vm.runInContext(readFileSync('src/events.js', 'utf8'), context, { filename: 'src/events.js' });

context.Game.updateDimensionRiftOfferSchedule();
assert.equal(context.Game.activeEvent.dimension, 'mirror_corridor');
assert.equal(context.Game.nextDimensionRiftT, 240);
context.Game.activateEvent(context.Game.activeEvent);
assert.equal(context.Game.entered, 'mirror_corridor', 'entering the portal should start the dimension immediately');
assert.equal(context.Game.activeEvent, null);

context.Game.time = 180;
context.Game.dimensionRiftGuaranteed3 = false;
context.Game.updateDimensionRiftOfferSchedule();
assert.equal(context.Game.dimensionRiftGuaranteed3, true, 'the 3-minute portal must be guaranteed');
assert.equal(context.Game.activeEvent.dimension, 'mirror_corridor');
context.Game.activeEvent = null;

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

const rewardUi = vm.createContext({
  UI: {}, Game: { state: 'play' }, GameRuntime: { banner() {} }, AudioFX: { uiClick() {} },
  showOverlay() {}, tr: key => key, $: () => null, document: { querySelector: () => null },
  UpgradeRules: {}, levelTierInfo: () => ({}), maxWeaponSlotsFor: () => 5, MAX_WEAPONS: 5,
});
vm.runInContext(readFileSync('src/ui-upgrade-cards.js', 'utf8'), rewardUi, { filename: 'src/ui-upgrade-cards.js' });
rewardUi.UI.setLevelOverlayCopy = () => {};
rewardUi.UI.renderChoiceCards = () => { throw new Error('simulated card renderer failure'); };
assert.equal(rewardUi.UI.showDimensionRewardCards([{ kind: 'heal' }], '테스트 차원'), false);
assert.equal(rewardUi.Game.state, 'play', 'a reward rendering failure must never strand the run in levelup state');

console.log('Dimension reward recovery test passed.');

const tapInput = vm.createContext({
  console, globalThis: {}, innerWidth: 400, innerHeight: 800, performance: { now: () => 0 },
  addEventListener() {}, document: { addEventListener() {} }, $: () => ({ style: {} }), getComputedStyle: () => ({ width: '120px' }),
  matchMedia: () => ({ matches: true }), clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
  Render: { mobileCameraOffset: () => -82 },
  GameRuntime: { activeGame: () => tapInput.game },
});
tapInput.globalThis = tapInput;
tapInput.game = { state: 'play', cam: { x: 0, y: 0 }, player: { x: 0, y: 0 }, spawnBurst() {} };
vm.runInContext(readFileSync('src/input-vector.js', 'utf8'), tapInput, { filename: 'src/input-vector.js' });
vm.runInContext(readFileSync('src/input.js', 'utf8'), tapInput, { filename: 'src/input.js' });
assert.equal(vm.runInContext('Input.setTapDestination(300, 300)', tapInput), true);
const tapMove = vm.runInContext('Input.moveVec()', tapInput);
assert(tapMove.x > 0 && tapMove.y < 0, 'tap movement should point from the player toward the tapped world position');
vm.runInContext("Input.keys.d = true", tapInput);
vm.runInContext('Input.moveVec()', tapInput);
assert.equal(vm.runInContext('Input.tapTarget', tapInput), null, 'manual controls must immediately override tap movement');
console.log('Mobile tap-to-move compatibility test passed.');
