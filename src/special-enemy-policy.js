'use strict';
// Special enemy active caps, spawn chance, and weighted type selection.
Object.assign(Game, {
  specialEnemyCap() {
    const start = CFG.lateRampStart || 420;
    if (this.time < start) return 2;
    const threat = this.lateThreat ? this.lateThreat() : 0;
    const post8 = this.time >= (CFG.idlePressureStart || 480) ? 2 : 0;
    return Math.min(9, 2 + post8 + Math.floor(threat / 1.05));
  },

  specialActiveCount() {
    let n = 0;
    for (const e of this.enemies) if (e.def && e.def.special && !e.boss) n++;
    return n;
  },

  specialCountByType(typeId) {
    let n = 0;
    for (const e of this.enemies) if (e.type === typeId && !e.boss) n++;
    return n;
  },

  specialTypeCap(typeId) {
    const post8 = this.time >= (CFG.idlePressureStart || 480);
    const base = post8
      ? { spawner: 2, bulwark: 3, warden: 3, miner: 3, charger: 4 }
      : { spawner: 1, bulwark: 2, warden: 2, miner: 2, charger: 3 };
    return base[typeId] || 2;
  },

  shouldSpawnSpecial(t) {
    const start = CFG.lateRampStart || 420;
    if (t < start) return false;
    if (this.specialActiveCount() >= this.specialEnemyCap()) return false;
    const threat = this.lateThreat ? this.lateThreat() : 0;
    const post8 = t >= (CFG.idlePressureStart || 480);
    const chance = Math.min(post8 ? 0.33 : 0.19, (post8 ? 0.060 : 0.026) + threat * (post8 ? 0.023 : 0.018));
    return RNG.next() < chance;
  },

  pickSpecialEnemyType(t) {
    const start = CFG.lateRampStart || 420;
    const threat = this.lateThreat ? this.lateThreat() : 0;
    const post8 = t >= (CFG.idlePressureStart || 480);
    const base = [
      { id: 'charger', w: post8 ? 6.2 : 5.2 },
      { id: 'bulwark', w: post8 ? 5.4 : 4.4 },
      { id: 'warden', w: post8 ? 4.6 : (t > 510 ? 3.8 : 1.5) },
      { id: 'miner', w: post8 ? 4.2 : (t > 560 ? 3.6 : 1.2) },
      { id: 'spawner', w: post8 ? 2.6 + threat * 0.42 : (t > start + 90 ? 2.0 + threat * 0.35 : 0.7) },
    ];
    const pool = base.filter(o => this.specialCountByType(o.id) < this.specialTypeCap(o.id));
    return (pool.length ? weightedPick(pool) : weightedPick(base)).id;
  },
});
