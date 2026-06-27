'use strict';
// XP intake and level-up queue transitions.
Object.assign(Game, {
  /* ---------- XP/레벨 ---------- */

  addXp(v) {
    const p = this.player;
    if (p.xpDebt > 0 && v > 0) {
      const repay = Math.min(p.xpDebt, v);
      p.xpDebt -= repay;
      v -= repay;
      if (repay > 0 && typeof this.spawnText === 'function') this.spawnText(p.x, p.y - 56, tr('boss.xpDebtPaid', { value: Math.round(repay) }), false, '#41f0ff');
    }
    if (!(v > 0)) return;
    p.xp += v * (this.st ? this.st.xp : 1);
    let ups = 0;
    while (p.xp >= p.xpNeed) {
      p.xp -= p.xpNeed;
      p.level++;
      p.xpNeed = CFG.xpNeed(p.level);
      ups++;
    }
    if (ups > 0) {
      this.levelQueue += ups;
      if (!this.test.headless) {
        GameRuntime.playSound('levelup');
        GameRuntime.flashEffect('lvlfx', 0.8);
        this.hitStop(0.45, 0.25);
        GameRuntime.scheduleLevelUpPrompt(this, 280);
      }
    }
  },

  lateXpStarted() {
    const cfg = CFG.lateXp || {};
    return cfg.enabled !== false && this.time >= (cfg.start || CFG.winTime);
  },

  lateXpScale() {
    const cfg = CFG.lateXp || {};
    if (!this.lateXpStarted()) return 1;
    if (this.time >= CFG.winTime + 360) return cfg.scale16 || 0.65;
    if (this.time >= CFG.winTime + 180) return cfg.scale13 || 0.75;
    return cfg.scale10 || 0.85;
  },

  grantLateNormalXp(value, source = 'normal') {
    const raw = Math.max(0, Math.round(Number(value) || 0));
    if (!(raw > 0)) return 0;
    const xp = Math.max(1, Math.round(raw * this.lateXpScale()));
    if (this.metrics) {
      this.metrics.lateXpDirect = (this.metrics.lateXpDirect || 0) + xp;
      this.metrics.lateXpRaw = (this.metrics.lateXpRaw || 0) + raw;
      this.metrics.lateXpSources = this.metrics.lateXpSources || {};
      this.metrics.lateXpSources[source] = (this.metrics.lateXpSources[source] || 0) + xp;
    }
    this.addXp(xp);
    return xp;
  },

  tryAutoSettleLateGem(gem, index) {
    const cfg = CFG.lateXp || {};
    if (cfg.enabled === false || this.time < (cfg.start || CFG.winTime)) return false;
    if (!gem || gem.mag || gem.bossPull || gem.bossContested || gem.bossProtectedT > 0) return false;
    if ((gem.age || 0) < (cfg.autoSettleAge || 0.25)) return false;
    const xp = Math.max(1, Math.round((gem.v || 0) * (cfg.autoSettleRatio || 1) * this.lateXpScale()));
    LootOutcomes.removeAt(this.gems, index);
    if (this.metrics) this.metrics.lateXpAutoSettled = (this.metrics.lateXpAutoSettled || 0) + xp;
    this.addXp(xp);
    return true;
  },

  settleAllLateGems() {
    if (!this.lateXpStarted()) return 0;
    let xp = 0;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (!g || g.mag || g.bossPull || g.bossContested || g.bossProtectedT > 0 || g.focusShelved) continue;
      xp += Math.max(1, Math.round((g.v || 0) * this.lateXpScale()));
      LootOutcomes.removeAt(this.gems, i);
    }
    if (xp > 0) {
      if (this.metrics) this.metrics.lateXpAutoSettled = (this.metrics.lateXpAutoSettled || 0) + xp;
      this.addXp(xp);
      if (typeof this.spawnText === 'function') this.spawnText(this.player.x, this.player.y - 54, `+${Math.round(xp)} XP`, false, '#41f0ff');
    }
    return xp;
  },
});
