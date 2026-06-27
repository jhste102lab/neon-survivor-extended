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

  tryAutoSettleLateGem(gem, index) {
    const cfg = CFG.lateXp || {};
    if (cfg.enabled === false || this.time < (cfg.start || CFG.winTime)) return false;
    if (!gem || gem.mag || gem.bossPull || gem.bossContested || gem.bossProtectedT > 0) return false;
    if ((gem.age || 0) < (cfg.autoSettleAge || 18)) return false;
    const xp = Math.max(1, Math.round((gem.v || 0) * (cfg.autoSettleRatio || 0.5)));
    LootOutcomes.removeAt(this.gems, index);
    this.addXp(xp);
    return true;
  },
});
