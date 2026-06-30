'use strict';
// Core mutable game state only. Behavior is attached by narrower game-* modules.
const Game = {

  state: 'title', time: 0, timeScale: 1, userTimeScale: 1, hitStopT: 0,
  player: null, enemies: [], bullets: [], ebullets: [], gems: [], drops: [], hazards: [], gravityFields: [],
  particles: [], texts: [], novas: [], beams: [], bolts: [], megaAbsorbs: [], bossLinks: [], blades: { angle: 0 },
  cam: { x: 0, y: 0 }, shakeT: 0, shakeDur: 1, shakeMag: 0,
  kills: 0, combo: 0, comboT: 0, maxCombo: 0,
  boss: null, levelQueue: 0, deathT: -1, novaSeq: 0,
  dir: { spawnT: 1.5, eliteT: 100, burstT: 70, bossIdx: 0 },
  best: { time: 0, kills: 0, level: 0, maxCombo: 0, wins: 0 },
  test: { manualClock: false, headless: false, noFx: false },
  fieldTestInvincible: false, fieldTestRun: false, fieldTestTouched: false,
  hiddenWeaponEffects: {},
  frameSeq: 0, frameTargets: null, bossDebuffs: null,
  slotsDirty: true, lastWeaponSlotCap: 5
};

if (typeof globalThis !== 'undefined') globalThis.Game = Game;
