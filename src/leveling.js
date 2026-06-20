'use strict';
// XP intake and level-up queue transitions.
Object.assign(Game, {
  /* ---------- XP/레벨 ---------- */

  addXp(v) {
    const p = this.player;
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
});
