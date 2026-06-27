'use strict';
// Public Game boss spawn API.
Object.assign(Game, {
  activeBossCount() {
    return BossSpawnPolicy.activeBossCount(this.enemies);
  },

  bossCap() {
    return BossSpawnPolicy.bossCap(this.time);
  },

  spawnBoss(idx, hpMult = 1, spdMult = 1, opts = {}) {
    if (!BossSpawnPolicy.canSpawnBoss(this)) return null;
    const def = BOSSES[idx];
    if (!def) return null;
    const position = EnemyFactoryPlacement.bossPosition(this);
    const boss = BossSpawnEntity.createBoss(def, position, hpMult, spdMult, opts);
    BossSpawnRegistration.registerBoss(this, boss);
    if (this.prepareBossAfterSpawn) this.prepareBossAfterSpawn(boss, opts);
    BossSpawnEffects.showBossSpawnWarning(this, boss.bossDef);
    return boss;
  },

  spawnMegaBoss(tier = 1) {
    const def = BOSSES.find(b => b && b.mega) || BOSSES[3];
    if (!def) return null;
    if (this.activeEvent && this.activeEvent.state === 'active') return null;

    const position = EnemyFactoryPlacement.bossPosition(this);
    const safeTier = Math.max(1, Math.floor(Number(tier) || 1));
    const absorption = this.absorbEnemiesForMegaBoss(position, def);
    this.trimMegaBossProjectilePressure();
    const stat = this.st || (typeof this.stat === 'function' ? this.stat() : null);
    const playerSpeed = stat && stat.spd ? stat.spd : CFG.player.speed;
    const megaSpeedMult = playerSpeed * 0.68 / Math.max(1, def.spd);

    const boss = BossSpawnEntity.createBoss(def, position, 1 + (safeTier - 1) * 0.62, megaSpeedMult, {
      absorbedCount: absorption.count,
      absorbedHp: Math.min(6200 * (1 + (safeTier - 1) * 0.55), absorption.hp * (0.16 + Math.min(0.08, (safeTier - 1) * 0.012))),
      megaTier: safeTier,
      defPatch: this.megaBossDifficultyPatch(def, safeTier),
    });
    BossSpawnRegistration.registerBoss(this, boss);
    if (this.prepareBossAfterSpawn) this.prepareBossAfterSpawn(boss, {
      kind: 'mega',
      affixes: typeof BossInteractions !== 'undefined' ? BossInteractions.megaAffixesForTier(safeTier) : ['devour'],
      initialAbilityT: 3.8,
    });
    BossSpawnEffects.showBossSpawnWarning(this, boss.bossDef);
    GameRuntime.banner(tr('banner.megaBossForm', { name: boss.bossDef.name, tier: safeTier }), 'warn');
    this.spawnMegaBossFormationFx(position, boss.bossDef);
    this.spawnBurst(position.x, position.y, def.color, 52, 320, 16, 1.05);
    this.hitStop(0.32, 0.05);
    this.shake(10, 0.7);
    return boss;
  },


  megaBossDifficultyPatch(def, tier) {
    const over = Math.max(0, tier - 1);
    return {
      megaTier: tier,
      r: Math.max(104, (def.r || 142) * 0.78) + Math.min(24, over * 4),
      ringN: (def.ringN || 24) + Math.min(14, over * 2),
      ringCd: Math.max(2.65, (def.ringCd || 4.3) - over * 0.2),
      summonN: (def.summonN || 8) + Math.min(10, Math.floor(over * 1.4)),
      summonCd: Math.max(4.9, (def.summonCd || 8.2) - over * 0.34),
      trapCd: Math.max(3.9, (def.trapCd || 6.1) - over * 0.22),
      laneCd: Math.max(4.4, (def.laneCd || 7.4) - over * 0.22),
    };
  },


  spawnMegaBossFormationFx(position, def) {
    if (!this.novas) return;
    this.novas.push({
      field: true, visual: 'blackhole', x: position.x, y: position.y,
      r: Math.max(210, def.r * 2.2), maxR: Math.max(210, def.r * 2.2),
      life: 4.2, maxLife: 4.2, tick: 0, tickEvery: 0.35,
      dmg: 0, pull: 0, slow: 0, id: ++this.novaSeq, source: 'boss:mega-form', color: def.color,
    });
    this.novas.push({ x: position.x, y: position.y, r: 8, maxR: Math.max(340, def.r * 3.2), dmg: 0, kb: 0, id: ++this.novaSeq, delay: 0, visualOnly: true, speed: 520, color: def.color });
  },

  absorbEnemiesForMegaBoss(position, def) {
    const candidates = this.megaBossAbsorptionCandidates(position);
    let absorbedHp = 0;
    let absorbedCount = 0;
    for (const enemy of candidates) {
      const idx = this.enemies.indexOf(enemy);
      if (idx < 0) continue;
      absorbedHp += Math.max(0, enemy.hp || enemy.maxHp || 0);
      absorbedCount++;
      this.spawnMegaBossAbsorbFx(enemy, position, def);
      this.enemies[idx] = this.enemies[this.enemies.length - 1];
      this.enemies.pop();
    }
    this.boss = this.enemies.find(e => e.boss) || null;
    return { count: absorbedCount, hp: absorbedHp };
  },

  megaBossAbsorptionCandidates(position) {
    const important = [];
    const normal = [];
    for (const enemy of this.enemies) {
      if (enemy.boss || enemy.elite || enemy.special) important.push(enemy);
      else normal.push(enemy);
    }
    normal.sort((a, b) => dist2(a.x, a.y, position.x, position.y) - dist2(b.x, b.y, position.x, position.y));
    return [...important, ...normal.slice(0, Math.max(28, Math.min(62, normal.length)))];
  },


  spawnMegaBossAbsorbGhost(enemy, position, def, color, distance) {
    if (!this.megaAbsorbs) return;
    const life = clamp(0.62 + distance / 1650, 0.72, 1.7);
    const tx = position.x + rand(-def.r * 0.18, def.r * 0.18);
    const ty = position.y + rand(-def.r * 0.18, def.r * 0.18);
    while (this.megaAbsorbs.length >= 90) this.megaAbsorbs.shift();
    this.megaAbsorbs.push({
      x: enemy.x, y: enemy.y, vx: (tx - enemy.x) / life, vy: (ty - enemy.y) / life,
      r: enemy.r, shape: enemy.def && enemy.def.shape ? enemy.def.shape : 'circle', color,
      life, maxLife: life, spin: rand(-1.2, 1.2),
    });
  },

  spawnMegaBossAbsorbFx(enemy, position, def) {
    const dx = position.x - enemy.x;
    const dy = position.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;
    const color = enemy.def && enemy.def.color ? enemy.def.color : def.color;
    this.spawnMegaBossAbsorbGhost(enemy, position, def, color, d);
    const count = enemy.boss ? 9 : enemy.elite || enemy.special ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const ox = rand(-enemy.r * 0.75, enemy.r * 0.75);
      const oy = rand(-enemy.r * 0.75, enemy.r * 0.75);
      const life = rand(0.75, 1.25) + Math.min(0.55, d / 2200);
      const tx = position.x + rand(-def.r * 0.28, def.r * 0.28);
      const ty = position.y + rand(-def.r * 0.28, def.r * 0.28);
      this.spawnParticle(enemy.x + ox, enemy.y + oy, (tx - enemy.x - ox) / life, (ty - enemy.y - oy) / life, life, enemy.boss ? 11 : enemy.elite ? 7 : 4.6, color, 0);
    }
    if (enemy.boss || enemy.elite || enemy.special) this.spawnBurst(enemy.x, enemy.y, color, enemy.boss ? 14 : 8, 120, enemy.boss ? 7 : 5, 0.32);
  },

  trimMegaBossProjectilePressure() {
    if (!this.ebullets || this.ebullets.length <= 36) return;
    this.ebullets.splice(0, this.ebullets.length - 36);
  },
});
