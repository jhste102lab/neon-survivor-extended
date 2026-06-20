#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const commands = [];
const sounds = [];
const context = vm.createContext({
  console,
  Math,
  Object,
  TAU: Math.PI * 2,
  pick: arr => arr[0],
  clamp: (n, a, b) => Math.min(b, Math.max(a, n)),
  GameRuntime: {
    viewportHalf: () => ({ w: 100, h: 100 }),
    playSound: name => sounds.push(name),
    flashEffect: (id, duration) => commands.push(['flash', id, duration]),
  },
});
function load(file) { vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
function get(name) { return vm.runInContext(name, context); }
function assert(condition, message) { if (!condition) throw new Error(message); }

load('src/director-spawn-policy.js');
load('src/pressure-pattern-plans.js');
load('src/loot-drop-bomb-effect.js');
load('src/loot-drop-chest-effect.js');
load('src/loot-drop-chicken-effect.js');
load('src/loot-drop-magnet-effect.js');
load('src/loot-drop-effects.js');
const DirectorSpawnPolicy = get('DirectorSpawnPolicy');
const PressurePatternPlans = get('PressurePatternPlans');
const LootDropEffects = get('LootDropEffects');

{
  const ctx = DirectorSpawnPolicy.normalContext({ time: 480, winTime: 600, dropTaperStart: 360, threat: 2, eventMul: 1.25, mobileMul: 0.82 });
  assert(ctx.pressureT === 120 && ctx.threat === 2, 'normal context should be derived from plain input');
  assert(DirectorSpawnPolicy.normalSpawnDelay(ctx) > 0, 'normal spawn delay should be pure and positive');
  assert(DirectorSpawnPolicy.normalBatchSize(ctx) >= 1, 'normal batch size should be pure and positive');
  assert(DirectorSpawnPolicy.eliteDelay({ time: 700, winTime: 600, endless: true, threat: 5 }) >= 18, 'elite delay should be pure');
  assert(DirectorSpawnPolicy.scheduledBossIndex({ time: 360, bossIdx: 1, hasBoss: false }) === 1, 'scheduled boss policy returns due boss index');
  const patch = DirectorSpawnPolicy.endlessBossPatternPatch({ ringN: 8, ringCd: 5.7 }, 3, arr => arr[0]);
  assert(patch.endlessTier === 3 && patch.ring, 'endless boss patch should be produced from plain input');
}

{
  const contextInput = { player: { x: 10, y: 20, moveX: 1, moveY: 0 }, threat: 3, warn: 0.8, dmg: 12, idleK: 0.5, n: 2, radius: 50 };
  const ring = PressurePatternPlans.lateRing(contextInput, 0, 0);
  const lane = PressurePatternPlans.lateLane(contextInput, 0);
  const hunter = PressurePatternPlans.lateHunter(contextInput, 0);
  const idle = PressurePatternPlans.idleMissiles(contextInput, [{ angle: 0, spread: 0 }, { angle: Math.PI, spread: 80 }]);
  assert(ring.every(c => c.type === 'hazard') && lane.every(c => c.type === 'hazard'), 'pressure hazard patterns should return hazard commands');
  assert(hunter.every(c => c.type === 'enemyBullet'), 'hunter pressure should return bullet commands');
  assert(idle.some(c => c.type === 'sound'), 'idle pressure plan should include sound feedback command');
}

{
  const game = {
    player: { x: 5, y: 6, hp: 10 },
    gems: [{ mag: false, ms: 0 }],
    enemies: [{ x: 0, y: 0, hp: 10 }],
    cam: { x: 0, y: 0 },
    stat: () => ({ maxHp: 30 }),
    idleRecoverySuppression: () => 0,
    damageEnemy(e, damage) { e.hp -= damage; },
    spawnText(x, y, text) { commands.push(['text', x, y, text]); },
    shake(amount, duration) { commands.push(['shake', amount, duration]); },
    openChest() { commands.push(['chest']); },
  };
  const chickenPlan = LootDropEffects.plan(game, 'chicken');
  assert(chickenPlan.some(o => o.type === 'healPlayer') && game.player.hp === 10, 'drop planning must not heal before apply');
  LootDropEffects.applyOutcomes(game, chickenPlan);
  assert(game.player.hp > 10 && sounds.includes('pickup'), 'drop outcomes apply heal and feedback');
  const magnetPlan = LootDropEffects.plan(game, 'magnet');
  assert(game.gems[0].mag === false, 'magnet planning must not mutate gems');
  LootDropEffects.applyOutcomes(game, magnetPlan);
  assert(game.gems[0].mag === true && game.gems[0].ms === 500, 'magnet outcome applies gem attraction');
}

console.log('Director, pressure, and drop outcome policy tests passed.');
