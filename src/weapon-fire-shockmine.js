'use strict';
// Fires the shockmine weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('shockmine', function fireShockmineWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const back = Math.atan2(-(p.moveY || 0), -(p.moveX || 0));
    const base = Number.isFinite(back) && Math.hypot(p.moveX || 0, p.moveY || 0) > 0.2 ? back : rand(0, TAU);
    const count = s.count + (evolved ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * (evolved ? 0.72 : 0.55) + rand(-0.12, 0.12);
      const d = 22 + i * 18;
      this.pushPlayerBullet({
        kind: 'mine', source: evolved ? 'weapon:shockmine:evolved' : 'weapon:shockmine',
        x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d,
        vx: 0, vy: 0, r: 9, dmg: s.dmg * st.dmg, blast: s.blast, trigger: 42,
        life: s.life * (evolved ? 1.12 : 1), arm: s.arm, color: evolved ? '#eaffff' : '#41f0ff',
      });
    }
    GameRuntime.playSound('shoot');
  });
}());
