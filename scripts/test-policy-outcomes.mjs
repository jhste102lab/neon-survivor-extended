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
  lerp: (a, b, t) => a + (b - a) * t,
  dist2: (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2,
  CFG: { winTime: 600, maxDropStack: 3, magnetMotionLimit: 2, slowSpeedUnlockTime: 480, player: { radius: 13 } },
  UI: { syncSpeedControls: scale => commands.push(['speedSync', scale]) },
  tr: (key, vars = {}) => `${key}${vars.value == null ? '' : `:${vars.value}`}`,
  Game: { time: 0, hitStopT: 0, timeScale: 1, shakeT: 0, test: { noFx: true } },
  GameRuntime: {
    viewportHalf: () => ({ w: 100, h: 100 }),
    playSound: name => sounds.push(name),
    flashEffect: (id, duration) => commands.push(['flash', id, duration]),
    updateBossBar: boss => commands.push(['bossBar', boss.hp, boss.maxHp]),
  },
});
function load(file) { vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
function get(name) { return vm.runInContext(name, context); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function commandType(command) { return command.type; }
function everyCommandType(commands, type) { return commands.every(command => commandType(command) === type); }
function someCommandType(commands, type) { return commands.some(command => commandType(command) === type); }

load('src/director-spawn-policy.js');
load('src/pressure-pattern-plans.js');
load('src/loot-outcomes.js');
load('src/boss-interactions.js');
load('src/enemy-ai-boss-movement.js');
load('src/player-runtime.js');
load('src/loot-drop-bomb-effect.js');
load('src/loot-drop-chest-effect.js');
load('src/loot-drop-chicken-effect.js');
load('src/loot-drop-magnet-effect.js');
load('src/loot-drop-effects.js');
load('src/game-loop-frame.js');
const DirectorSpawnPolicy = get('DirectorSpawnPolicy');
const PressurePatternPlans = get('PressurePatternPlans');
const LootDropEffects = get('LootDropEffects');
const BossInteractions = get('BossInteractions');
const getBossMovement = get('getBossMovement');
const Game = get('Game');

{
  const ctx = DirectorSpawnPolicy.normalContext({ time: 480, winTime: 600, dropTaperStart: 360, threat: 2, eventMul: 1.25, mobileMul: 0.82 });
  assert(ctx.pressureT === 120 && ctx.threat === 2, 'normal context should be derived from plain input');
  assert(DirectorSpawnPolicy.normalSpawnDelay(ctx) > 0, 'normal spawn delay should be pure and positive');
  assert(DirectorSpawnPolicy.normalBatchSize(ctx) >= 1, 'normal batch size should be pure and positive');
  assert(DirectorSpawnPolicy.eliteDelay({ time: 700, winTime: 600, endless: true, threat: 5 }) >= 18, 'elite delay should be pure');
  assert(DirectorSpawnPolicy.scheduledBossIndex({ time: 360, bossIdx: 1, hasBoss: false }) === 1, 'scheduled boss policy returns due boss index');
  assert(BossInteractions.megaAffixesForTier(3).length === 1, 'mega bosses should keep one affix only');
  const patch = DirectorSpawnPolicy.endlessBossPatternPatch({ ringN: 8, ringCd: 5.7 }, 3, arr => arr[0]);
  assert(patch.endlessTier === 3 && patch.ring, 'endless boss patch should be produced from plain input');
}

{
  const megaBoss = { bossDef: { mega: true }, dashState: 0, spd: 100, r: 140, x: 0, y: 0 };
  const close = getBossMovement(megaBoss, 120, 0, 120, 0);
  assert(close.mvx <= 0 && Math.abs(close.mvy) > 0, 'mega boss should orbit instead of hard-chasing when already too close');
  const far = getBossMovement(megaBoss, 360, 0, 360, 0);
  assert(far.mvx > 0 && Math.abs(far.mvy) === 0, 'mega boss should still chase normally outside close orbit range');
}

{
  const contextInput = { player: { x: 10, y: 20, moveX: 1, moveY: 0 }, threat: 3, warn: 0.8, dmg: 12, idleK: 0.5, n: 2, radius: 50 };
  const ring = PressurePatternPlans.lateRing(contextInput, 0, 0);
  const lane = PressurePatternPlans.lateLane(contextInput, 0);
  const hunter = PressurePatternPlans.lateHunter(contextInput, 0);
  const idle = PressurePatternPlans.idleMissiles(contextInput, [{ angle: 0, spread: 0 }, { angle: Math.PI, spread: 80 }]);
  assert(everyCommandType(ring, 'hazard') && everyCommandType(lane, 'hazard'), 'pressure hazard patterns should return hazard commands');
  assert(everyCommandType(hunter, 'enemyBullet'), 'hunter pressure should return bullet commands');
  assert(someCommandType(idle, 'sound'), 'idle pressure plan should include sound feedback command');
}

{
  Game.time = 100;
  Game.setUserTimeScale(0.5);
  assert(Game.userTimeScale === 1, '0.5x must stay locked before 08:00');
  Game.time = 480;
  Game.setUserTimeScale(0.5);
  assert(Game.userTimeScale === 0.5, '0.5x unlocks at 08:00');
}

{
  commands.length = 0;
  const boss = { x: 0, y: 0, r: 50, hp: 100, maxHp: 200, boss: true };
  Object.assign(Game, {
    boss,
    enemies: [boss],
    drops: [{ kind: 'chicken', x: 0, y: 0, stack: 1 }],
    gems: [{ x: 0, y: 0, v: 5 }],
    bossLinks: [],
    player: { x: 4, y: 6 },
    spawnText(x, y, text) { commands.push(['text', text]); },
    spawnBurst() {},
    damageEnemy(e, damage) { e.hp -= damage; },
  });
  Game.pullDropsToBoss(boss, 0);
  assert(boss.hp === 100 && Game.drops.length === 0, 'absorbed drops must not heal bosses');
  Game.pullGemsToBoss(boss, 0);
  assert(boss.hp === 100 && Game.gems.length === 0, 'absorbed gems must not heal bosses');
  Game.drops = [{ kind: 'bomb', x: 0, y: 0, stack: 1 }];
  Game.pullDropsToBoss(boss, 0);
  assert(boss.hp < 100, 'absorbed bombs should backfire as boss damage');
  const afterBomb = boss.hp;
  Game.feedBossRushEnergy('normal');
  assert(boss.hp === afterBomb && boss.maxHp > 200, 'boss rush energy must not restore current boss hp');
}

{
  Game.drops = [
    { kind: 'bomb', stack: 2, focusShelved: true },
    { kind: 'bomb', stack: 1, focusShelved: true },
    { kind: 'chicken', stack: 3, focusShelved: true },
  ];
  assert(Game.canShelveFocusDrop({ kind: 'bomb', stack: 1 }) === false, 'focus reserve caps each drop kind at three items');
  assert(Game.canShelveFocusDrop({ kind: 'magnet', stack: 3 }) === true, 'focus reserve allows a different drop kind up to cap');
  assert(Game.canShelveFocusDrop({ kind: 'chicken', stack: 1 }) === false, 'focus reserve counts stacked drops toward cap');
}

{
  const game = {
    player: { x: 5, y: 6, hp: 10 },
    gems: [{ x: 0, y: 0, v: 1, mag: false, ms: 0 }],
    enemies: [{ x: 0, y: 0, hp: 10 }],
    cam: { x: 0, y: 0 },
    stat: () => ({ maxHp: 30 }),
    idleRecoverySuppression: () => 0,
    damageEnemy(e, damage) { e.hp -= damage; },
    addXp(v) { commands.push(['xp', v]); },
    spawnBurst(x, y, color, count) { commands.push(['burst', count]); },
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
  const stackedBomb = LootDropEffects.plan(game, 'bomb', { stack: 3 });
  assert(stackedBomb.find(o => o.type === 'damageVisibleEnemies').damage === 423, 'stacked bomb applies capped 1.3x scaling');
}

console.log('Director, pressure, and drop outcome policy tests passed.');
