#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const htmlPath = path.join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map(m => m[1]);
const errors = [];
const index = new Map();

function fail(message) { errors.push(message); }
function pos(src) { return index.has(src) ? index.get(src) : -1; }
function before(a, b, reason) {
  if (pos(a) < 0) return fail(`Missing script ${a} required before ${b}: ${reason}`);
  if (pos(b) < 0) return fail(`Missing script ${b} required after ${a}: ${reason}`);
  if (pos(a) >= pos(b)) fail(`Script order violation: ${a} must load before ${b} (${reason})`);
}
function existsOnce(src) {
  const count = scripts.filter(s => s === src).length;
  if (count !== 1) fail(`Expected exactly one ${src}, found ${count}`);
  if (!existsSync(path.join(root, src))) fail(`Script file does not exist: ${src}`);
}
function groupBefore(items, facade, reason) { for (const item of items) before(item, facade, reason); }

for (const src of scripts) {
  if (index.has(src)) fail(`Duplicate script reference: ${src}`);
  index.set(src, index.size);
  if (!existsSync(path.join(root, src))) fail(`Script file does not exist: ${src}`);
}

for (const src of scripts.filter(s => s.startsWith('src/') && s.endsWith('.js'))) existsOnce(src);

before('src/config.js', 'src/namespace.js', 'registry needs config-adjacent early load');
before('src/namespace.js', 'src/runtime.js', 'runtime and registries are boot foundations');
before('src/runtime.js', 'src/game-lifecycle.js', 'GameRuntime is used by lifecycle helpers');
before('src/runtime.js', 'src/main.js', 'main boot uses GameRuntime');
before('src/game-loop-phases.js', 'src/game-loop.js', 'phase schedule drives Game.update');
before('src/director-spawn-policy.js', 'src/director-spawn.js', 'director-spawn applies pure scheduling policies');
before('src/boss-spawn.js', 'src/boss-interactions.js', 'boss interactions extend spawned boss entities at runtime');
before('src/pressure-pattern-plans.js', 'src/pressure-patterns.js', 'pressure dispatch selects registered planners before side effects');
before('src/run-state.js', 'src/game-lifecycle.js', 'reset delegates to run-state factory');

const weaponHandlers = scripts.filter(s => /^src\/weapon-fire-[a-z0-9]+\.js$/.test(s) && s !== 'src/weapon-fire.js');
groupBefore(weaponHandlers, 'src/weapon-fire.js', 'weapon facade dispatches registered handlers');
before('src/namespace.js', weaponHandlers[0], 'weapon handlers register in owned namespace');
before('src/weapon-drone-geometry.js', 'src/weapon-fire-drone.js', 'drone fire path uses shared geometry');
before('src/weapon-drone-geometry.js', 'src/render-combat.js', 'drone render path uses shared geometry');

groupBefore([
  'src/weapon-aura-orbit-geometry.js','src/weapon-aura-orbit-hits.js','src/weapon-aura-orbit-fx.js',
  'src/weapon-aura-frost-damage-slow.js','src/weapon-aura-frost-pickup-pull.js','src/weapon-aura-frost-fx.js',
], 'src/weapon-auras.js', 'weapon aura facade asserts helper availability');

groupBefore([
  'src/render-canvas.js','src/render-world-stars.js','src/render-world-grid.js','src/render-world-enemy-role-telegraph.js',
  'src/render-world-enemy-state.js','src/render-world-enemy-overlays.js','src/render-world-enemy-sprite.js','src/render-world-enemy-simple.js','src/render-world-enemies.js','src/render-world-player.js',
], 'src/render-world.js', 'render-world facade delegates to focused helpers');
before('src/render-world-enemy-simple.js', 'src/render-world-enemies.js', 'enemy renderer uses budget-friendly silhouette helper');

groupBefore([
  'src/render-combat-beams.js','src/render-combat-orbit.js','src/render-combat-drones.js','src/render-combat-projectiles.js','src/render-combat-bolts.js',
], 'src/render-combat.js', 'render-combat facade delegates to focused helpers');

groupBefore([
  'src/render-effects-novas.js','src/render-effects-mega-absorbs.js','src/render-effects-boss-interactions.js','src/render-effects-particles.js','src/render-effects-floating-texts.js',
], 'src/render-effects.js', 'render-effects facade delegates to focused helpers');
before('src/render-canvas.js', 'src/render-frame.js', 'frame orchestration needs render context construction');
before('src/render-frame.js', 'src/render-core.js', 'Render.draw delegates frame orchestration');
before('src/render-canvas.js', 'src/render-core.js', 'Render.init delegates canvas lifecycle');

groupBefore([
  'src/ui-hud-level.js','src/ui-hud-timer.js','src/ui-hud-combo.js','src/ui-hud-run.js','src/ui-hud-frame.js','src/ui-hud-banner.js','src/ui-hud-boss.js',
], 'src/ui-hud.js', 'HUD facade delegates to focused helpers');

groupBefore(['src/i18n-ui-copy.js','src/i18n-content.js','src/i18n-dom.js','src/i18n-content-apply.js'], 'src/i18n.js', 'i18n has one explicit composition point');
before('src/overdrive-content.js', 'src/weapon-stats.js', 'overlevel copy is not owned by stat scaling');
before('src/upgrade-kind-contract.js', 'src/upgrade-descriptions.js', 'descriptions validate kind contract');
before('src/upgrade-kind-contract.js', 'src/upgrade-apply-dispatcher.js', 'applicator dispatch uses kind contract');
before('src/leaderboard-contract.js', 'src/leaderboard-entry.js', 'client entries use shared contract constants');
before('src/leaderboard-controller.js', 'src/ui-results.js', 'result overlay delegates leaderboard orchestration');
before('src/player-bullet-outcomes.js', 'src/player-bullets.js', 'player bullet facade applies explicit movement/collision outcomes');
before('src/loot-outcomes.js', 'src/loot.js', 'loot facade applies explicit collection/expiry outcomes');
before('src/event-definitions.js', 'src/events.js', 'event lifecycle uses type definition registry');
before('src/audio-mute.js', 'src/audio-fx.js', 'audio engine delegates mute persistence/UI');
before('src/audio-engine.js', 'src/audio-fx.js', 'audio facade delegates graph/context lifecycle');
before('src/audio-sfx-catalog.js', 'src/audio-fx.js', 'audio facade delegates named SFX recipes');
before('src/music.js', 'src/audio-engine.js', 'audio engine passes explicit music graph');
const mainIndex = pos('src/main.js');
if (mainIndex !== scripts.length - 1) fail(`src/main.js must be final bootstrap script, found position ${mainIndex + 1}/${scripts.length}`);

if (errors.length) {
  console.error(`Script dependency verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Script dependency verification passed (${scripts.length} scripts).`);
