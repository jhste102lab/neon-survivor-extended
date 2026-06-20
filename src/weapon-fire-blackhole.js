'use strict';
// Fires the blackhole weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('blackhole', function fireBlackholeWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const t = this.strongestVisibleOrNearest ? this.strongestVisibleOrNearest(1100, 280) : this.nearestEnemies(p.x, p.y, 1, 1100)[0];
    if (!t) return;
    this.novas.push({
      field: true, visual: 'blackhole', x: t.x, y: t.y, r: s.radius * (evolved ? 1.08 : 1), maxR: s.radius * (evolved ? 1.08 : 1),
      life: s.life * (evolved ? 1.12 : 1), maxLife: s.life * (evolved ? 1.12 : 1), tick: 0, tickEvery: s.tick,
      dmg: s.dmg * st.dmg * (evolved ? 1.08 : 1), pull: s.pull * (evolved ? 1.12 : 1), slow: evolved ? 0.24 : 0.18,
      endBlast: evolved, endBlastRadius: s.radius * 0.76, endBlastDamage: s.dmg * st.dmg * 2.35, endBlastSource: 'weapon:blackhole:evolved:collapse',
      id: ++this.novaSeq, source: evolved ? 'weapon:blackhole:evolved' : 'weapon:blackhole', color: evolved ? '#b68cff' : '#7b5cff',
    });
    this.spawnText(t.x, t.y - s.radius - 8, 'GRAVITY', false, '#b68cff');
    GameRuntime.playSound('laser');
    this.shake(1.8, 0.16);
  });
}());
