#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sounds = [];
const combatEvents = [];
const context = vm.createContext({
  console,
  Math,
  Set,
  TAU: Math.PI * 2,
  CFG: { lateRampStart: 420, maxGems: 3, maxDrops: 3, dropMergeRadius: 48, maxDropStack: 3, dropLife: { chicken: 150, bomb: 50, chest: 70 } },
  RNG: { next: () => 0 },
  rand: (a, b) => (a + b) / 2,
  clamp: (n, a, b) => Math.min(b, Math.max(a, n)),
  lerp: (a, b, t) => a + (b - a) * t,
  dist2: (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2,
  GameRuntime: {
    viewportHalf: () => ({ w: 960, h: 540 }),
    playSound: (name, ...args) => sounds.push({ name, args }),
  },
  LootDropEffects: {
    apply(game, kind) { game.dropKinds.push(kind); },
  },
  CombatUiFx: {
    showCombo: combo => combatEvents.push(['combo', combo]),
    markKillsDirty: () => combatEvents.push(['hud']),
    playEnemyDeathSound: () => combatEvents.push(['sound']),
    showEnemyDeathBurst: (game, enemy) => combatEvents.push(['burst', enemy.kind || 'enemy']),
    resetComboHud: () => combatEvents.push(['comboReset']),
  },
});

function loadClassic(file) {
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
function getGlobal(name) { return vm.runInContext(name, context); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function approx(actual, expected, message) { assert(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`); }

loadClassic('src/player-bullet-outcomes.js');
loadClassic('src/player-bullet-movement.js');
loadClassic('src/player-bullet-collision.js');
loadClassic('src/loot-outcomes.js');
loadClassic('src/loot-drops.js');
loadClassic('src/combat-kills.js');

const PlayerBulletOutcomes = getGlobal('PlayerBulletOutcomes');
const PlayerBulletMovement = getGlobal('PlayerBulletMovement');
const PlayerBulletCollision = getGlobal('PlayerBulletCollision');
const LootOutcomes = getGlobal('LootOutcomes');
const LootDrops = getGlobal('LootDrops');
const CombatKills = getGlobal('CombatKills');

{
  const game = { player: { x: 0, y: 0, hp: 10, barrier: 0 }, st: { maxHp: 20 }, stat() { return this.st; } };
  const bullet = { phase: 1, evolved: true, x: 1, y: 0, speed: 0 };
  const result = PlayerBulletMovement.boomerangReturned(game, bullet, 1 / 60);
  assert(result.returned === true, 'boomerang should return near player');
  approx(game.player.hp, 10, 'boomerang movement must not heal before outcome apply');
  PlayerBulletOutcomes.applyAll(game, result.outcomes, game.st);
  approx(game.player.hp, 12.5, 'boomerang return outcome heals');
  approx(game.player.barrier, 3.5, 'boomerang return outcome adds barrier');
}


{
  const spawned = [];
  const disc = { kind: 'disc', evolved: true, x: 2000, y: 0, vx: 100, vy: 0, r: 13, dmg: 20, baseDmg: 20, pierce: 8, life: 3, bounces: 2 };
  const game = { cam: { x: 0, y: 0 }, bullets: [disc], pushPlayerBullet(bullet) { spawned.push(bullet); } };
  const result = PlayerBulletMovement.moveStandard(game, disc, 0);
  assert(spawned.length === 0, 'disc bounce movement must not spawn split disc before outcome apply');
  assert(result.outcomes.some(outcome => outcome.type === 'spawnPlayerBullet'), 'evolved disc split should be returned as outcome');
  PlayerBulletOutcomes.applyAll(game, result.outcomes);
  assert(spawned.length === 1 && spawned[0].childDisc === true, 'disc split outcome spawns child disc when applied');
}

{
  sounds.length = 0;
  const enemy = { x: 0, y: 0, r: 10, hp: 10, slowT: 0, slowK: 0, def: { knock: 1 } };
  const game = {
    enemies: [enemy],
    player: { x: 0, y: 0, hp: 5 },
    st: { maxHp: 10 },
    bursts: [],
    damageLog: [],
    damageEnemy(e, dmg, kx, ky, source) { this.damageLog.push({ e, dmg, kx, ky, source }); e.hp -= dmg; },
    spawnBurst(x, y, color, count, speed, size, life) { this.bursts.push({ x, y, color, count, speed, size, life }); },
  };
  const bullet = { kind: 'bolt', x: 0, y: 0, r: 5, vx: 1, vy: 0, dmg: 4, pierce: 1, slow: 0.4, slowT: 0.8, healOnHit: 1, hitOnce: true, color: '#fff' };
  const result = PlayerBulletCollision.hitStandardEnemies(game, bullet, game.st);
  assert(result.consumed === false, 'piercing projectile should survive first hit');
  approx(enemy.hp, 10, 'collision must not damage before outcome apply');
  approx(game.player.hp, 5, 'collision must not heal before outcome apply');
  assert(bullet.pierce === 1, 'collision must not decrement pierce before outcome apply');
  PlayerBulletOutcomes.applyAll(game, result.outcomes, game.st);
  approx(enemy.hp, 6, 'damage outcome applies projectile damage');
  approx(enemy.slowT, 0.8, 'slow outcome applies duration');
  approx(enemy.slowK, 0.4, 'slow outcome applies factor');
  approx(game.player.hp, 6, 'heal-on-hit outcome applies after collision');
  assert(bullet.pierce === 0, 'pierce decrement outcome applies after collision');
  assert(bullet.hitSet && bullet.hitSet.has(enemy), 'remember-hit outcome records target');
  assert(game.bursts.length === 1 && sounds.some(sound => sound.name === 'hit'), 'feedback outcomes applied');
}

{
  const enemy = { x: 0, y: 0, r: 12, hp: 10, def: { knock: 1 } };
  const game = {
    enemies: [enemy],
    player: { x: 0, y: 0, hp: 5 },
    explosions: [],
    explode(x, y, radius, damage, source, child, color) { this.explosions.push({ x, y, radius, damage, source, child, color }); },
  };
  const missile = { kind: 'missile', x: 0, y: 0, r: 5, blast: 60, dmg: 9, child: true, color: '#f0f' };
  const result = PlayerBulletCollision.hitStandardEnemies(game, missile, { maxHp: 10 });
  assert(result.consumed === true, 'missile hit should consume projectile');
  assert(game.explosions.length === 0, 'missile collision must not explode before outcome apply');
  PlayerBulletOutcomes.applyAll(game, result.outcomes);
  assert(game.explosions.length === 1 && game.explosions[0].source === 'weapon:missile', 'missile explode outcome applies');
}

{
  sounds.length = 0;
  const gem = { x: 0, y: 0, v: 4, tier: 0 };
  LootOutcomes.mergeGemValue(gem, 3);
  assert(gem.v === 7 && gem.tier === 1, 'gem merge updates value/tier policy');
  const game = {
    player: { x: 2, y: 3 },
    combo: 4,
    metrics: {},
    xp: 0,
    bursts: [],
    dropKinds: [],
    addXp(n) { this.xp += n; },
    spawnBurst(x, y, color, count, speed, size, life) { this.bursts.push({ x, y, color, count, speed, size, life }); },
  };
  LootOutcomes.applyAll(game, [
    LootOutcomes.gemCollectOutcome({ ...gem, x: 2, y: 3 }, game.player, game.combo),
    LootOutcomes.dropOutcome('chicken'),
    { type: 'dropExpired' },
    { type: 'dropTrimmed' },
  ]);
  assert(game.xp === 7, 'gem outcome applies XP');
  assert(game.dropKinds.includes('chicken'), 'drop outcome delegates effect');
  assert(game.metrics.dropsExpired === 1 && game.metrics.dropsTrimmed === 1, 'drop expiry/trim outcomes update separate metrics');
  assert(game.bursts.length === 1 && sounds.some(sound => sound.name === 'gem'), 'gem presentation outcomes apply');
}

{
  const game = {
    drops: [],
    player: { x: 0, y: 0 },
    dropLimit: () => 10,
    trimDropsForSpawn: LootDrops.trimDropsForSpawn,
    mergeNearbyDrop: LootDrops.mergeNearbyDrop,
    spawnDrop: LootDrops.spawnDrop,
  };
  game.spawnDrop('bomb', 0, 0);
  game.spawnDrop('bomb', 20, 0);
  assert(game.drops.length === 1, 'nearby stackable drops should merge');
  assert(game.drops[0].stack === 2 && game.drops[0].life === 50, 'merged drop resets life and increments stack');
  game.spawnDrop('chest', 0, 0);
  game.spawnDrop('chest', 10, 0);
  assert(game.drops.filter(d => d.kind === 'chest').length === 2, 'chests must not merge');
}

{
  combatEvents.length = 0;
  const enemy = { kind: 'elite', lastHitSource: 'weapon:bolt', special: 'swift', boss: true };
  const game = {
    enemies: [enemy],
    kills: 0,
    combo: 4,
    comboT: 0,
    maxCombo: 4,
    metrics: { killsBySource: {}, specialKills: {}, bossesKilled: 0 },
    rewards: 0,
    grantEnemyDeathRewards(e) { assert(e === enemy, 'death rewards receive killed enemy'); this.rewards++; },
  };
  const outcome = CombatKills.buildKillEnemyOutcome.call(game, enemy);
  assert(outcome.killed === true, 'combat kill builder should report killed enemy');
  assert(game.enemies.length === 1 && game.kills === 0, 'combat outcome builder must not mutate kill state');
  const applied = CombatKills.applyKillEnemyOutcome.call(game, outcome);
  assert(applied === true, 'combat outcome applies');
  assert(game.enemies.length === 0 && game.kills === 1, 'combat outcome removes enemy and increments kills');
  assert(game.metrics.killsBySource['weapon:bolt'] === 1, 'combat outcome records kill source');
  assert(game.metrics.specialKills.swift === 1 && game.metrics.bossesKilled === 1, 'combat outcome records special/boss metrics');
  assert(game.combo === 5 && game.maxCombo === 5 && game.rewards === 1, 'combat outcome applies combo and rewards');
  assert(combatEvents.some(event => event[0] === 'combo') && combatEvents.some(event => event[0] === 'hud') && combatEvents.some(event => event[0] === 'sound') && combatEvents.some(event => event[0] === 'burst'), 'combat UI/audio outcomes applied');
}

console.log('Gameplay outcome seam tests passed.');
