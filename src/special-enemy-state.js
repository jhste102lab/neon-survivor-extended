'use strict';
// Special enemy initialization and protection-state queries.
Object.assign(Game, {
  initSpecialEnemy(e) {
    if (!e || !e.def || !e.def.special) return e;
    e.special = e.def.special;
    e.specialT = rand(1.2, 3.2);
    e.chargeState = 0;
    e.chargeT = rand(1.8, 3.0);
    e.chargeDir = 0;
    e.chargeWarn = 0;
    e.spawnT = rand(2.5, 4.5);
    e.mineT = rand(1.8, 3.5);
    e.wardT = rand(2.4, 4.2);
    e.bomberState = 0;
    e.bomberWarn = 0;
    return e;
  },

  enemyProtected(e) {
    if (!e || e.boss || e.type === 'bulwark') return false;
    for (const b of this.enemies) {
      if (b === e || b.hp <= 0 || b.type !== 'bulwark') continue;
      if (dist2(e.x, e.y, b.x, b.y) < 185 * 185) return true;
    }
    return false;
  },
});
