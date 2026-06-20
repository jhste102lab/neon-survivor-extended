'use strict';
// Boss entity construction.
const BossSpawnEntity = Object.freeze({
  createBoss(def, position, hpMult, spdMult, opts = {}) {
    const absorbedHp = Math.max(0, Number(opts.absorbedHp || 0));
    const absorbedCount = Math.max(0, Number(opts.absorbedCount || 0));
    const bossDef = { ...def, ...(opts.defPatch || {}) };
    const hp = bossDef.hp * hpMult + absorbedHp;
    const hasTrapPattern = bossDef.mega || bossDef.trap;
    const hasLanePattern = bossDef.mega || bossDef.laneTrap;
    return {
      type: 'boss', def: { ...bossDef, knock: 0 }, bossDef,
      x: position.x, y: position.y,
      kx: 0, ky: 0, r: bossDef.r, hp, maxHp: hp,
      spd: bossDef.spd * spdMult, dmg: bossDef.dmg, xp: bossDef.xp + Math.floor(absorbedCount * 0.75),
      flash: 0, orbitCd: 0, boomCd: 0, novaId: 0, slowT: 0, slowK: 0, elite: false, boss: true,
      dashT: bossDef.mega ? 3.6 : 5, dashState: 0, dashDir: 0, summonT: bossDef.summonCd || 99, ringT: bossDef.ring ? bossDef.ringCd : 6.5,
      shootT: 99, wobble: 0, age: 0,
      megaFormT: bossDef.mega ? 4.2 : 0, megaAbsorbedCount: absorbedCount, megaTier: opts.megaTier || bossDef.megaTier || 0,
      megaTrapT: hasTrapPattern ? (bossDef.initialTrapT || (bossDef.mega ? 5.4 : 6.2)) : 99,
      megaLaneT: hasLanePattern ? (bossDef.initialLaneT || (bossDef.mega ? 7.1 : 7.4)) : 99,
    };
  },
});
