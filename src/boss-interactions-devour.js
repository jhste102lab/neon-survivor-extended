'use strict';
// Endless boss devour pickup contest, healing, and backfire helpers.
Object.assign(Game, {
  devourConfig() {
    return CFG.endlessDevour || {};
  },

  devourEnabled() {
    const cfg = this.devourConfig();
    return cfg.enabled !== false;
  },

  markBossDevourTargets(boss, telegraph) {
    if (!this.devourEnabled() || !boss) return;
    const cfg = this.devourConfig();
    const until = (this.time || 0) + Math.max(0.1, telegraph || cfg.telegraph || 3) + Math.max(0.1, cfg.duration || 5.8) + 0.4;
    const dropR2 = (cfg.contestedRadiusDrop || 620) ** 2;
    const gemR2 = (cfg.contestedRadiusGem || 520) ** 2;
    for (const d of this.drops || []) {
      if (!d || d.kind === 'chest' || d.focusShelved) continue;
      if (dist2(d.x, d.y, boss.x, boss.y) > dropR2) continue;
      this.markPickupContestedByBoss(d, boss, until);
    }
    for (const g of this.gems || []) {
      if (!g || g.focusShelved) continue;
      if (dist2(g.x, g.y, boss.x, boss.y) > gemR2) continue;
      this.markPickupContestedByBoss(g, boss, until);
    }
    this.spawnText(boss.x, boss.y - boss.r - 48, tr('boss.devour.contested'), true, BossInteractions.color('devour'));
  },

  markPickupContestedByBoss(item, boss, until) {
    item.bossContested = true;
    item.bossContestedUntil = until;
    item.bossContestedBossId = boss && boss.id || boss && boss.novaId || `${boss.x}:${boss.y}`;
    item.bossContestedBoss = boss;
  },

  clearExpiredBossDevourTargets(boss = null, force = false) {
    const now = this.time || 0;
    const clear = item => {
      if (!item || !item.bossContested) return;
      if (boss && item.bossContestedBoss && item.bossContestedBoss !== boss) return;
      if (!force && item.bossContestedUntil > now) return;
      item.bossContested = false;
      item.bossContestedBoss = null;
      item.bossContestedBossId = '';
      item.bossContestedUntil = 0;
    };
    for (const d of this.drops || []) clear(d);
    for (const g of this.gems || []) clear(g);
  },

  isBossDevourActiveForPickup(item) {
    const boss = item && item.bossContestedBoss;
    return !!(item && item.bossContested && boss && boss.dropAbsorbT > 0);
  },

  canRemoteCollectPickup(item) {
    return !(item && (item.bossContested || item.bossProtectedT > 0));
  },

  tryBlockBossPickup(item, kind, index) {
    if (!item || !this.isBossDevourActiveForPickup(item)) return false;
    const p = this.player;
    const radius = kind === 'drop' ? 42 : 24;
    if (dist2(item.x, item.y, p.x, p.y) > radius * radius) return false;
    this.blockBossPickup(item, kind);
    return true;
  },

  blockBossPickup(item, kind) {
    const cfg = this.devourConfig();
    const p = this.player;
    const dx = item.x - p.x, dy = item.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    item.x += dx / d * 42;
    item.y += dy / d * 42;
    item.vx = dx / d * (cfg.blockKnockSpeed || 360);
    item.vy = dy / d * (cfg.blockKnockSpeed || 360);
    item.bossProtectedT = cfg.protectedT || 2.6;
    item.bossPull = false;
    item.bossPullT = 0;
    item.bossContested = false;
    item.bossContestedBoss = null;
    item.bossContestedUntil = 0;
    this.spawnText(item.x, item.y - 18, tr('boss.absorb.blocked'), true, '#7dffc1');
    this.spawnBurst(item.x, item.y, '#7dffc1', kind === 'drop' ? 7 : 4, 110, 4, 0.22);
  },

  pullDropsToBoss(boss, dt) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (d.kind === 'chest' || d.bossProtectedT > 0 || d.focusShelved) continue;
      if (dist2(d.x, d.y, boss.x, boss.y) > 620 * 620) continue;
      this.pullPickupToBoss(d, boss, dt, 250, 'drop');
      if (dist2(d.x, d.y, boss.x, boss.y) < Math.max(34, boss.r * 0.55) ** 2) {
        const stack = Math.max(1, Math.min(CFG.maxDropStack || 3, Math.round(Number(d.stack) || 1)));
        LootOutcomes.removeAt(this.drops, i);
        if (d.kind === 'bomb') this.backfireAbsorbedBomb(boss, stack, d.x, d.y);
        else if (d.kind === 'chicken') this.healBossFromDevour(boss, boss.maxHp * (this.devourConfig().chickenHealMaxHp || 0.018), d.x, d.y);
        else if (d.kind === 'magnet') this.applyDevouredMagnetPenalty(boss, d.x, d.y);
        else this.recordBossAbsorb(boss, d.x, d.y, tr('boss.absorb'), '#7dffc1');
      }
    }
  },

  pullGemsToBoss(boss, dt) {
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (g.bossProtectedT > 0 || g.focusShelved) continue;
      if (dist2(g.x, g.y, boss.x, boss.y) > 520 * 520) continue;
      this.pullPickupToBoss(g, boss, dt, 210, 'gem');
      if (dist2(g.x, g.y, boss.x, boss.y) < Math.max(30, boss.r * 0.5) ** 2) {
        LootOutcomes.removeAt(this.gems, i);
        const heal = boss.maxHp * (this.devourConfig().gemHealPerXpMaxHp || 0.00008) * Math.max(1, Number(g.v) || 1);
        this.healBossFromDevour(boss, heal, g.x, g.y);
      }
    }
  },

  pullPickupToBoss(item, boss, dt, speed, type) {
    const dx = boss.x - item.x, dy = boss.y - item.y;
    const d = Math.hypot(dx, dy) || 1;
    item.x += dx / d * speed * dt;
    item.y += dy / d * speed * dt;
    item.bossPull = true;
    item.bossPullT = 0.35;
    item.bossPullFxT = (item.bossPullFxT || 0) - dt;
    if (item.bossPullFxT <= 0) {
      item.bossPullFxT = 0.22;
      this.spawnBossLink(item.x, item.y, boss.x, boss.y, type === 'gem' ? '#3dff8e' : BossInteractions.color('devour'), 0.28, '');
    }
  },

  absorbedBombDamage(stack) {
    return Math.round(250 * Math.pow(1.3, Math.max(0, stack - 1)));
  },
  backfireAbsorbedBomb(boss, stack, x, y) {
    const cfg = this.devourConfig();
    const healed = Math.max(0, boss.devourHealThisCast || 0);
    const cycleCap = boss.maxHp * (cfg.bombBackfireCycleCapMaxHp || 0.08);
    const remaining = Math.max(0, cycleCap - (boss.devourBombDamageThisCast || 0));
    const perBomb = healed * (cfg.bombBackfireHealRatio || 0.1) * Math.max(1, stack);
    const damage = Math.round(Math.min(remaining, perBomb));
    if (damage <= 0) {
      this.recordBossAbsorb(boss, x, y, tr('boss.bombBackfireEmpty'), '#ff9f4d');
      return;
    }
    boss.devourBombDamageThisCast = (boss.devourBombDamageThisCast || 0) + damage;
    this.recordBossAbsorb(boss, x, y, tr('boss.bombBackfire', { value: damage }), '#ff4d5e');
    if (typeof this.damageEnemy === 'function') this.damageEnemy(boss, damage, 0, 0, 'drop:bomb:boss-absorb');
    else boss.hp = Math.max(0, boss.hp - damage);
    if (this.boss === boss && boss.hp > 0) GameRuntime.updateBossBar(boss);
  },

  healBossFromDevour(boss, rawAmount, x, y) {
    const cfg = this.devourConfig();
    const maxHp = Math.max(1, boss.maxHp || 1);
    const castCap = maxHp * (boss.bossKind === 'mega' ? (cfg.megaHealCapMaxHp || 0.08) : (cfg.normalHealCapMaxHp || 0.05));
    boss.devourHealWindow = Array.isArray(boss.devourHealWindow) ? boss.devourHealWindow.filter(item => this.time - item.t < 60) : [];
    const minuteCap = maxHp * (boss.bossKind === 'mega' ? (cfg.megaHealPerMinuteCapMaxHp || 0.24) : (cfg.normalHealPerMinuteCapMaxHp || 0.15));
    const minuteUsed = boss.devourHealWindow.reduce((sum, item) => sum + Math.max(0, item.v || 0), 0);
    const castRemaining = Math.max(0, castCap - (boss.devourHealThisCast || 0));
    const minuteRemaining = Math.max(0, minuteCap - minuteUsed);
    const lowHpScale = boss.hp <= maxHp * (cfg.lowHpThreshold || 0.15) ? (cfg.lowHpHealScale || 0.5) : 1;
    const amount = Math.round(Math.max(0, Math.min(rawAmount * lowHpScale, castRemaining, minuteRemaining, maxHp - boss.hp)));
    this.recordBossAbsorb(boss, x, y, amount > 0 ? tr('boss.heal', { value: amount }) : tr('boss.absorb'), '#7dffc1');
    if (amount <= 0) return 0;
    boss.hp = Math.min(maxHp, boss.hp + amount);
    boss.devourHealThisCast = (boss.devourHealThisCast || 0) + amount;
    boss.devourHealWindow.push({ t: this.time || 0, v: amount });
    if (this.boss === boss) GameRuntime.updateBossBar(boss);
    return amount;
  },

  applyDevouredMagnetPenalty(boss, x, y) {
    const cfg = this.devourConfig();
    const p = this.player;
    const debtCfg = CFG.xpDebt || {};
    const lossRatio = debtCfg.magnetLossRatio == null ? (cfg.magnetXpProgressLoss == null ? 0.25 : cfg.magnetXpProgressLoss) : debtCfg.magnetLossRatio;
    const debtCapRatio = debtCfg.capRatio == null ? (cfg.magnetXpDebtCapRatio == null ? 0.5 : cfg.magnetXpDebtCapRatio) : debtCfg.capRatio;
    const castCapRatio = debtCfg.perDevourCastCapRatio == null ? debtCapRatio : debtCfg.perDevourCastCapRatio;
    const loss = Math.max(1, Math.round((p.xpNeed || 1) * lossRatio));
    const actual = Math.min(p.xp || 0, loss);
    p.xp = Math.max(0, (p.xp || 0) - actual);
    const debt = loss - actual;
    const debtCap = Math.max(0, Math.round((p.xpNeed || 1) * debtCapRatio));
    if (boss._devourCastSeq !== this.devourCastSeq) {
      boss._devourCastSeq = this.devourCastSeq;
      boss._magnetDebtThisCast = 0;
    }
    const castCap = Math.max(0, Math.round((p.xpNeed || 1) * castCapRatio));
    const castRemaining = Math.max(0, castCap - (boss._magnetDebtThisCast || 0));
    const debtAdded = debt > 0 ? Math.min(debt, Math.max(0, debtCap - (p.xpDebt || 0)), castRemaining) : 0;
    if (debtAdded > 0) p.xpDebt = (p.xpDebt || 0) + debtAdded;
    boss._magnetDebtThisCast = (boss._magnetDebtThisCast || 0) + debtAdded;
    if (this.metrics) this.metrics.xpDebtAdded = (this.metrics.xpDebtAdded || 0) + debtAdded;
    const applied = actual + debtAdded;
    const label = applied > 0
      ? tr('boss.magnetXpLoss', { value: Math.round(applied), debt: Math.ceil(p.xpDebt || 0) })
      : tr('boss.magnetXpDebtCapped', { debt: Math.ceil(p.xpDebt || 0) });
    this.recordBossAbsorb(boss, x, y, label, '#41f0ff');
    if (debtAdded > 0 && !this._seenXpDebtTip) {
      this._seenXpDebtTip = true;
      if (GameRuntime.banner) GameRuntime.banner(tr('boss.magnetXpDebtTip'), 'warn');
    }
    if (debtAdded > 0 && (this.time - (this.lastMagnetPenaltyT || -999)) >= (cfg.magnetPenaltyCooldown || 30)) {
      this.lastMagnetPenaltyT = this.time || 0;
      this.sealRecentWeapon(cfg.magnetWeaponSealT || 25, 'magnet');
    }
  },
  recordBossAbsorb(boss, x, y, text, color = '#7dffc1') {
    boss.absorbCount = (boss.absorbCount || 0) + 1;
    this.spawnText(x, y - 16, text, false, color);
    this.spawnBossLink(x, y, boss.x, boss.y, color, 0.32, '');
  },

});
