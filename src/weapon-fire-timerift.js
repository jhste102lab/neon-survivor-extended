'use strict';
// Fires the timerift weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('timerift', function fireTimeriftWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    this.novas.push({
      field: true, visual: 'timerift', x: p.x, y: p.y, r: s.radius * (evolved ? 1.08 : 1), maxR: s.radius * (evolved ? 1.08 : 1),
      life: s.life * (evolved ? 1.2 : 1), maxLife: s.life * (evolved ? 1.2 : 1), tick: 0, tickEvery: s.tick,
      dmg: s.dmg * st.dmg * (evolved ? 1.04 : 1), slow: Math.min(0.78, s.slow + (evolved ? 0.08 : 0)), id: ++this.novaSeq,
      vulnerableK: evolved ? 0.1 : 0, vulnerableBossK: 0.035, vulnerableT: 0.75,
      source: evolved ? 'weapon:timerift:evolved' : 'weapon:timerift', color: '#b68cff',
    });
    GameRuntime.playSound('laser');
  });
}());
