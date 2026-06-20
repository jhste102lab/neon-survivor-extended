'use strict';
// Fires the icespear weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('icespear', function fireIcespearWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const primary = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, 1, 1000, 260)[0] : this.nearestEnemies(p.x, p.y, 1, 1000)[0];
    if (!primary) return;
    const base = Math.atan2(primary.y - p.y, primary.x - p.x);
    const count = s.count + (evolved ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * (s.spread || 0.18);
      this.pushPlayerBullet({
        kind: 'ice', source: evolved ? 'weapon:icespear:evolved' : 'weapon:icespear', hitOnce: true,
        x: p.x + Math.cos(a) * 12, y: p.y + Math.sin(a) * 12,
        vx: Math.cos(a) * s.speed * (evolved ? 1.05 : 1), vy: Math.sin(a) * s.speed * (evolved ? 1.05 : 1),
        r: evolved ? 6.0 : 5.4, dmg: s.dmg * st.dmg * (evolved ? 1.08 : 1), pierce: s.pierce + (evolved ? 3 : 0),
        life: evolved ? 1.48 : 1.35, color: '#aeeaff', slow: Math.min(0.82, s.slow + (evolved ? 0.1 : 0)), slowT: evolved ? 1.0 : 0.75,
        blastOnHit: evolved ? 34 : 0, blastMul: 0.26, blastOnHitNoConsume: evolved,
      });
    }
    GameRuntime.playSound('laser');
  });
}());
