'use strict';
// Timed item drop spawning, expiry, collision handling, and effect dispatch.
const LootDrops = {
  spawnDrop(kind, x, y, life = null, boss = false) {
    const ttl = life || CFG.dropLife[kind] || 150;
    if (!boss && this.mergeNearbyDrop && this.mergeNearbyDrop(kind, x, y, ttl)) return;
    this.trimDropsForSpawn(!!boss);
    this.drops.push({ x, y, kind, bob: 0, life: ttl, maxLife: ttl, boss: !!boss, stack: 1 });
  },

  mergeNearbyDrop(kind, x, y, ttl) {
    if (!LootOutcomes.stackableDrop(kind)) return false;
    const radius = CFG.dropMergeRadius || 48;
    const maxStack = CFG.maxDropStack || 3;
    let best = null;
    let bestD2 = radius * radius;
    for (const d of this.drops) {
      if (d.boss || d.kind !== kind || (d.stack || 1) >= maxStack) continue;
      const d2 = dist2(x, y, d.x, d.y);
      if (d2 <= bestD2) { best = d; bestD2 = d2; }
    }
    if (!best) return false;
    best.stack = Math.min(maxStack, (best.stack || 1) + 1);
    best.maxLife = ttl;
    best.life = ttl;
    best.x = (best.x * 2 + x) / 3;
    best.y = (best.y * 2 + y) / 3;
    best.bob = 0;
    return true;
  },

  trimDropsForSpawn(incomingBoss = false) {
    const cap = this.dropLimit ? this.dropLimit() : (CFG.maxDrops || 130);
    if (this.drops.length < cap) return;
    const remove = LootOutcomes.trimDropIndex(this.drops, this.player, incomingBoss);
    LootOutcomes.removeAt(this.drops, remove);
    if (this.metrics) LootOutcomes.applyAll(this, [{ type: 'dropTrimmed' }]);
  },

  updateDrops(dt) {
    const p = this.player;
    if (p.dead) return;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life -= dt;
      if (d.life <= 0) {
        LootOutcomes.removeAt(this.drops, i);
        LootOutcomes.applyAll(this, [{ type: 'dropExpired' }]);
        continue;
      }
      d.bob += dt * 2.5;
      if (this.updateFocusPickup && this.updateFocusPickup(d, dt, 'drop')) continue;
      if (d.bossPullT > 0) d.bossPullT -= dt;
      else d.bossPull = false;
      if (dist2(d.x, d.y, p.x, p.y) < 42 * 42) {
        if (d.bossPull) this.spawnText(p.x, p.y - 42, tr('boss.absorb.blocked'), true, '#7dffc1');
        LootOutcomes.removeAt(this.drops, i);
        LootOutcomes.applyAll(this, [LootOutcomes.dropOutcome(d.kind, d)]);
      }
    }
  },

  applyDrop(kind) {
    LootOutcomes.applyAll(this, [LootOutcomes.dropOutcome(kind)]);
  },
};
