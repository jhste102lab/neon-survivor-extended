'use strict';
// Late and idle pressure dispatch. Pattern bodies live in pressure-*.js.
const PressurePatternRegistry = Object.freeze({
  ring: (game, context) => game.spawnLateRingTrap(context),
  lane: (game, context) => game.spawnLateLaneTrap(context),
  hunter: (game, context) => game.spawnLateHunterTrap(context),
});

Object.assign(Game, {
  directLatePressure(dt) {
    const start = CFG.lateRampStart || 420;
    if (!this.canApplyPressureFrom(start)) return;
    if (this.tacticalHoldActive && this.tacticalHoldActive()) return;
    const d = this.dir;
    this.ensureLateTrapTimer(d);
    d.trapT -= dt;
    if (d.trapT > 0) return;
    const threat = this.pressureThreat();
    d.trapT = this.nextLateTrapDelay(threat);
    this.spawnLateTrapPattern(threat);
  },

  canApplyPressureFrom(start) {
    return !!(this.player && !this.player.dead && this.time >= start && this.spawnHazard);
  },

  ensureLateTrapTimer(d) {
    if (typeof d.trapT !== 'number') d.trapT = 12;
  },

  pressureThreat() {
    return this.lateThreat ? this.lateThreat() : 0;
  },

  nextLateTrapDelay(threat) {
    return Math.max(3.8, 11.5 / (1 + threat * 0.22)) * rand(0.82, 1.16);
  },

  spawnLateTrapPattern(threat = 0) {
    const context = this.lateTrapContext(threat);
    const type = pick(Object.keys(PressurePatternRegistry));
    PressurePatternRegistry[type](this, context);
  },

  lateTrapContext(threat) {
    return {
      player: this.player,
      threat,
      dmg: 10 + Math.min(18, threat * 2.2),
      warn: Math.max(0.62, 1.05 - Math.min(0.35, threat * 0.025)),
    };
  },

  directIdlePressure(dt) {
    const start = CFG.idlePressureStart || 480;
    if (!this.canApplyPressureFrom(start)) return;
    if (this.shouldSuppressIdlePressure && this.shouldSuppressIdlePressure()) {
      this.resetIdleMissileTimer(this.dir);
      return;
    }
    const idle = this.idleT || 0;
    const d = this.dir;
    if (idle < 2.2) {
      this.resetIdleMissileTimer(d);
      return;
    }
    this.ensureIdleMissileTimer(d);
    d.idleMissileT -= dt;
    if (d.idleMissileT > 0) return;

    const threat = this.pressureThreat();
    const idleK = this.idlePressureIntensity(idle);
    d.idleMissileT = this.nextIdleMissileDelay(idleK, threat);
    const context = this.idleMissileContext(idle, idleK, threat);
    this.spawnIdleMissilePattern(context);
  },

  resetIdleMissileTimer(d) {
    d.idleMissileT = Math.min(typeof d.idleMissileT === 'number' ? d.idleMissileT : 1.2, 1.2);
  },

  ensureIdleMissileTimer(d) {
    if (typeof d.idleMissileT !== 'number') d.idleMissileT = 0.25;
  },

  idlePressureIntensity(idle) {
    return clamp((idle - 2.2) / 5.2, 0, 1);
  },

  nextIdleMissileDelay(idleK, threat) {
    return Math.max(1.15, 3.4 - idleK * 1.5 - Math.min(0.55, threat * 0.045));
  },

  idleMissileContext(idle, idleK, threat) {
    return {
      player: this.player,
      idleK,
      n: 2 + Math.min(4, Math.floor((idle - 2.2) / 1.8)) + (threat > 7 ? 1 : 0),
      warn: Math.max(0.48, 0.84 - Math.min(0.24, threat * 0.02)),
      radius: 50 + Math.min(16, threat * 1.2),
      dmg: 17 + Math.min(34, threat * 3.0),
    };
  },

  warnIdlePressure() {
    this.lastIdleWarnT = this.time;
  },
});
