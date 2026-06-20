'use strict';
// Enemy type definitions.
/* ================================================================
   적 정의
   ================================================================ */
const ENEMY_TYPES = {
  mite:    { shape: 'circle',  color: '#ff5e8a', r: 12, hp: 18,  spd: 92,  dmg: 8,  xp: 1, knock: 1 },
  runner:  { shape: 'tri',     color: '#ff3b3b', r: 11, hp: 13,  spd: 178, dmg: 7,  xp: 1, knock: 1 },
  swarm:   { shape: 'circle',  color: '#ff9d3d', r: 7,  hp: 6,   spd: 135, dmg: 5,  xp: 1, knock: 1.5 },
  tank:    { shape: 'hex',     color: '#a36bff', r: 20, hp: 95,  spd: 54,  dmg: 15, xp: 3, knock: 0.4 },
  shooter: { shape: 'diamond', color: '#ffb13d', r: 13, hp: 32,  spd: 72,  dmg: 9,  xp: 2, knock: 0.8, ranged: true },
  brute:   { shape: 'penta',   color: '#d44dff', r: 27, hp: 290, spd: 47,  dmg: 21, xp: 6, knock: 0.25 },
};
