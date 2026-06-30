'use strict';
// Post-unlock special enemy content definitions.
Object.assign(ENEMY_TYPES, {
  bulwark: { shape: 'hex', color: '#55ffb8', r: 20, hp: 150, spd: 48, dmg: 11, xp: 6, knock: 0.45, special: 'bulwark' },
  charger: { shape: 'tri', color: '#ff4d4d', r: 16, hp: 72, spd: 88, dmg: 16, xp: 4, knock: 0.85, special: 'charger' },
  warden:  { shape: 'diamond', color: '#41f0ff', r: 18, hp: 92, spd: 58, dmg: 12, xp: 5, knock: 0.6, special: 'warden' },
  miner:   { shape: 'penta', color: '#ff9d3d', r: 15, hp: 62, spd: 76, dmg: 10, xp: 4, knock: 0.9, special: 'miner' },
  spawner: { shape: 'star', color: '#d44dff', r: 19, hp: 132, spd: 42, dmg: 9, xp: 7, knock: 0.5, special: 'spawner' },
  bomber:  { shape: 'star', color: '#ff6b3d', r: 17, hp: 84, spd: 84, dmg: 15, xp: 5, knock: 0.75, special: 'bomber' },
});

const SPECIAL_ENEMY_IDS = ['bulwark', 'charger', 'warden', 'miner', 'spawner', 'bomber'];
