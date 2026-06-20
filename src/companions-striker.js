'use strict';
// Companion striker damage, cooldown, and auto-fire behavior.
Object.assign(Game, {
  companionDamage(st, c) {
    const strikerRank = c.roleRanks && c.roleRanks.striker ? c.roleRanks.striker : 0;
    return (11 + c.count * 0.6 + strikerRank * 1.8) * st.dmg;
  },

  companionCooldown(c) {
    return Math.max(0.68, 1.18 - c.count * 0.025);
  },

  updateCompanionStriker(dt, st, c) {
    if (!c.roles.includes('striker')) return;
    c.fireT -= dt;
    if (c.fireT > 0) return;
    const node = this.companionNode('striker') || c.nodes[0];
    const strikerRank = c.roleRanks && c.roleRanks.striker ? c.roleRanks.striker : 1;
    const targetN = Math.min(3, 1 + Math.floor(strikerRank / 2));
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(node.x, node.y, targetN, 900, 240) : this.nearestEnemies(node.x, node.y, targetN, 900);
    if (!targets.length) { c.fireT = 0.2; return; }
    const dmg = this.companionDamage(st, c);
    for (let i = 0; i < Math.min(targetN, targets.length); i++) {
      const t = targets[i];
      const a = Math.atan2(t.y - node.y, t.x - node.x) + rand(-0.05, 0.05);
      this.pushPlayerBullet({
        kind: 'companion', source: 'companion:striker',
        x: node.x, y: node.y, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620,
        r: 5.2, dmg, pierce: 0, life: 1.15, color: COMPANION_ROLES.striker.color,
      });
    }
    c.fireT = this.companionCooldown(c);
  },
});
