'use strict';
// 위험 겹침과 제자리 방지 충돌을 조율하는 경량 감독관.
Object.assign(Game, {
  dangerDirectorEnabled() {
    const cfg = CFG.dangerDirector || {};
    return cfg.enabled !== false;
  },

  markMajorDanger(duration = 1.2, reason = 'major') {
    if (!this.dangerDirectorEnabled()) return;
    this.majorDangerQuietT = Math.max(this.majorDangerQuietT || 0, duration);
    this.majorDangerReason = reason;
  },

  updateDangerDirectorTimers(dt) {
    this.majorDangerQuietT = Math.max(0, (this.majorDangerQuietT || 0) - dt);
  },

  bossPatternActive() {
    return !!(this.boss && (this.boss.patternPhaseT > 0 || this.boss.patternWarnT > 0));
  },

  eventTacticalContext() {
    return !!(this.activeEvent && this.activeEvent.state === 'active');
  },

  tacticalHoldActive() {
    if (!this.dangerDirectorEnabled()) return false;
    return this.bossPatternActive() || this.eventTacticalContext() || (this.majorDangerQuietT > 0);
  },

  shouldSuppressIdlePressure() {
    if (!this.dangerDirectorEnabled()) return false;
    return this.tacticalHoldActive();
  },

  pressureSpawnMultiplier() {
    if (!this.dangerDirectorEnabled()) return 1;
    return this.tacticalHoldActive() ? (CFG.dangerDirector.spawnSuppressionMul || 0.45) : 1;
  },

  applyPatternCrowdRelief(origin, radius = 420, force = 140) {
    if (!origin || !this.enemies) return;
    const r2 = radius * radius;
    for (const e of this.enemies) {
      if (!e || e.boss) continue;
      const dx = e.x - origin.x, dy = e.y - origin.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const d = Math.sqrt(d2) || 1;
      const k = 1 - d / radius;
      e.kx += dx / d * force * (0.35 + k);
      e.ky += dy / d * force * (0.35 + k);
    }
  },
});
