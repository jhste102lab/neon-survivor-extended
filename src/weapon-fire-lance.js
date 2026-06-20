'use strict';
// Fires the lance weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('lance', function fireLanceWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const primary = this.strongestVisibleOrNearest ? this.strongestVisibleOrNearest(1000, 260) : (this.strongestEnemy() || this.nearestEnemies(p.x, p.y, 1, 1000)[0]);
    if (!primary) return;
    const count = s.count + (evolved ? 2 : 0);
    const base = Math.atan2(primary.y - p.y, primary.x - p.x);
    for (let i = 0; i < count; i++) {
      const flank = evolved ? (s.spread || 0.16) * 0.82 : (s.spread || 0.16);
      const a = base + (i - (count - 1) / 2) * flank;
      const side = evolved && (i === 0 || i === count - 1);
      this.pushPlayerBullet({
        kind: 'lance', source: evolved ? 'weapon:lance:evolved' : 'weapon:lance',
        x: p.x + Math.cos(a) * 12, y: p.y + Math.sin(a) * 12,
        vx: Math.cos(a) * s.speed * (evolved ? 1.05 : 1), vy: Math.sin(a) * s.speed * (evolved ? 1.05 : 1),
        r: side ? 4.8 : 6.2, dmg: s.dmg * st.dmg * (side ? 0.58 : evolved ? 1.08 : 1),
        pierce: s.pierce + (evolved ? 4 : 0), life: evolved ? 1.58 : 1.45, color: evolved ? '#7dffff' : '#41f0ff', hitOnce: true,
      });
    }
    GameRuntime.playSound('laser');
    this.shake(1.6, 0.12);
  });
}());
