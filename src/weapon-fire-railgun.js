'use strict';
// Fires the railgun weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('railgun', function fireRailgunWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const t = this.strongestVisibleOrNearest ? this.strongestVisibleOrNearest(1300, 280) : (this.strongestEnemy() || this.nearestEnemies(p.x, p.y, 1, 1300)[0]);
    if (!t) return;
    const a = Math.atan2(t.y - p.y, t.x - p.x);
    const dx = Math.cos(a), dy = Math.sin(a), len = 2200;
    const width = s.width * (evolved ? 1.26 : 1);
    const pierce = s.pierce + (evolved ? 8 : 0);
    this.beams.push({ x: p.x, y: p.y, a, w: width, life: evolved ? 0.24 : 0.2, maxLife: evolved ? 0.24 : 0.2, color: '#ffffff', len, source: evolved ? 'weapon:railgun:evolved' : 'weapon:railgun' });
    const victims = [];
    const insertVictim = (e, along) => {
      if (e.hp <= 0) return;
      let at = victims.length;
      while (at > 0 && along < victims[at - 1].along) at--;
      if (at >= pierce) return;
      victims.splice(at, 0, { e, along });
      if (victims.length > pierce) victims.pop();
    };
    if (typeof Grid !== 'undefined' && Grid.forEachInBeam && Grid.map && Grid.map.size) {
      Grid.forEachInBeam(p.x, p.y, dx, dy, len, width / 2, insertVictim);
    } else {
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const ex = e.x - p.x, ey = e.y - p.y;
        const along = ex * dx + ey * dy;
        if (along < 0 || along > len) continue;
        const perp = Math.abs(ex * dy - ey * dx);
        if (perp < width / 2 + e.r) insertVictim(e, along);
      }
    }
    for (const v of victims) {
      const eliteMul = evolved ? (v.e.boss ? 1.18 : v.e.elite ? 1.25 : 1.08) : 1;
      this.damageEnemy(v.e, s.dmg * st.dmg * eliteMul, dx * 180, dy * 180, evolved ? 'weapon:railgun:evolved' : 'weapon:railgun');
      this.spawnBurst(v.e.x, v.e.y, '#ffffff', 5, 150, 4, 0.22);
    }
    GameRuntime.playSound('laser');
    this.shake(3.4, 0.16);
  });
}());
