'use strict';
// Time-based enemy type selection policy.
Object.assign(Game, {
  pickEnemyType(t) {
    if (this.shouldSpawnSpecial && this.shouldSpawnSpecial(t)) return this.pickSpecialEnemyType(t);
    const pool = [{ id: 'mite', w: 10 }];
    if (t > 28) pool.push({ id: 'runner', w: 5 + t / 70 });
    if (t > 75) pool.push({ id: 'tank', w: 3 + t / 130 });
    if (t > 95) pool.push({ id: 'swarm', w: 4 });
    if (t > 140) pool.push({ id: 'shooter', w: 3.5 });
    if (t > 300) pool.push({ id: 'brute', w: 2 + (t - 300) / 90 });
    return weightedPick(pool).id;
  },
});
