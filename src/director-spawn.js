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
    return DirectorSpawnPolicy.normalContext({
      time: t,
      winTime: CFG.winTime,
      dropTaperStart: CFG.dropTaperStart || 360,
      endless: this.endless,
      threat: this.lateThreat ? this.lateThreat() : 0,
      eventMul: this.normalEnemyEventMultiplier(t),
      mobileMul: this.normalEnemyMobileMultiplier(),
    });
  },

  resetNormalEnemySpawnTimer(t, context) {
    this.dir.spawnT = DirectorSpawnPolicy.normalSpawnDelay(context);
  },

  normalEnemyBatchSize(t, context) {
    return DirectorSpawnPolicy.normalBatchSize(context);
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
    const radius = EnemyFactoryPlacement.swarmBurstRadius ? EnemyFactoryPlacement.swarmBurstRadius(this) : 640;
    for (let i = 0; i < n; i++) {
      const a = base + i / n * TAU;
      this.spawnEnemy('swarm', this.player.x + Math.cos(a) * radius, this.player.y + Math.sin(a) * radius);
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
    const threat = this.lateThreat ? this.lateThreat() : 0;
    this.dir.eliteT = DirectorSpawnPolicy.eliteDelay({ time: t, winTime: CFG.winTime, endless: this.endless, threat });
  },

  spawnEliteEnemy(t) {
    const type = pick(['mite', 'runner', 'tank', 'shooter', t > 300 ? 'brute' : 'tank', t > CFG.winTime + 240 ? 'brute' : 'tank']);
    this.spawnEnemy(type, null, null, true);
    GameRuntime.banner(tr('banner.elite'), 'info');
  },

  directScheduledBossSpawns(t = this.time) {
    const d = this.dir;
    const idx = DirectorSpawnPolicy.scheduledBossIndex({ time: t, bossIdx: d.bossIdx, hasBoss: !!this.boss });
    if (idx < 0) return;
    this.spawnBoss(idx);
    d.bossIdx++;
  },

  directMegaBossSpawn(t = this.time) {
    const d = this.dir;
    const nextCount = DirectorSpawnPolicy.shouldSpawnMegaBoss({ time: t, winTime: CFG.winTime, interval: 180, spawned: d.megaBossCount || 0, playerDead: !!(this.player && this.player.dead) });
    if (!nextCount) return;
    const boss = this.spawnMegaBoss ? this.spawnMegaBoss(nextCount) : null;
    if (!boss) return;
    d.megaBossCount = nextCount;
    d.bossIdx = Math.max(d.bossIdx || 0, 3);
    d.bossT = Math.max(d.bossT || 0, 28);
  },

  directEndlessBossSpawns(dt, t = this.time) {
    const d = this.dir;
    if (!this.endless) return;
    const nextNormal = d.nextEndlessBossT || (CFG.winTime + 60);
    if (t < nextNormal) return;
    if (typeof BossInteractions !== 'undefined' && BossInteractions.shouldUseMegaSlot(t, CFG.winTime)) {
      this.advanceBossRushNormalSchedule(t);
      return;
    }
    if (!DirectorSpawnPolicy.endlessNormalBossDue({ time: t, winTime: CFG.winTime, next: nextNormal, megaSlot: false })) return;
    this.advanceBossRushNormalSchedule(t);
    if (this.activeEvent && this.activeEvent.state === 'active') {
      d.nextEndlessBossT = Math.min(d.nextEndlessBossT || Infinity, t + 10);
      return;
    }
    if (DirectorSpawnPolicy.shouldSpawnEndlessBoss({
      endless: this.endless,
      bossIdx: 3,
      activeEvent: !!(this.activeEvent && this.activeEvent.state === 'active'),
      activeBossCount: this.activeBossCount(),
      bossCap: this.bossCap(),
    })) this.spawnEndlessBoss(t);
    else if (this.feedBossRushEnergy) this.feedBossRushEnergy('normal');
  },

  resetEndlessBossTimer(t) {
    this.dir.bossT = DirectorSpawnPolicy.endlessBossDelay({ time: t, winTime: CFG.winTime });
  },

  endlessBossTier(t) {
    return DirectorSpawnPolicy.endlessBossTier({ time: t, winTime: CFG.winTime });
  },

  buildEndlessBossPatternPatch(baseDef, tier) {
    return DirectorSpawnPolicy.endlessBossPatternPatch(baseDef, tier, pick);
  },

  applyEndlessBossPatternPatch(patch, baseDef, pattern, tier) {
    return DirectorSpawnPolicy.applyEndlessBossPatternPatch(patch, baseDef, pattern, tier, pick);
  },

  spawnEndlessBoss(t) {
    const endlessT = Math.max(0, t - CFG.winTime);
    const lateBoss = Math.max(0, t - (CFG.winTime + 240));
    const candidates = BOSSES.map((boss, idx) => boss && !boss.mega ? idx : -1).filter(idx => idx >= 0);
    const idx = candidates.length ? pick(candidates) : 0;
    const tier = this.endlessBossTier(t);
    const affix = typeof BossInteractions !== 'undefined' ? BossInteractions.normalAffixForTime(t, CFG.winTime) : 'devour';
    this.spawnBoss(
      idx,
      (2.35 + endlessT / 220 * 0.90) * (1 + Math.min(0.9, lateBoss / 500)),
      1.18 + Math.min(0.42, endlessT / 1300),
      { kind: 'endless', affixes: [affix], defPatch: this.buildEndlessBossPatternPatch(BOSSES[idx], tier) }
    );
  },
});
