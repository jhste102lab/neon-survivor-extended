'use strict';
// Fires the orbital weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('orbital', function fireOrbitalWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = s.count + (evolved ? 1 : 0);
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, count, 1100, 280) : this.nearestEnemies(p.x, p.y, count, 1100);
    if (!targets.length) return;
    for (let i = 0; i < count; i++) {
      const t = targets[i % targets.length];
      if (!t) continue;
      const jitter = Math.min(42, s.radius * 0.42);
      const x = t.x + rand(-jitter, jitter);
      const y = t.y + rand(-jitter, jitter);
      const impactDelay = (s.delay || 0.25) + i * 0.16;
      this.novas.push({
        x, y, r: 5, maxR: s.radius * (evolved ? 1.08 : 1), dmg: s.dmg * st.dmg * (evolved ? 1.06 : 1), kb: s.kb,
        id: ++this.novaSeq, delay: impactDelay, telegraphMax: impactDelay,
        source: evolved ? 'weapon:orbital:evolved' : 'weapon:orbital', color: evolved ? '#ff8a3d' : '#ff6b3d', speed: 720, missile: true, telegraph: 'orbital',
        afterField: evolved ? { visual: 'blackhole', radius: s.radius * 0.78, life: 0.82, tick: 0.32, dmg: s.dmg * st.dmg * 0.12, pull: 145, slow: 0.18, source: 'weapon:orbital:evolved:gravity', color: '#ff8a3d' } : null,
      });
      this.spawnText(x, y - s.radius - 16, tr('combat.orbitalStrike'), false, '#ffb13d');
      this.spawnBurst(x, y, '#ffb13d', 5, 80, 4, 0.3);
    }
    GameRuntime.playSound('missile');
    this.shake(2, 0.16);
  });
}());
