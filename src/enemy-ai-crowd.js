'use strict';
// Enemy crowd pressure and late-loop compaction.
Object.assign(Game, {
  enemyCrowdPressure(capLimit) {
    return clamp((this.enemies.length - capLimit * 0.94) / Math.max(1, capLimit * 0.06), 0, 1);
  },

  compactEnemyCrowd(dt) {
    if (this.time < 60) return;
    const capLimit = this.enemyLimit ? this.enemyLimit() : CFG.maxEnemies + (this.endless ? 55 : 0);
    const fill = this.enemies.length / capLimit;
    const target = this.enemyObjectTarget(capLimit);
    if (this.enemies.length < target && fill < 0.72 && this.time < CFG.winTime) return;
    this.dir.compactT = (this.dir.compactT || 0) - dt;
    if (this.dir.compactT > 0) return;
    this.dir.compactT = this.enemies.length > target ? 1.2 : (fill > 0.96 ? 1.6 : 2.2);
    this.mergeOverlappingEnemyCohorts(capLimit, fill, target);
  },

  enemyObjectTarget(capLimit) {
    const mobile = this.isMobileRuntime && this.isMobileRuntime();
    const scale = this.userTimeScale || 1;
    const base = mobile ? 78 : 150;
    const speedK = clamp((scale - 1) / 2, 0, 1);
    return Math.min(capLimit, Math.round(lerp(base, mobile ? 58 : 118, speedK)));
  },

  stackCountForEnemy(e) {
    return Math.max(1, Math.floor(Number(e && e.stackCount) || 1));
  },

  stackUnitMaxHp(e) {
    const count = this.stackCountForEnemy(e);
    return Math.max(1, Number(e && e.stackUnitMaxHp) || ((e && e.maxHp) || 1) / count);
  },

  stackUnitXp(e) {
    return Math.max(0, Number(e && e.stackUnitXp) || Number(e && e.xp) || 0);
  },

  canCohortStackEnemy(e) {
    return !!(e && !e.boss && !e.elite && !e.special && e.hp > 0);
  },

  cohortMergeProtected(e) {
    if (!e || !this.player) return true;
    if (dist2(this.player.x, this.player.y, e.x, e.y) < 860 * 860) return true;
    if (typeof Render !== 'undefined' && Render.worldVisible && Render.worldVisible(e.x, e.y, 260)) return true;
    return false;
  },

  mergeOverlappingEnemyCohorts(capLimit, fill, target = capLimit) {
    const p = this.player;
    if (!p || !this.enemies || this.enemies.length < 36) return;
    const overTarget = Math.max(0, this.enemies.length - target);
    const urgent = overTarget > 0 || fill > 0.94;
    const cell = urgent ? 360 : 58;
    const nearGuard2 = urgent ? 0 : 240 * 240;
    const buckets = new Map();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!this.canCohortStackEnemy(e)) continue;
      if (this.cohortMergeProtected(e)) continue;
      const d2p = dist2(p.x, p.y, e.x, e.y);
      if (d2p < nearGuard2) continue;
      const cx = Math.floor(e.x / cell), cy = Math.floor(e.y / cell);
      const key = `${e.type}:${cx}:${cy}`;
      let bucket = buckets.get(key);
      if (!bucket) { bucket = []; buckets.set(key, bucket); }
      bucket.push(i);
    }
    const removeIdxs = [];
    const mergeBudget = urgent ? Math.max(60, Math.min(140, overTarget + 40)) : 34;
    for (const idxs of buckets.values()) {
      if (idxs.length < 2 || removeIdxs.length >= mergeBudget) continue;
      const host = this.pickCohortHost(idxs);
      if (!host) continue;
      const hostIdx = this.enemies.indexOf(host);
      if (hostIdx < 0) continue;
      for (const idx of idxs) {
        if (removeIdxs.length >= mergeBudget) break;
        if (idx === hostIdx) continue;
        const e = this.enemies[idx];
        if (!this.canCohortStackEnemy(e) || e.type !== host.type) continue;
        if (this.cohortMergeProtected(e)) continue;
        const mergeRadius = urgent ? cell * 1.55 : (host.r + e.r) * 1.45;
        if (dist2(host.x, host.y, e.x, e.y) > mergeRadius * mergeRadius) continue;
        this.absorbEnemyIntoCohort(host, e);
        removeIdxs.push(idx);
      }
    }
    removeIdxs.sort((a, b) => b - a);
    for (const idx of removeIdxs) {
      if (idx >= 0 && idx < this.enemies.length) this.enemies.splice(idx, 1);
    }
  },

  pickCohortHost(indices) {
    let best = null, bestScore = -Infinity;
    for (const idx of indices) {
      const e = this.enemies[idx];
      if (!this.canCohortStackEnemy(e)) continue;
      const score = this.stackCountForEnemy(e) * 1000 + (e.age || 0) + (e.hp / Math.max(1, e.maxHp));
      if (score > bestScore) { best = e; bestScore = score; }
    }
    return best;
  },

  absorbEnemyIntoCohort(host, e) {
    const hc = this.stackCountForEnemy(host);
    const ec = this.stackCountForEnemy(e);
    const total = hc + ec;
    host.kx = (host.kx * hc + e.kx * ec) / total;
    host.ky = (host.ky * hc + e.ky * ec) / total;
    host.cachedMvx = ((host.cachedMvx || 0) * hc + (e.cachedMvx || 0) * ec) / total;
    host.cachedMvy = ((host.cachedMvy || 0) * hc + (e.cachedMvy || 0) * ec) / total;
    host.hp += e.hp;
    host.maxHp += e.maxHp;
    host.stackCount = total;
    host.stackUnitMaxHp = host.maxHp / total;
    host.stackUnitXp = (this.stackUnitXp(host) * hc + this.stackUnitXp(e) * ec) / total;
    host.xp = host.stackUnitXp;
    host.age = Math.max(host.age || 0, e.age || 0);
    host.flash = Math.max(host.flash || 0, e.flash || 0);
  },

  resolveStackDamageDeaths(e) {
    const count = this.stackCountForEnemy(e);
    if (count <= 1 || e.hp <= 0) return false;
    const unitMax = this.stackUnitMaxHp(e);
    const deficit = Math.max(0, e.maxHp - e.hp);
    const killed = Math.min(count - 1, Math.floor(deficit / unitMax));
    if (killed <= 0) return false;
    e.stackCount = count - killed;
    e.maxHp = Math.max(unitMax, e.maxHp - unitMax * killed);
    e.hp = Math.min(e.hp, e.maxHp);
    this.grantStackUnitDeaths(e, killed);
    return true;
  },

  grantStackUnitDeaths(e, killed) {
    if (killed <= 0) return;
    this.kills += killed;
    this.combo += killed;
    this.comboT = 2;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const source = e.lastHitSource || 'unknown';
    if (this.metrics && this.metrics.killsBySource) this.metrics.killsBySource[source] = (this.metrics.killsBySource[source] || 0) + killed;
    if (typeof CombatUiFx !== 'undefined') {
      CombatUiFx.markKillsDirty();
      if (this.combo >= 1) CombatUiFx.showCombo(this.combo);
    }
    if (killed <= 3) GameRuntime.playSound('enemyDie');
    this.grantStackUnitRewards(e, killed);
  },

  grantStackUnitRewards(e, killed) {
    const xp = Math.round(this.stackUnitXp(e) * killed);
    if (xp > 0) {
      let v = xp;
      while (v > 0) {
        let tier, tv;
        if (v >= 25) { tier = 2; tv = 25; } else if (v >= 5) { tier = 1; tv = 5; } else { tier = 0; tv = 1; }
        v -= tv;
        this.spawnGem(e.x + rand(-16, 16), e.y + rand(-16, 16), tv, tier);
      }
    }
    if (e.type === 'swarm') return;
    const luck = this.st ? this.st.luck : 1;
    const dropLuck = Math.min(2.2, luck);
    const dropScale = this.itemDropScale ? this.itemDropScale() : 1;
    const rates = CFG.itemDropRate || {};
    const dropRolls = Math.min(killed, 12);
    for (let i = 0; i < dropRolls; i++) {
      const roll = RNG.next();
      const chickenT = (rates.chicken || 0.045) * dropLuck * dropScale;
      const magnetT = chickenT + (rates.magnet || 0.024) * dropLuck * dropScale;
      const bombT = magnetT + (rates.bomb || 0.020) * dropLuck * dropScale;
      if (roll < chickenT) this.spawnDrop('chicken', e.x, e.y);
      else if (roll < magnetT) this.spawnDrop('magnet', e.x, e.y);
      else if (roll < bombT) this.spawnDrop('bomb', e.x, e.y);
    }
  },
});
