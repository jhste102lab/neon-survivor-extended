'use strict';
// Fires the ricochet weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('ricochet', function fireRicochetWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const t = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, 1, 900, 240)[0] : this.nearestEnemies(p.x, p.y, 1, 900)[0];
    const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : rand(0, TAU);
    const count = s.count + (evolved ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * 0.72 + rand(-0.18, 0.18);
      this.pushPlayerBullet({
        kind: 'disc', source: evolved ? 'weapon:ricochet:evolved' : 'weapon:ricochet', hitOnce: true, evolved,
        x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18,
        vx: Math.cos(a) * s.speed * (evolved ? 1.05 : 1), vy: Math.sin(a) * s.speed * (evolved ? 1.05 : 1),
        r: s.r * (evolved ? 1.08 : 1), dmg: s.dmg * st.dmg, baseDmg: s.dmg * st.dmg,
        pierce: s.pierce + (evolved ? 3 : 0), life: s.life * (evolved ? 1.12 : 1), kb: 110, color: evolved ? '#d9fbff' : '#9ff3ff',
      });
    }
    GameRuntime.playSound('missile');
  });
}());
