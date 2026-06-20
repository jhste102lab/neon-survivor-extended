'use strict';
// Fires the lightning weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  function chainTarget(game, prev, range, hitSet) {
    let best = null, bd = range * range;
    Grid.forEachInCircle(prev.x, prev.y, range, e => {
      if (hitSet.has(e) || e.hp <= 0) return;
      const dx = prev.x - e.x, dy = prev.y - e.y;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  registerWeaponFireHandler('lightning', function fireLightningWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const cand = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, 72, s.range, 260) : this.nearestEnemies(p.x, p.y, 72, s.range);
    if (!cand.length) return;
    const strikes = s.strikes + (evolved ? 1 : 0);
    for (let k = 0; k < strikes; k++) {
      let t = evolved && k === 0 && this.strongestVisibleOrNearest ? this.strongestVisibleOrNearest(s.range, 260) : pick(cand);
      if (!t || dist2(p.x, p.y, t.x, t.y) > s.range * s.range) t = pick(cand);
      const hitSet = new Set();
      let prev = null;
      const chainLimit = s.chain + (evolved ? 2 : 0);
      const chainRange = s.chainRange + (evolved ? 35 : 0);
      for (let c = 0; c <= chainLimit && t; c++) {
        hitSet.add(t);
        this.bolts.push({ x1: prev ? prev.x : t.x, y1: prev ? prev.y : t.y - 560, x2: t.x, y2: t.y, life: evolved ? 0.28 : 0.22, color: evolved ? '#ffe37d' : '#ffd23d' });
        this.spawnBurst(t.x, t.y, evolved ? '#ffe37d' : '#ffd23d', evolved ? 8 : 6, 130, 5, 0.3);
        this.damageEnemy(t, s.dmg * st.dmg * (evolved ? 1.1 : 1), 0, 0, evolved ? 'weapon:lightning:evolved' : 'weapon:lightning');
        if (evolved) this.applyEvolutionSideEffect('lightning', t);
        prev = t;
        t = chainTarget(this, prev, chainRange, hitSet);
      }
    }
    GameRuntime.playSound('lightning');
  });
}());
