#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const spawns = [];
const context = vm.createContext({
  console,
  Math,
  Object,
  Number,
  Array,
  String,
  JSON,
  Infinity,
  globalThis: null,
  TAU: Math.PI * 2,
  CFG: { winTime: 600, player: { speed: 220 } },
  BOSSES: [
    { name: 'A', r: 50, hp: 100, spd: 80, color: '#0ff' },
    { name: 'B', r: 55, hp: 120, spd: 82, color: '#0f0' },
    { name: 'C', r: 60, hp: 140, spd: 84, color: '#00f' },
    { name: 'Mega', r: 142, hp: 1000, spd: 100, mega: true, color: '#f00' },
  ],
  Game: {
    time: 0,
    enemies: [],
    novas: [],
    megaAbsorbs: [],
    bossLinks: [],
    bossDebuffs: null,
    dir: { bossIdx: 3, megaBossCount: 0, nextEndlessBossT: 660, bossT: 0 },
    endless: true,
    activeEvent: null,
    player: { dead: false, x: 0, y: 0 },
    st: { spd: 220 },
    test: { noFx: true },
    stat() { return this.st; },
    spawnParticle() {},
    spawnBurst() {},
    hitStop() {},
    shake() {},
    spawnText() {},
  },
  GameRuntime: { banner() {}, showBossBar() {}, updateBossBar() {} },
  EnemyFactoryPlacement: { bossPosition() { return { x: 100, y: 100 }; } },
  BossSpawnEntity: {
    createBoss(def, pos, hpMult, spdMult, opts = {}) {
      return {
        boss: true,
        hp: def.hp * hpMult,
        maxHp: def.hp * hpMult,
        spd: def.spd * spdMult,
        r: def.r,
        x: pos.x,
        y: pos.y,
        bossDef: { ...def },
        ...opts,
      };
    },
  },
  BossSpawnRegistration: {
    registerBoss(game, boss) {
      game.enemies.push(boss);
      game.boss = boss;
      game.lastBossSpawnT = game.time;
      spawns.push({ t: +game.time.toFixed(1), name: boss.bossDef.name });
    },
  },
  BossSpawnEffects: { showBossSpawnWarning() {} },
  rand(a = 0, b = 1) { return (a + b) / 2; },
  pick(arr) { return arr[0]; },
  clamp(n, a, b) { return Math.min(b, Math.max(a, n)); },
  dist2(x1, y1, x2, y2) { return (x1 - x2) ** 2 + (y1 - y2) ** 2; },
  tr(key) { return key; },
});
context.globalThis = context;

function load(file) {
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of [
  'src/director-spawn-policy.js',
  'src/boss-spawn-policy.js',
  'src/boss-interactions.js',
  'src/boss-spawn.js',
  'src/director-spawn.js',
]) load(file);

function reset(time, activeEvent, existingBosses = [], megaBossCount = 0, nextEndlessBossT = 660) {
  Object.assign(context.Game, {
    time,
    enemies: [...existingBosses],
    boss: existingBosses.at(-1) || null,
    activeEvent,
    lastBossSpawnT: -999,
    dir: { bossIdx: 3, megaBossCount, nextEndlessBossT, bossT: 0 },
    endless: true,
    bossLinks: [],
    bossDebuffs: null,
  });
  spawns.length = 0;
  return context.Game;
}

function activeBosses(game) {
  return game.enemies.filter(enemy => enemy && enemy.boss);
}

let game = reset(600, { state: 'active', type: 'storm' }, [{ boss: true, hp: 1, bossDef: { name: 'old' } }]);
game.directMegaBossSpawn(600);
assert(spawns.length === 1, '10:00 mega boss should spawn during active field events');
assert(activeBosses(game).length === 2, '10:00 mega boss should not replace or absorb an existing boss');
assert(game.dir.megaBossCount === 1, '10:00 mega boss schedule should advance after a successful overlapping spawn');

game = reset(660, { state: 'active', type: 'rift' }, [{ boss: true, hp: 1, bossDef: { name: 'old' } }], 1, 660);
game.directEndlessBossSpawns(1 / 60, 660);
assert(spawns.length === 1, '11:00 endless boss should spawn during active field events');
assert(activeBosses(game).length === 2, '11:00 endless boss should stack with an existing boss');

console.log('Boss scheduling overlap tests passed.');
