'use strict';
// Fires the boomerang weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('boomerang', function fireBoomerangWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const t = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, 1, 900, 240)[0] : this.nearestEnemies(p.x, p.y, 1, 900)[0];
    const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : rand(0, TAU);
    const count = s.count + (evolved ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * (evolved ? 0.38 : 0.45);
      this.pushPlayerBullet({
        kind: 'boom', source: evolved ? 'weapon:boomerang:evolved' : 'weapon:boomerang', evolved,
        x: p.x, y: p.y, dx: Math.cos(a), dy: Math.sin(a),
        speed: s.speed * (evolved ? 1.06 : 1), dist: 0, maxDist: s.dist * (evolved ? 1.08 : 1), phase: 0,
        r: evolved ? 19 : 17, dmg: s.dmg * st.dmg * (evolved ? 1.08 : 1), life: 7,
      });
    }
    GameRuntime.playSound('missile');
  });
}());
