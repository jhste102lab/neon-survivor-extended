'use strict';
// Enemy entity construction.
const EnemyFactoryEntity = Object.freeze({
  createEnemy(typeId, def, position, stats, elite) {
    return {
      type: typeId, def, x: position.x, y: position.y, kx: 0, ky: 0,
      r: stats.r,
      hp: stats.hp, maxHp: stats.maxHp,
      spd: stats.spd * rand(0.92, 1.08),
      dmg: stats.dmg,
      xp: stats.xp,
      flash: 0, orbitCd: 0, boomCd: 0, novaId: 0, slowT: 0, slowK: 0, elite, boss: false,
      shootT: rand(1, 2.5), wobble: rand(0, TAU), age: 0,
    };
  },
});
