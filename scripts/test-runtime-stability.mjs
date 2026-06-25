#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const store = new Map();
const context = vm.createContext({
  console,
  Math,
  Date,
  Set,
  JSON,
  localStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: key => { store.delete(key); },
  },
  innerWidth: 390,
  innerHeight: 844,
  matchMedia: () => ({ matches: true }),
  Profile: { runId: () => 'restored-run-id' },
  Music: { setIntensity() {} },
  Leaderboard: null,
  maxWeaponSlotsFor: () => 5,
  Grid: { map: new Map(), rebuild(enemies) { this.lastRebuild = enemies.length; } },
  UI: { syncSpeedControls(scale) { this.lastScale = scale; } },
});
context.globalThis = context;

function loadClassic(file) {
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
function getGlobal(name) { return vm.runInContext(name, context); }
function assert(condition, message) { if (!condition) throw new Error(message); }

loadClassic('src/utils.js');
loadClassic('src/config.js');
loadClassic('src/runtime.js');
loadClassic('src/performance-budget.js');
loadClassic('src/game.js');
loadClassic('src/run-state.js');
loadClassic('src/run-snapshot.js');

const Game = getGlobal('Game');
const GameRuntime = getGlobal('GameRuntime');
const PerformanceBudget = getGlobal('PerformanceBudget');
const RunSnapshot = getGlobal('RunSnapshot');

Game.reset = function resetForTest() {
  const initial = getGlobal('createInitialRunState')();
  Object.assign(this, initial);
  this.enemies = []; this.bullets = []; this.ebullets = []; this.gems = []; this.drops = [];
  this.hazards = []; this.particles = []; this.texts = []; this.novas = []; this.beams = []; this.bolts = []; this.megaAbsorbs = [];
  this.boss = null;
};

Game.reset();
Game.state = 'play';
Game.time = 245;
Game.kills = 123;
Game.combo = 9;
Game.player.hp = 88;
Game.player.weapons[0].timer = 0.12;
Game.enemies.push({ type: 'mite', def: { r: 12, knock: 1 }, x: 4, y: 5, hp: 10, maxHp: 10, boss: false });
Game.bullets.push({ kind: 'bolt', x: 1, y: 2, hitSet: new Set([Game.enemies[0]]) });
Game.particles.push({ x: 0, y: 0, vx: 1, vy: 1, life: 1, maxLife: 1, size: 2, color: '#fff' });
Game.runProof = 'must-not-persist';
assert(RunSnapshot.save(Game, { force: true }), 'snapshot save should succeed for a live run');

const persisted = JSON.parse(store.get(RunSnapshot.key));
assert(!JSON.stringify(persisted).includes('must-not-persist'), 'snapshot must not persist leaderboard proof');
assert(!JSON.stringify(persisted).includes('hitSet'), 'snapshot must not persist projectile hit sets');

Game.time = 0;
Game.kills = 0;
Game.player.hp = 1;
Game.enemies.length = 0;
assert(RunSnapshot.restore(Game), 'valid snapshot should restore');
assert(Game.time === 245 && Game.kills === 123 && Game.player.hp === 88, 'restore should recover run scalars and player');
assert(Game.enemies.length === 1 && Game.bullets.length === 1, 'restore should recover entity arrays');
assert(Game.runId === 'restored-run-id' && Game.runProof === '', 'restore should start a fresh leaderboard session without persisted proof');

store.set(RunSnapshot.key, JSON.stringify({ schema: 1, run: { time: 10, player: { hp: 0, dead: true } } }));
assert(RunSnapshot.available() === false, 'dead/corrupt snapshots should not be offered');

Game.test.headless = true;
Game.state = 'play';
GameRuntime.gameOver();
assert(Game.state === 'over', 'headless gameOver should still move the state machine to over');

PerformanceBudget.reset();
PerformanceBudget.recordFrame(8);
PerformanceBudget.recordFrame(80);
assert(PerformanceBudget.visualPressure() > 0, 'long frames should raise visual pressure');
assert(PerformanceBudget.particleStride() >= 1, 'particle stride should remain valid');

console.log('Runtime stability tests passed.');
