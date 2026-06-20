'use strict';
// Timed item drop spawning, expiry, collision handling, and effect dispatch.
const LootDrops = {
  spawnDrop(kind, x, y, life = null, boss = false) {
    const ttl = life || CFG.dropLife[kind] || 150;
    this.trimDropsForSpawn(!!boss);
    this.drops.push({ x, y, kind, bob: 0, life: ttl, maxLife: ttl, boss: !!boss });
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
      if (dist2(d.x, d.y, p.x, p.y) < 42 * 42) {
        LootOutcomes.removeAt(this.drops, i);
        LootOutcomes.applyAll(this, [LootOutcomes.dropOutcome(d.kind)]);
      }
    }
  },

  applyDrop(kind) {
    LootOutcomes.applyAll(this, [LootOutcomes.dropOutcome(kind)]);
  },
};
