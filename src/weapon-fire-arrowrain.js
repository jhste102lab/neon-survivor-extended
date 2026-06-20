'use strict';
// Fires the arrowrain weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('arrowrain', function fireArrowrainWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = s.count + (evolved ? 1 : 0);
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, count, 1200, 280) : this.nearestEnemies(p.x, p.y, count, 1200);
    if (!targets.length) return;
    for (let i = 0; i < count; i++) {
      const t = targets[i % targets.length];
      const x = t.x + rand(-34, 34);
      const y = t.y + rand(-34, 34);
      this.novas.push({
        x, y, r: 4, maxR: s.radius * (evolved ? 1.06 : 1), dmg: s.dmg * st.dmg * (evolved ? 1.05 : 1), kb: s.kb,
        id: ++this.novaSeq, delay: s.delay + i * 0.055, telegraphMax: s.delay + i * 0.055,
        source: evolved ? 'weapon:arrowrain:evolved' : 'weapon:arrowrain', color: evolved ? '#baffdf' : '#7dffc1', speed: 820, skyFall: true, telegraph: 'skyfall',
      });
      if (evolved && RNG.next() < 0.28) {
        const delay = s.delay + 0.18 + i * 0.055;
        this.novas.push({
          x: x + rand(-46, 46), y: y + rand(-46, 46), r: 4, maxR: s.radius * 0.72, dmg: s.dmg * st.dmg * 0.48, kb: s.kb * 0.6,
          id: ++this.novaSeq, delay, telegraphMax: delay,
          source: 'weapon:arrowrain:evolved:star', color: '#eaffff', speed: 860, skyFall: true, telegraph: 'skyfall',
        });
      }
    }
    GameRuntime.playSound('shoot');
  });
}());
