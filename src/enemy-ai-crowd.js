'use strict';
// Enemy crowd pressure and late-loop compaction.
Object.assign(Game, {
  enemyCrowdPressure(capLimit) {
    return clamp((this.enemies.length - capLimit * 0.94) / Math.max(1, capLimit * 0.06), 0, 1);
  },

  compactEnemyCrowd(dt) {
    if (this.time < CFG.winTime) return;
    const capLimit = this.enemyLimit ? this.enemyLimit() : CFG.maxEnemies + (this.endless ? 55 : 0);
    const fill = this.enemies.length / capLimit;
    if (fill < 0.90) return;
    this.dir.compactT = (this.dir.compactT || 0) - dt;
    if (this.dir.compactT > 0) return;
    this.dir.compactT = fill > 0.98 ? 0.32 : 0.55;
    const p = this.player, candidates = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.boss || e.elite || e.special) continue;
      const d = dist2(p.x, p.y, e.x, e.y);
      if (e.type === 'brute' && (fill < 0.95 || d < 980 * 980 || (e.age || 0) < 18)) continue;
      if (d < 720 * 720 && (e.age || 0) < 10) continue;
      candidates.push({ i, score: d + (e.age || 0) * 28000 + (e.type === 'swarm' ? 120000 : 0) + (e.type === 'brute' ? 70000 : 0) });
    }
    candidates.sort((a, b) => b.score - a.score);
    const target = fill > 0.98 ? 0.88 : 0.91;
    const remove = Math.min(fill > 0.98 ? 26 : 14, Math.max(2, Math.ceil((this.enemies.length - capLimit * target) / 3)), candidates.length);
    const idxs = candidates.slice(0, remove).map(c => c.i).sort((a, b) => b - a);
    for (const i of idxs) this.enemies.splice(i, 1);
  },
});
