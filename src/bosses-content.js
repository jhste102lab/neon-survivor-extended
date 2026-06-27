'use strict';
// Boss definitions.
const BOSSES = [
  { name: '수호자 헥사', shape: 'hex', color: '#c44dff', r: 46, hp: 1500, spd: 62, dmg: 22, xp: 40,
    dash: true, summon: 'mite', summonN: 4, summonCd: 8, ring: false },
  { name: '포식자 옥타', shape: 'oct', color: '#ff4d5e', r: 54, hp: 4300, spd: 56, dmg: 26, xp: 80,
    dash: true, summon: 'runner', summonN: 3, summonCd: 9, ring: true, ringN: 10, ringCd: 5 },
  { name: '심연의 별', shape: 'star', color: '#19e3ff', r: 62, hp: 9800, spd: 66, dmg: 30, xp: 150,
    dash: true, summon: 'swarm', summonN: 6, summonCd: 7, ring: true, ringN: 14, ringCd: 4.2 },
  { name: '군집 코어', shape: 'hex', color: '#ff2bd6', r: 142, hp: 52000, spd: 54, dmg: 56, xp: 360,
    mega: true, dash: true, summon: 'swarm', summonN: 11, summonCd: 6.4, ring: true, ringN: 30, ringCd: 3.35, ringGap: 2, trapCd: 4.6, laneCd: 5.3 },
];
