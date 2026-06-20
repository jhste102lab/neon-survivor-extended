'use strict';
// Fires the nova weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('nova', function fireNovaWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const pulses = s.pulses + (evolved ? 1 : 0);
    for (let i = 0; i < pulses; i++) {
      this.novas.push({
        x: p.x, y: p.y, r: 10, maxR: s.radius * (evolved ? 1.1 : 1),
        dmg: s.dmg * st.dmg * (evolved ? 1.08 : 1), kb: s.kb * (evolved ? 1.1 : 1),
        id: ++this.novaSeq, delay: i * (evolved ? 0.22 : 0.28), source: evolved ? 'weapon:nova:evolved' : 'weapon:nova',
        color: evolved ? '#ff9f4d' : '#ff7a2b',
      });
    }
    if (evolved) {
      const idleK = this.idleRecoverySuppression ? this.idleRecoverySuppression() : 0;
      const barrierGain = 8 * (1 - idleK * 0.84);
      if (barrierGain > 0.5) p.barrier = Math.min(54 * (1 - idleK * 0.45), (p.barrier || 0) + barrierGain);
    }
    GameRuntime.playSound('missile');
    this.shake(3, 0.2);
  });
}());
