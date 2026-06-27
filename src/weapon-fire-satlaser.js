'use strict';
// Fires the satlaser weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  function satScore(e) {
    return e.hp + (e.boss ? 100000 : 0) + (e.elite ? 1000 : 0);
  }

  function insertTarget(list, enemy, limit) {
    const score = satScore(enemy);
    let at = list.length;
    while (at > 0 && score > list[at - 1].score) at--;
    if (at >= limit) return;
    list.splice(at, 0, { enemy, score });
    if (list.length > limit) list.pop();
  }

  registerWeaponFireHandler('satlaser', function fireSatlaserWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = s.count + (evolved ? 1 : 0);
    const candidates = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, 90, 1350, 280) : this.nearestEnemies(p.x, p.y, 90, 1350);
    const ranked = [];
    for (const e of candidates) if (e.hp > 0) insertTarget(ranked, e, count);
    const targets = ranked.map(x => x.enemy);
    if (!targets.length) return;
    for (const t of targets) {
      const ox = t.x, oy = t.y - 560, len = 760;
      const life = s.life * (evolved ? 0.74 : 1);
      const width = s.width * (evolved ? 1.08 : 1);
      this.beams.push({ x: ox, y: oy, a: Math.PI / 2, w: width, life, maxLife: life, color: '#c39bff', len, source: evolved ? 'weapon:satlaser:evolved' : 'weapon:satlaser' });
      Grid.forEachInRect(ox - width * 0.7 - 40, oy, ox + width * 0.7 + 40, oy + len, e => {
        if (e.hp <= 0) return;
        const along = e.y - oy;
        if (along < 0 || along > len) return;
        if (Math.abs(e.x - ox) < width / 2 + e.r) {
          this.damageEnemy(e, s.dmg * st.dmg * (evolved ? 1.08 : 1), 0, 120 * e.def.knock, evolved ? 'weapon:satlaser:evolved' : 'weapon:satlaser');
          this.spawnBurst(e.x, e.y, '#c39bff', 4, 120, 4, 0.22);
        }
      });
      this.spawnText(t.x, t.y - t.r - 22, 'SAT LOCK', false, '#c39bff');
    }
    GameRuntime.playSound('laser');
    this.shake(2.2, 0.12);
  });
}());
