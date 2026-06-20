'use strict';
// Fires the bolt weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('bolt', function fireBoltWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = s.count + (evolved ? 2 : 0);
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, count, 900, 240) : this.nearestEnemies(p.x, p.y, count, 900);
    if (!targets.length) return;
    for (let i = 0; i < count; i++) {
      const t = targets[i % targets.length];
      const a = Math.atan2(t.y - p.y, t.x - p.x) + (i >= targets.length ? rand(-0.3, 0.3) : 0);
      this.pushPlayerBullet({
        kind: 'bolt', source: evolved ? 'weapon:bolt:evolved' : 'weapon:bolt',
        x: p.x, y: p.y, vx: Math.cos(a) * s.speed * (evolved ? 1.08 : 1), vy: Math.sin(a) * s.speed * (evolved ? 1.08 : 1),
        r: evolved ? 6.8 : 6, dmg: s.dmg * st.dmg * (evolved ? 1.08 : 1), pierce: s.pierce + (evolved ? 2 : 0), life: evolved ? 1.45 : 1.3, color: evolved ? '#62f6ff' : '#19e3ff',
      });
    }
    GameRuntime.playSound('shoot');
  });
}());
