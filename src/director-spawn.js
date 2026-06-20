'use strict';
// Enemy director spawn scheduling: normal waves, burst waves, elites, and bosses.
Object.assign(Game, {
  directNormalEnemySpawns(dt, t = this.time) {
    const d = this.dir;
    d.spawnT -= dt;
    if (d.spawnT > 0) return;
    const context = this.normalEnemySpawnContext(t);
    this.resetNormalEnemySpawnTimer(t, context);
    this.spawnNormalEnemyBatch(this.normalEnemyBatchSize(t, context), t);
  },

  normalEnemySpawnContext(t) {
    return {
      endlessT: Math.max(0, t - CFG.winTime),
      pressureT: Math.max(0, t - (CFG.dropTaperStart || 360)),
      threat: this.lateThreat ? this.lateThreat() : 0,
      eventMul: this.normalEnemyEventMultiplier(t),
      mobileMul: this.normalEnemyMobileMultiplier(),
    };
  },

  resetNormalEnemySpawnTimer(t, context) {
    const pressureDelay = Math.min(0.34, context.pressureT * 0.00034);
    const baseDelay = this.endless
      ? Math.max(0.11, 0.28 - context.endlessT * 0.00016)
      : Math.max(0.18, 1.05 - t * 0.00125 - pressureDelay);
    const pressureMul = 1 + Math.min(0.72, context.pressureT / 420 * 0.36);
    const loopPressure = t >= CFG.winTime ? 1.35 + Math.min(0.75, context.endlessT / 900) : 1;
    this.dir.spawnT = baseDelay / (context.eventMul * pressureMul * loopPressure * (1 + Math.min(0.55, context.threat * 0.055)) * context.mobileMul);
  },

  normalEnemyBatchSize(t, context) {
    const baseBatch = this.endless
      ? 1 + Math.floor(CFG.winTime / 35) + Math.floor(context.endlessT / 95)
      : 1 + Math.floor(t / 36) + Math.floor(context.pressureT / 150);
    const pressureBatch = 1 + Math.min(0.46, context.pressureT / 600 * 0.32);
    const loopBatch = t >= CFG.winTime ? 1.28 + Math.min(0.55, context.endlessT / 1000) : 1;
    return Math.ceil(baseBatch * pressureBatch * loopBatch * Math.min(1.26, context.eventMul) * context.mobileMul);
  },

  normalEnemyEventMultiplier(t) {
    return this.activeEvent && this.activeEvent.state === 'active' ? (t < CFG.winTime + 240 ? 1.25 : 1.4) : 1;
  },

  normalEnemyMobileMultiplier() {
    return this.isMobileRuntime && this.isMobileRuntime() ? 0.82 : 1;
  },

  spawnNormalEnemyBatch(batch, t) {
    const limit = this.enemyLimit ? this.enemyLimit() : CFG.maxEnemies + (this.endless ? 55 : 0);
    const room = Math.max(0, limit - this.enemies.length);
    const n = Math.min(batch, room);
    for (let i = 0; i < n; i++) this.spawnEnemy(this.pickEnemyType(t));
  },

  directSwarmBurst(dt, t = this.time) {
    if (t <= 70) return;
    const d = this.dir;
    d.burstT -= dt;
    if (d.burstT > 0) return;
    d.burstT = rand(13, 18);
    this.spawnSwarmBurst(t);
  },

  spawnSwarmBurst(t) {
    const limit = this.enemyLimit ? this.enemyLimit() : CFG.maxEnemies + (this.endless ? 55 : 0);
    const room = Math.max(0, limit - this.enemies.length);
    const loopMul = t >= CFG.winTime ? 1.45 + Math.min(0.5, (t - CFG.winTime) / 1000) : 1;
    const n = Math.min(Math.ceil(randi(10, 14 + Math.floor(t / 60)) * loopMul), room);
    if (n <= 0) return;
    const base = rand(0, TAU);
    for (let i = 0; i < n; i++) {
      const a = base + i / n * TAU;
      this.spawnEnemy('swarm', this.player.x + Math.cos(a) * 640, this.player.y + Math.sin(a) * 640);
    }
    GameRuntime.banner(tr('banner.swarm'), 'warn');
  },

  directEliteSpawns(dt, t = this.time) {
    if (t <= 100) return;
    const d = this.dir;
    d.eliteT -= dt;
    if (d.eliteT > 0) return;
    this.resetEliteSpawnTimer(t);
    this.spawnEliteEnemy(t);
  },

  resetEliteSpawnTimer(t) {
    const late = Math.max(0, t - CFG.winTime);
    const threat = this.lateThreat ? this.lateThreat() : 0;
    this.dir.eliteT = this.endless
      ? Math.max(t > CFG.winTime + 240 ? 18 : 24, 34 - late / 90)
      : Math.max(24, 50 / (1 + threat * 0.12));
  },

  spawnEliteEnemy(t) {
    const type = pick(['mite', 'runner', 'tank', 'shooter', t > 300 ? 'brute' : 'tank', t > CFG.winTime + 240 ? 'brute' : 'tank']);
    this.spawnEnemy(type, null, null, true);
    GameRuntime.banner(tr('banner.elite'), 'info');
  },

  directScheduledBossSpawns(t = this.time) {
    const bossTimes = [180, 360, 540];
    const d = this.dir;
    if (d.bossIdx >= bossTimes.length || t < bossTimes[d.bossIdx] || this.boss) return;
    this.spawnBoss(d.bossIdx);
    d.bossIdx++;
  },

  directMegaBossSpawn(t = this.time) {
    const d = this.dir;
    const spawned = Math.max(0, d.megaBossCount || 0);
    const nextMegaT = CFG.winTime * (spawned + 1);
    if (t < nextMegaT || (this.player && this.player.dead)) return;
    const boss = this.spawnMegaBoss ? this.spawnMegaBoss(spawned + 1) : null;
    if (!boss) return;
    d.megaBossCount = spawned + 1;
    d.bossIdx = Math.max(d.bossIdx || 0, 3);
    d.bossT = Math.max(d.bossT || 0, 28);
  },

  directEndlessBossSpawns(dt, t = this.time) {
    const bossTimes = [180, 360, 540];
    const d = this.dir;
    if (!this.endless || d.bossIdx < bossTimes.length) return;
    d.bossT -= dt;
    if (d.bossT > 0) return;
    this.resetEndlessBossTimer(t);
    if (this.activeEvent && this.activeEvent.state === 'active') {
      d.bossT = 10;
      return;
    }
    if (this.activeBossCount() < this.bossCap()) this.spawnEndlessBoss(t);
  },

  resetEndlessBossTimer(t) {
    const endlessT = Math.max(0, t - CFG.winTime);
    this.dir.bossT = Math.max(72, 88 - endlessT / 120);
  },

  endlessBossTier(t) {
    return Math.max(1, 1 + Math.floor(Math.max(0, t - CFG.winTime) / 300));
  },

  buildEndlessBossPatternPatch(baseDef, tier) {
    const patch = { endlessTier: tier };
    const picks = [];
    const addPattern = pattern => picks.push(pattern);
    addPattern('ring');
    if (tier >= 2) addPattern('summon');
    if (tier >= 3) addPattern('trap');
    if (tier >= 4) addPattern('lane');
    if (tier >= 5) addPattern('denseRing');

    const count = Math.min(picks.length, 1 + Math.floor((tier - 1) / 2));
    for (let i = 0; i < count; i++) {
      const selected = pick(picks);
      picks.splice(picks.indexOf(selected), 1);
      this.applyEndlessBossPatternPatch(patch, baseDef, selected, tier);
    }
    return patch;
  },

  applyEndlessBossPatternPatch(patch, baseDef, pattern, tier) {
    if (pattern === 'ring') {
      patch.ring = true;
      patch.ringN = Math.max(patch.ringN || 0, (baseDef.ringN || 8) + Math.min(8, tier));
      patch.ringCd = Math.min(patch.ringCd || 99, Math.max(3.4, (baseDef.ringCd || 5.7) - tier * 0.16));
      patch.ringGap = Math.max(patch.ringGap || 0, tier >= 3 ? 2 : 1);
    } else if (pattern === 'denseRing') {
      patch.ring = true;
      patch.ringN = Math.max(patch.ringN || 0, (baseDef.ringN || 10) + Math.min(12, tier + 4));
      patch.ringCd = Math.min(patch.ringCd || 99, Math.max(3.0, (baseDef.ringCd || 5.4) - tier * 0.18));
      patch.ringGap = Math.max(patch.ringGap || 0, 2);
    } else if (pattern === 'summon') {
      patch.summon = baseDef.summon || pick(['runner', 'swarm', 'mite']);
      patch.summonN = Math.max(patch.summonN || 0, (baseDef.summonN || 2) + Math.min(6, Math.floor(tier / 2)));
      patch.summonCd = Math.min(patch.summonCd || 99, Math.max(5.0, (baseDef.summonCd || 8.5) - tier * 0.13));
    } else if (pattern === 'trap') {
      patch.trap = true;
      patch.trapCd = Math.min(patch.trapCd || 99, Math.max(5.2, 8.2 - tier * 0.18));
    } else if (pattern === 'lane') {
      patch.laneTrap = true;
      patch.laneCd = Math.min(patch.laneCd || 99, Math.max(5.8, 9.4 - tier * 0.18));
    }
  },

  spawnEndlessBoss(t) {
    const endlessT = Math.max(0, t - CFG.winTime);
    const lateBoss = Math.max(0, t - (CFG.winTime + 240));
    const candidates = BOSSES.map((boss, idx) => boss && !boss.mega ? idx : -1).filter(idx => idx >= 0);
    const idx = candidates.length ? pick(candidates) : 0;
    const tier = this.endlessBossTier(t);
    this.spawnBoss(
      idx,
      (2.0 + endlessT / 220 * 0.78) * (1 + Math.min(0.9, lateBoss / 500)),
      1.18 + Math.min(0.42, endlessT / 1300),
      { defPatch: this.buildEndlessBossPatternPatch(BOSSES[idx], tier) }
    );
  },
});
