'use strict';
// Ranged enemy spacing and aimed shooting.
Object.assign(Game, {
  updateRangedEnemy(e, dt, p, dx, dy, dist) {
    let mvx = 0, mvy = 0;

    // 사격형: 거리 유지
    if (dist > 300) { mvx = dx / dist * e.spd; mvy = dy / dist * e.spd; }
    else if (dist < 220) { mvx = -dx / dist * e.spd * 0.7; mvy = -dy / dist * e.spd * 0.7; }
    else { e.wobble += dt; mvx = Math.cos(e.wobble) * e.spd * 0.3; mvy = Math.sin(e.wobble) * e.spd * 0.3; }

    e.shootT -= dt;
    if (e.shootT <= 0 && dist < 560 && !p.dead) {
      e.shootT = rand(2.2, 3);
      const a = Math.atan2(dy, dx);
      this.spawnEnemyBullet(e.x, e.y, Math.cos(a) * 170, Math.sin(a) * 170, { r: 7, dmg: e.dmg, life: 4.5, kind: 'aimed' });
      GameRuntime.playSound('shoot');
    }

    return { mvx, mvy };
  },
});
