'use strict';
// Fires the drone weapon.
(function () {
  const registerWeaponFireHandler = globalThis.NeonSurvivorRegistry && globalThis.NeonSurvivorRegistry.registerWeaponFireHandler;
  if (typeof registerWeaponFireHandler !== 'function') throw new Error('NeonSurvivorRegistry missing before weapon fire handlers');

  registerWeaponFireHandler('drone', function fireDroneWeapon(w, s, st, context) {
    const p = context.player;
    const evolved = context.evolved;
    const count = WeaponDroneGeometry.count(s) + (evolved ? 1 : 0);
    const targets = this.visibleOrNearestEnemies ? this.visibleOrNearestEnemies(p.x, p.y, count, 940, 240) : this.nearestEnemies(p.x, p.y, count, 940);
    if (!targets.length) return;
    for (let i = 0; i < count; i++) {
      const mount = WeaponDroneGeometry.mount(p, this.time, count, i);
      const t = targets[i % targets.length];
      const a = Math.atan2(t.y - mount.y, t.x - mount.x);
      const burst = evolved ? 2 : 1;
      for (let k = 0; k < burst; k++) {
        const aa = a + (k - (burst - 1) / 2) * 0.055;
        this.pushPlayerBullet({
          kind: 'drone', source: evolved ? 'weapon:drone:evolved' : 'weapon:drone',
          x: mount.x, y: mount.y, vx: Math.cos(aa) * s.speed * (evolved ? 1.06 : 1), vy: Math.sin(aa) * s.speed * (evolved ? 1.06 : 1),
          r: evolved ? 4.0 : 4.2, dmg: s.dmg * st.dmg * (evolved ? 0.72 : 1), pierce: s.pierce, life: 1.15, color: '#d7b36a',
          shell: true, tracer: evolved ? '#baffdf' : '#7dffc1',
        });
      }
      const shellA = mount.angle + Math.PI / 2 + rand(-0.45, 0.45);
      this.spawnParticle(mount.x, mount.y, Math.cos(shellA) * rand(70, 130), Math.sin(shellA) * rand(70, 130), 0.34, 3.2, '#d7b36a', 0.86);
    }
    GameRuntime.playSound('shoot');
  });
}());
