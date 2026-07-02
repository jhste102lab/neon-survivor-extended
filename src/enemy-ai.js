'use strict';
// Enemy update loop/orchestrator. Load the enemy-ai-* helper files before this file.
Object.assign(Game, {
  /* ---------- 적 업데이트 ---------- */

  updateEnemyTimers(e, dt) {
    e.age = (e.age || 0) + dt;
    e.flash = Math.max(0, e.flash - dt);
    e.orbitCd = Math.max(0, e.orbitCd - dt);
    e.boomCd = Math.max(0, e.boomCd - dt);
    e.vulnerableT = Math.max(0, (e.vulnerableT || 0) - dt);
  },

  enemyUpdateInterval(e, d2) {
    if (e.boss || e.elite || e.special) return 1;
    let interval = 10;
    if (d2 < 560 * 560) interval = 1;
    else if (d2 < 940 * 940) interval = 2;
    else if (d2 < 1260 * 1260) interval = 4;
    else if (d2 < 1700 * 1700) interval = 8;
    if ((this.userTimeScale || 1) < 1 && this.time >= CFG.winTime) interval = Math.max(1, Math.ceil(interval * 0.5));
    return interval;
  },

  enemyUpdateDue(e, interval, frame) {
    if (interval <= 1) return true;
    if (e.aiPhase == null) e.aiPhase = randi(0, interval - 1);
    return frame % interval === e.aiPhase % interval;
  },

  enemyStepMaxDelta(interval) {
    if (interval <= 2) return 0.16;
    if (interval <= 4) return 0.20;
    return 0.24;
  },

  enemyStepDelta(e, dt, due, interval = 1) {
    e.aiDt = Math.min(this.enemyStepMaxDelta(interval), (e.aiDt || 0) + dt);
    if (!due) return 0;
    const stepDt = e.aiDt;
    e.aiDt = 0;
    return stepDt;
  },

  resolveEnemyVelocity(e, dt, st, p, dx, dy, dist) {
    if (e.dimensionStatic) return { mvx: 0, mvy: 0 };
    if (!e.boss && e.special && this.updateSpecialEnemy) {
      const mv = this.updateSpecialEnemy(e, dt, st, dx, dy, dist);
      if (mv) return mv;
      return { mvx: dx / dist * e.spd, mvy: dy / dist * e.spd };
    }
    if (e.boss) return this.updateBossEnemy(e, dt, dx, dy, dist);
    if (e.def.ranged) return this.updateRangedEnemy(e, dt, p, dx, dy, dist);
    let mvx = dx / dist * e.spd, mvy = dy / dist * e.spd;
    if (e.type === 'swarm') {
      e.wobble += dt * 7;
      mvx += Math.cos(e.wobble) * 40; mvy += Math.sin(e.wobble) * 40;
    }
    return { mvx, mvy };
  },

  updateEnemies(dt, st) {
    const p = this.player;
    const capLimit = this.enemyLimit ? this.enemyLimit() : CFG.maxEnemies + (this.endless ? 55 : 0);
    const crowdPressure = this.enemyCrowdPressure(capLimit);
    const frame = this.frameSeq || 0;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      this.updateEnemyTimers(e, dt);
      const dx = p.x - e.x, dy = p.y - e.y;
      const d2 = dx * dx + dy * dy;
      const interval = this.enemyUpdateInterval(e, d2);
      const due = this.enemyUpdateDue(e, interval, frame);
      const dist = Math.sqrt(d2) || 1;
      let adjusted;
      if (due || e.cachedMvx == null || e.cachedMvy == null) {
        const mv = this.resolveEnemyVelocity(e, dt, st, p, dx, dy, dist);
        if (e.hp <= 0) continue;
        adjusted = this.applyEnemyMovementModifiers(e, dt, mv.mvx, mv.mvy, crowdPressure);
        e.cachedMvx = adjusted.mvx;
        e.cachedMvy = adjusted.mvy;
      } else {
        adjusted = { mvx: e.cachedMvx, mvy: e.cachedMvy };
      }
      this.moveEnemyWithKnockback(e, dt, adjusted.mvx, adjusted.mvy);
      this.separateEnemyCrowd(e, d2, frame);
      const postDx = p.x - e.x, postDy = p.y - e.y;
      const postD2 = postDx * postDx + postDy * postDy;
      const contactR = e.r + CFG.player.radius;
      if (!p.dead && p.invuln <= 0 && (!e.dimensionObjective || e.dimensionContact) && postD2 < contactR * contactR) {
        this.applyEnemyContactDamage(e, p, Math.sqrt(postD2) || 1, crowdPressure);
      }
      if (!e.boss && !e.dimensionEnemy && postD2 > 1700 * 1700) this.teleportFarEnemy(e, p, Math.sqrt(postD2) || 1);
    }
    Grid.rebuild(this.enemies);
    if (this.refreshFrameTargetCache) this.refreshFrameTargetCache();
  },
});
