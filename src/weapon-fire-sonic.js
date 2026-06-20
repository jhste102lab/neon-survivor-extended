'use strict';
// Fires the sonic weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('sonic', function fireSonicWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const pulses = s.pulses + (evolved ? 1 : 0);
    for (let i = 0; i < pulses; i++) {
      this.novas.push({
        x: p.x, y: p.y, r: 10, maxR: s.radius * (i ? 0.72 : 1) * (evolved ? 1.08 : 1), dmg: s.dmg * st.dmg * (evolved && i ? 0.72 : evolved ? 1.12 : 1), kb: s.kb * (evolved ? 1.18 : 1),
        id: ++this.novaSeq, delay: i * (evolved ? 0.14 : 0.18), source: evolved ? 'weapon:sonic:evolved' : 'weapon:sonic', color: evolved ? '#d9fbff' : '#9ff3ff', speed: 920,
        vulnerableK: evolved ? 0.05 : 0, vulnerableBossK: 0.02, vulnerableT: 0.55,
      });
    }
    GameRuntime.playSound('boom');
    this.shake(2, 0.12);
  });
}());
