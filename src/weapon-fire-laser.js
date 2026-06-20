'use strict';
// Fires the laser weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');


  function fireLaserBeam(game, p, s, st, evolved, ang) {
    const width = s.width * (evolved ? 1.35 : 1);
    const len = 1900;
    game.beams.push({ x: p.x, y: p.y, a: ang, w: width, life: evolved ? 0.48 : 0.32, maxLife: evolved ? 0.48 : 0.32, color: evolved ? '#c39bff' : '#a36bff', len });
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const hit = e => {
      if (e.hp <= 0) return;
      game.damageEnemy(e, s.dmg * st.dmg * (evolved ? 1.18 : 1), dx * 120, dy * 120, evolved ? 'weapon:laser:evolved' : 'weapon:laser');
      game.spawnBurst(e.x, e.y, evolved ? '#c39bff' : '#a36bff', evolved ? 5 : 4, 110, 4, 0.25);
    };
    if (typeof Grid !== 'undefined' && Grid.forEachInBeam && Grid.map && Grid.map.size) {
      Grid.forEachInBeam(p.x, p.y, dx, dy, len, width / 2, hit);
      return;
    }
    for (const e of game.enemies) {
      const ex = e.x - p.x, ey = e.y - p.y;
      const along = ex * dx + ey * dy;
      if (along < 0 || along > len) continue;
      const perp = Math.abs(ex * dy - ey * dx);
      if (perp < width / 2 + e.r) hit(e);
    }
  }

  registerWeaponFireHandler('laser', function fireLaserWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const t = this.strongestVisibleOrNearest ? this.strongestVisibleOrNearest(1300, 280) : this.strongestEnemy();
    if (!t) return;
    const ang = Math.atan2(t.y - p.y, t.x - p.x);
    fireLaserBeam(this, p, s, st, evolved, ang);
    if (s.dual || evolved) fireLaserBeam(this, p, s, st, evolved, ang + Math.PI);
    GameRuntime.playSound('laser');
    this.shake(2.5, 0.15);
  });
}());
