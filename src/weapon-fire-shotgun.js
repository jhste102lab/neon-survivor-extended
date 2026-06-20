'use strict';
// Fires the shotgun weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('shotgun', function fireShotgunWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const playerDirAngle = context.playerDirAngle;
    const t = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, 1, 760, 220)[0] : this.nearestEnemies(p.x, p.y, 1, 760)[0];
    const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : playerDirAngle();
    const moving = Math.hypot(p.moveX || 0, p.moveY || 0) > 0.22;
    const count = s.count + (evolved ? 2 : 0);
    const spread = s.spread * (evolved && moving ? 0.68 : evolved ? 0.82 : 1);
    const close = t && dist2(p.x, p.y, t.x, t.y) < 280 * 280;
    for (let i = 0; i < count; i++) {
      const fan = count <= 1 ? 0 : (i - (count - 1) / 2) / (count - 1) * spread;
      const a = base + fan + rand(-0.045, 0.045);
      this.pushPlayerBullet({
        kind: 'shotgun', source: evolved ? 'weapon:shotgun:evolved' : 'weapon:shotgun',
        x: p.x + Math.cos(a) * 15, y: p.y + Math.sin(a) * 15,
        vx: Math.cos(a) * s.speed * (evolved ? 1.06 : 1), vy: Math.sin(a) * s.speed * (evolved ? 1.06 : 1),
        r: evolved ? 4.9 : 4.4, dmg: s.dmg * st.dmg * (evolved && close ? 1.24 : evolved ? 1.08 : 1),
        pierce: s.pierce + (evolved ? 1 : 0), life: evolved ? 0.86 : 0.78, kb: s.kb * (evolved ? 1.32 : 1), color: evolved ? '#ffb13d' : '#ff9d3d',
      });
    }
    GameRuntime.playSound('shoot');
  });
}());
