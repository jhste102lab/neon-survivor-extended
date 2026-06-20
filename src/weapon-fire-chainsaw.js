'use strict';
// Fires the chainsaw weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('chainsaw', function fireChainsawWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, Math.max(1, s.count), 900, 240) : this.nearestEnemies(p.x, p.y, Math.max(1, s.count), 900);
    const primary = targets[0];
    if (!primary) return;
    const base = Math.atan2(primary.y - p.y, primary.x - p.x);
    const count = s.count + (evolved ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const t = targets[i % targets.length] || primary;
      const aimed = t ? Math.atan2(t.y - p.y, t.x - p.x) : base;
      const a = aimed + (i - (count - 1) / 2) * 0.22;
      this.pushPlayerBullet({
        kind: 'saw', source: evolved ? 'weapon:chainsaw:evolved' : 'weapon:chainsaw', hitOnce: true,
        x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24,
        vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
        r: s.r * (evolved ? 1.08 : 1), dmg: s.dmg * st.dmg * (evolved ? 1.06 : 1), pierce: s.pierce + (evolved ? 3 : 0),
        life: s.life * (evolved ? 1.12 : 1), kb: 90, color: '#d9f4ff',
        vulnOnHit: evolved ? 0.07 : 0, vulnBossK: 0.025, vulnT: 1.25,
      });
    }
    GameRuntime.playSound('missile');
  });
}());
