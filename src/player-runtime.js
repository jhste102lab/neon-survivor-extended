'use strict';
// Player movement, pressure, recovery, trail, and companion runtime helpers.
Object.assign(Game, {
  focusModeActive() {
    return !!this.focusMode && this.state === 'play' && this.player && !this.player.dead;
  },

  hasScoutPickupRecall() {
    const c = this.player && this.player.companions;
    if (!c) return false;
    return (c.roles || []).includes('scout') || (c.echoes || []).includes('scout');
  },

  focusedPickupCount() {
    let count = 0;
    for (const g of this.gems || []) if (g && g.focusShelved) count++;
    for (const d of this.drops || []) if (d && d.focusShelved) count += Math.max(1, Number(d.stack || 1));
    return count;
  },

  dashMaxChargesAtTime(time = this.time) {
    const cfg = CFG.dash || {};
    const base = cfg.maxCharges || 2;
    const start = cfg.growthStart || 480;
    const every = Math.max(1, cfg.growthEvery || 120);
    if (time < start) return base;
    return base + 1 + Math.floor((time - start) / every);
  },

  dashDirectionFromInput() {
    let mv = Input.moveVec();
    if (this.transformControlVector) mv = this.transformControlVector(mv);
    let mag = Math.hypot(mv.x || 0, mv.y || 0);
    if (mag > 0.08) return { x: mv.x / mag, y: mv.y / mag };
    const p = this.player;
    mag = Math.hypot(p.moveX || 0, p.moveY || 0);
    if (mag > 0.08) return { x: (p.moveX || 0) / mag, y: (p.moveY || 0) / mag };
    return null;
  },

  tryStartDash() {
    const p = this.player;
    const cfg = CFG.dash || {};
    if (!p || this.state !== 'play' || p.dead) return false;
    if ((p.dashActiveT || 0) > 0 || (p.dashCharges || 0) <= 0) return false;
    const dir = this.dashDirectionFromInput();
    if (!dir) return false;
    p.dashCharges = Math.max(0, (p.dashCharges || 0) - 1);
    if (p.dashCharges < (cfg.maxCharges || 2) && !(p.dashRechargeT > 0)) p.dashRechargeT = cfg.recharge || 4.8;
    p.dashActiveT = cfg.duration || 0.14;
    p.dashDirX = dir.x;
    p.dashDirY = dir.y;
    p.dashTrailT = 0;
    p.moveX = dir.x;
    p.moveY = dir.y;
    p.invuln = Math.max(p.invuln || 0, cfg.invuln || 0.2);
    if (this.spawnBurst) this.spawnBurst(p.x, p.y, '#9ff3ff', 10, 150, 5, 0.22);
    return true;
  },

  updatePlayerDashState(dt) {
    const p = this.player;
    const cfg = CFG.dash || {};
    const maxCharges = this.dashMaxChargesAtTime(this.time);
    const seen = Math.max(cfg.maxCharges || 2, Number(p.dashMaxSeen || (cfg.maxCharges || 2)));
    if (maxCharges > seen) {
      p.dashCharges = Math.min(maxCharges, (p.dashCharges || 0) + (maxCharges - seen));
      p.dashMaxSeen = maxCharges;
    } else {
      p.dashMaxSeen = seen;
    }
    if ((p.dashActiveT || 0) > 0) p.dashActiveT = Math.max(0, p.dashActiveT - dt);
    if ((p.dashCharges || 0) >= maxCharges) {
      p.dashCharges = maxCharges;
      p.dashRechargeT = 0;
      return;
    }
    p.dashRechargeT = Math.max(0, (p.dashRechargeT || cfg.recharge || 4.8) - dt);
    if (p.dashRechargeT > 0) return;
    p.dashCharges = Math.min(maxCharges, (p.dashCharges || 0) + 1);
    p.dashRechargeT = p.dashCharges >= maxCharges ? 0 : (cfg.recharge || 4.8);
  },

  applyPlayerDashMovement(dt) {
    const p = this.player;
    if (!(p.dashActiveT > 0)) return false;
    const cfg = CFG.dash || {};
    const dur = Math.max(0.001, cfg.duration || 0.14);
    const dashK = clamp(p.dashActiveT / dur, 0, 1);
    const speed = (cfg.speed || 760) * (0.76 + dashK * 0.24);
    p.x += (p.dashDirX || 0) * speed * dt;
    p.y += (p.dashDirY || 0) * speed * dt;
    p.dashTrailT = Math.max(0, (p.dashTrailT || 0) - dt);
    if (p.dashTrailT <= 0) {
      p.dashTrailT = cfg.trailEvery || 0.02;
      this.spawnParticle(p.x, p.y, 0, 0, 0.22, 8, '#9ff3ff', 0.9);
    }
    return true;
  },

  updateFocusPickup(item, dt, kind = 'gem') {
    if (!item) return false;
    if (!this.focusModeActive() || item.bossPull) {
      item.focusShelved = false;
      return false;
    }
    const p = this.player;
    const cfg = CFG.focusMode || {};
    const dx = item.x - p.x;
    const dy = item.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const radius = cfg.pullRadius || 360;
    if (d > radius) {
      item.focusShelved = false;
      return false;
    }
    const dirX = dx / d;
    const dirY = dy / d;
    const hold = kind === 'drop' ? (cfg.holdRadiusDrop || 78) : (cfg.holdRadiusGem || 66);
    const pullSpeed = cfg.pullSpeed || 560;
    const bob = Math.sin((this.time || 0) * 2.8 + (item.bob || 0)) * (kind === 'drop' ? 4 : 3);
    const tx = p.x + dirX * (hold + bob);
    const ty = p.y + dirY * (hold + bob);
    const mdx = tx - item.x;
    const mdy = ty - item.y;
    const md = Math.hypot(mdx, mdy) || 1;
    const step = Math.min(md, pullSpeed * dt);
    item.x += mdx / md * step;
    item.y += mdy / md * step;
    item.focusShelved = true;
    return true;
  },

  consumeFocusPickups() {
    if (!this.focusModeActive() || !this.hasScoutPickupRecall()) return false;
    const p = this.player;
    let xp = 0, gemsCollected = 0, dropsCollected = 0;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (!g.focusShelved) continue;
      xp += g.v || 0;
      gemsCollected++;
      LootOutcomes.removeAt(this.gems, i);
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (!d.focusShelved) continue;
      dropsCollected += Math.max(1, Number(d.stack || 1));
      LootOutcomes.removeAt(this.drops, i);
      LootOutcomes.applyAll(this, [LootOutcomes.dropOutcome(d.kind, d)]);
    }
    if (xp > 0) this.addXp(xp);
    if (xp > 0 || dropsCollected > 0) {
      this.spawnBurst(p.x, p.y, '#7dffc1', Math.min(18, 5 + gemsCollected + dropsCollected), 150, 4, 0.24);
      this.spawnText(p.x, p.y - 48, tr('hud.focusPickup', { count: gemsCollected + dropsCollected }), true, '#7dffc1');
      GameRuntime.playSound(xp > 0 ? 'gem' : 'pickup', this.combo);
      return true;
    }
    return false;
  },

  updatePlayerMovement(dt, st) {
    const p = this.player;
    this.updatePlayerDashState(dt);
    let mv = Input.moveVec();
    if (this.transformControlVector) mv = this.transformControlVector(mv);
    const moveMag = Math.hypot(mv.x || 0, mv.y || 0);
    const moving = moveMag > 0.14;
    if (mv.x || mv.y) { p.moveX = mv.x; p.moveY = mv.y; }
    p.moving = moving;
    p.moveRecentT = moving ? 0.75 : Math.max(0, (p.moveRecentT || 0) - dt);
    p.x += mv.x * st.spd * dt;
    p.y += mv.y * st.spd * dt;
    this.applyPlayerDashMovement(dt);
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
