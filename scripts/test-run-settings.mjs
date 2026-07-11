import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { normalizeEntry } from '../functions/api/leaderboard/entry-normalization.js';

const root = process.cwd();
const storage = new Map();
const context = vm.createContext({
  console,
  globalThis: {},
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
  },
  CFG: { weaponSlotInterval: 300, weaponSlotStep: 5, winTime: 600 },
  WEAPONS: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`w${i}`, {}])),
  PASSIVES: {},
  MAX_WEAPONS: undefined,
  ENDLESS_MAX_WEAPONS: undefined,
  clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
  GameRuntime: { banners: [], banner(text, kind) { this.banners.push({ text, kind }); } },
  Game: { player: { dead: false }, runSettings: null, lastWeaponSlotCap: 5, slotsDirty: false },
});
context.globalThis = context;

for (const file of ['src/run-settings.js', 'src/weapon-stats.js', 'src/game-loop-slots.js']) {
  vm.runInContext(readFileSync(join(root, file), 'utf8'), context, { filename: file });
}

context.RunSettings.save({ weaponCap: '60pct', enemyMode: 'half' });
const loaded = context.RunSettings.load();
assert.equal(loaded.weaponCap, '60pct');
assert.equal(loaded.enemyMode, 'half');

const game = context.Game;
game.time = 600;
game.runSettings = context.RunSettings.snapshotForRun();
assert.equal(game.runSettings.weaponCap, '60pct');
assert.equal(context.maxWeaponSlotsFor(game), 14, '60% cap should resolve from the current 24-weapon catalog');
game.applyWeaponCapBonusThresholds();
assert.deepEqual(Array.from(game.runSettings.weaponCapBonusThresholds), [15], '600s base 15 unlock should grant one capped threshold bonus');
assert.equal(game.runSettings.weaponCapBonusDamage, 10);

game.time = 900;
game.applyWeaponCapBonusThresholds();
assert.deepEqual(Array.from(game.runSettings.weaponCapBonusThresholds), [15, 20], '900s base 20 unlock should grant second capped threshold bonus');
assert.equal(game.runSettings.weaponCapBonusDamage, 20);
assert.equal(context.RunSettings.enemyDensity(game), 0.5);
assert.equal(context.RunSettings.enemyStatMul(game), 1.8);

const normalized = normalizeEntry({
  runId: 'run-settings-test', name: 'Tester', time: 700, kills: 10, level: 4, maxCombo: 3, ruleset: 'final-dimension-2026-07-11',
  build: { settings: { weaponCap: '60pct', enemyMode: 'half', enemyDensity: 0.5, enemyStatMul: 1.8, weaponCapBonusDamage: 20, weaponCapBonusThresholds: [15, 20], dropFilters: { chicken: true, magnet: false, bomb: true } } },
});
assert.equal(normalized.build.settings.weaponCap, '60pct');
assert.equal(normalized.build.settings.enemyMode, 'half');
assert.equal(normalized.build.settings.dropFilters.magnet, false);
assert.equal(normalized.cleared20, false);

const trophyEntry = normalizeEntry({
  runId: 'clear-test', name: 'Closer', time: 1200, kills: 20, level: 10, maxCombo: 5,
  ruleset: 'final-dimension-2026-07-11', cleared20: true,
});
assert.equal(trophyEntry.cleared20, true);
assert.equal(trophyEntry.clearTime, 1200);

console.log('Run settings and leaderboard settings tests passed.');
