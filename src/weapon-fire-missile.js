'use strict';
// Fires the missile weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('missile', function fireMissileWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = s.count + (evolved ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      this.pushPlayerBullet({
        kind: 'missile', source: evolved ? 'weapon:missile:evolved' : 'weapon:missile',
        x: p.x, y: p.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140,
        r: evolved ? 7.6 : 7, dmg: s.dmg * st.dmg * (evolved ? 1.04 : 1), blast: s.blast * (evolved ? 1.06 : 1), life: 4.5, speed: s.speed,
        target: this.randomVisibleOrNearestEnemy ? this.randomVisibleOrNearestEnemy(1200, 260) : this.randomEnemy(), turn: evolved ? 5.2 : 4.5, color: evolved ? '#ff7ae8' : '#ff2bd6', t: i * 0.1,
      });
    }
    GameRuntime.playSound('missile');
  });
}());
