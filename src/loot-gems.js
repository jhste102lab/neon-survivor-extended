'use strict';
// Gem pickup spawning, cap/merge policy, magneting, and XP collection.
const LootGems = {
  spawnGem(x, y, v, tier) {
    const gemLimit = this.gemLimit ? this.gemLimit() : CFG.maxGems;
    if (this.gems.length >= gemLimit) { // 가장 오래된 보석에 합치기
      LootOutcomes.mergeGemValue(this.gems[0], v);
      return;
    }
    this.gems.push({ x, y, v, tier, vx: rand(-40, 40), vy: rand(-40, 40), mag: false, ms: 0, bob: rand(0, TAU), age: 0 });
  },

  updateGems(dt, st) {
    const p = this.player;
    if (p.dead) return;
    const pr2 = st.pickup * st.pickup;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.age = (g.age || 0) + dt;
      if (g.bossProtectedT > 0) g.bossProtectedT = Math.max(0, g.bossProtectedT - dt);
      if (g.bossProtectedT > 0) {
        g.bob += dt * 3;
        g.x += (g.vx || 0) * dt;
        g.y += (g.vy || 0) * dt;
        g.vx *= 0.9 ** (dt * 60);
        g.vy *= 0.9 ** (dt * 60);
        continue;
      }
      if (this.tryAutoSettleLateGem && this.tryAutoSettleLateGem(g, i)) continue;
      if (this.tryBlockBossPickup && this.tryBlockBossPickup(g, 'gem', i)) continue;
      if (this.updateFocusPickup && this.updateFocusPickup(g, dt, 'gem')) { g.mag = false; g.ms = 0; continue; }
      if (g.bossPullT > 0) g.bossPullT -= dt;
      else g.bossPull = false;
      g.bob += dt * 3;
      if (!g.mag) {
        g.x += g.vx * dt; g.y += g.vy * dt;
        g.vx *= 0.9 ** (dt * 60); g.vy *= 0.9 ** (dt * 60);
        if (dist2(g.x, g.y, p.x, p.y) < pr2) { g.mag = true; g.ms = 60; }
      } else {
        const d = Math.sqrt(dist2(g.x, g.y, p.x, p.y)) || 1;
        g.ms = Math.min(900, g.ms + 2400 * dt);
        g.x += (p.x - g.x) / d * g.ms * dt;
        g.y += (p.y - g.y) / d * g.ms * dt;
        if (d < 20) {
          if (g.bossPull) this.spawnText(p.x, p.y - 38, tr('boss.absorb.blocked'), true, '#7dffc1');
          LootOutcomes.removeAt(this.gems, i);
          LootOutcomes.applyAll(this, [LootOutcomes.gemCollectOutcome(g, p, this.combo)]);
        }
      }
    }
  },
};
