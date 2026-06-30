'use strict';
// Enemy slow/crowd movement modifiers, separation, contact damage, and far teleport.
Object.assign(Game, {
  applyEnemyMovementModifiers(e, dt, mvx, mvy, crowdPressure) {
    // 냉기 둔화: 후반에는 둔화 저항을 받아 접근감이 유지된다.
    if (e.slowT > 0) {
      e.slowT -= dt;
      const resist = this.enemySlowResistance ? this.enemySlowResistance(e, crowdPressure) : 0;
      const effectiveSlow = e.slowK * (e.boss ? 0.5 : 1) * (1 - resist);
      const k = 1 - effectiveSlow;
      mvx *= k; mvy *= k;
    }
    if (this.gravitySlowForEnemy) {
      const gravitySlow = this.gravitySlowForEnemy(e);
      if (gravitySlow > 0) {
        mvx *= 1 - gravitySlow;
        mvy *= 1 - gravitySlow;
      }
    }
    if (crowdPressure > 0 && !e.boss) {
      const crowdMul = 1 + crowdPressure * 0.34;
      mvx *= crowdMul; mvy *= crowdMul;
    }
    return { mvx, mvy };
  },

  enemySlowResistance(e, crowdPressure = 0) {
    const late = clamp((this.time - (CFG.idlePressureStart || 480)) / 240, 0, 1);
    const pressure = Math.max(0, crowdPressure || 0);
    if (e.boss) return Math.min(0.55, 0.24 + late * 0.22);
    if (e.elite || e.special) return Math.min(0.62, late * 0.38 + pressure * 0.22);
    return Math.min(0.58, late * 0.34 + pressure * 0.26);
  },

  moveEnemyWithKnockback(e, dt, mvx, mvy) {
    // 넉백 감쇠
    e.x += (mvx + e.kx) * dt;
    e.y += (mvy + e.ky) * dt;
    e.kx *= Math.pow(0.0015, dt); e.ky *= Math.pow(0.0015, dt);
  },

  separateEnemyCrowd(e, d2 = 0, frame = 0) {
    // 적끼리 겹침 방지: 적 수는 유지하되 플레이어 주변 외에는 분산 처리한다.
    if (e.boss) return;
    if (d2 < 430 * 430) { Grid.separate(e); return; }
    if (d2 > 1400 * 1400) return;
    const interval = d2 < 780 * 780 ? 3 : 6;
    if (e.sepPhase == null) e.sepPhase = randi(0, interval - 1);
    if (frame % interval === e.sepPhase % interval) Grid.separate(e);
  },

  applyEnemyContactDamage(e, p, dist, crowdPressure) {
    // 플레이어 접촉 피해
    if (!p.dead && dist < e.r + CFG.player.radius && p.invuln <= 0) {
      const source = e.boss ? 'boss:contact' : e.special ? `special:${e.special}:contact` : `enemy:${e.type}:contact`;
      let damage = e.dmg * (1 + crowdPressure * 0.12);
      if (e.boss && e.bossDef && e.bossDef.mega && e.dashState !== 2 && this.time >= CFG.winTime) damage *= 0.75;
      this.hurtPlayer(damage, source);
    }
  },

  teleportFarEnemy(e, p, dist) {
    // 너무 멀어진 적 텔레포트 (플레이어가 도망만 가는 것 방지)
    if (!e.boss && dist > 1700) {
      const view = GameRuntime.viewportHalf();
      const pad = typeof EnemyFactoryPlacement !== 'undefined' && EnemyFactoryPlacement.enemySpawnPad
        ? EnemyFactoryPlacement.enemySpawnPad(this)
        : 180;
      const a = rand(0, TAU), R = Math.hypot(view.w * 2, view.h * 2) / 2 + pad;
      e.x = p.x + Math.cos(a) * R; e.y = p.y + Math.sin(a) * R;
      e.age = 0;
    }
  },
});
