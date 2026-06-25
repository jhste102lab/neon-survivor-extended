'use strict';
// Player movement, pressure, recovery, trail, and companion runtime helpers.
Object.assign(Game, {
  updatePlayerMovement(dt, st) {
    const p = this.player;
    let mv = Input.moveVec();
    if (this.transformControlVector) mv = this.transformControlVector(mv);
    if (mv.x || mv.y) { p.moveX = mv.x; p.moveY = mv.y; }
    p.x += mv.x * st.spd * dt;
    p.y += mv.y * st.spd * dt;
    return mv;
  },

  updateIdlePressure(dt, mv) {
    if (this.time >= (CFG.idlePressureStart || 480)) {
      const moving = Math.hypot(mv.x || 0, mv.y || 0) > 0.14;
      this.idleT = moving ? Math.max(0, (this.idleT || 0) - dt * 2.2) : Math.min(10, (this.idleT || 0) + dt);
    } else {
      this.idleT = 0;
    }
  },

  updatePlayerInvulnerability(dt) {
    const p = this.player;
    p.invuln = Math.max(0, p.invuln - dt);
  },

  idleRecoverySuppression() {
    if (this.time < (CFG.idlePressureStart || 480)) return 0;
    return clamp(((this.idleT || 0) - 2.2) / 5.2, 0, 1);
  },

  updatePlayerRegen(dt, st) {
    const p = this.player;
    if (st.regen > 0) {
      const idleK = this.idleRecoverySuppression ? this.idleRecoverySuppression() : 0;
      p.hp = Math.min(st.maxHp, p.hp + st.regen * dt * (1 - idleK * 0.9));
    }
  },

  updatePlayerTrail(dt, mv) {
    const p = this.player;
    p.trailT -= dt;
    if ((mv.x || mv.y) && p.trailT <= 0) {
      p.trailT = 0.035;
      this.spawnParticle(p.x, p.y, 0, 0, 0.3, 9, '#19e3ff', 0.95);
    }
  },

  updateCompanionRuntime(dt, st) {
    if (this.updateCompanions) this.updateCompanions(dt, st);
  },
});
