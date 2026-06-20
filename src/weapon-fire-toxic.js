'use strict';
// Fires the toxic weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('toxic', function fireToxicWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = s.count + (evolved ? 1 : 0);
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, count, 1000, 260) : this.nearestEnemies(p.x, p.y, count, 1000);
    if (!targets.length) return;
    for (let i = 0; i < count; i++) {
      const t = targets[i % targets.length];
      this.novas.push({
        field: true, visual: 'toxic', x: t.x + rand(-28, 28), y: t.y + rand(-28, 28), r: s.radius * (evolved ? 1.12 : 1), maxR: s.radius * (evolved ? 1.12 : 1),
        life: s.life * (evolved ? 1.16 : 1), maxLife: s.life * (evolved ? 1.16 : 1), tick: 0, tickEvery: s.tick,
        dmg: s.dmg * st.dmg * (evolved ? 1.06 : 1), slow: evolved ? 0.2 : 0.16, id: ++this.novaSeq,
        vulnerableK: evolved ? 0.08 : 0, vulnerableBossK: 0.03, vulnerableT: 0.7,
        source: evolved ? 'weapon:toxic:evolved' : 'weapon:toxic', color: '#8dff3d',
      });
    }
    GameRuntime.playSound('missile');
  });
}());
