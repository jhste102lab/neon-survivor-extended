'use strict';
// Fires the phoenix weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('phoenix', function firePhoenixWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const hpFrac = st.maxHp > 0 ? clamp(p.hp / st.maxHp, 0, 1) : 1;
    const overheat = evolved ? lerp(1.36, 1.06, hpFrac) : 1;
    const count = s.count + (evolved && hpFrac <= 0.5 ? 2 : evolved ? 1 : 0);
    const base = this.time * 2.4;
    for (let i = 0; i < count; i++) {
      const a = base + i / count * TAU;
      this.pushPlayerBullet({
        kind: 'feather', source: evolved ? 'weapon:phoenix:evolved' : 'weapon:phoenix',
        x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14,
        vx: Math.cos(a) * s.speed * (evolved ? 1.08 : 1), vy: Math.sin(a) * s.speed * (evolved ? 1.08 : 1),
        r: evolved ? 6.2 : 5.8, dmg: s.dmg * st.dmg * overheat, pierce: s.pierce + (evolved && hpFrac <= 0.5 ? 2 : evolved ? 1 : 0),
        life: s.life * (evolved ? 1.1 : 1), kb: 80, color: evolved ? '#ffb13d' : '#ff7a2b',
      });
    }
    GameRuntime.playSound('shoot');
  });
}());
