'use strict';
// 후반 성장 보상과 10분 이후 자석 중력장.
Object.assign(Game, {
  lateMagnetGravityActive() {
    const cfg = CFG.lateMagnetGravity || {};
    return cfg.enabled !== false && this.time >= (cfg.start || CFG.winTime);
  },

  spawnLateMagnetGravity(x, y) {
    if (!this.lateMagnetGravityActive()) return false;
    const cfg = CFG.lateMagnetGravity || {};
    this.gravityFields = this.gravityFields || [];
    const radius = cfg.radius || 125;
    let field = this.gravityFields.find(f => f && f.kind === 'magnet' && dist2(f.x, f.y, x, y) < radius * radius);
    if (!field) {
      field = { kind: 'magnet', x, y, r: radius, life: cfg.duration || 5, maxLife: cfg.duration || 5, pulse: 0 };
      this.gravityFields.push(field);
    } else {
      field.x = (field.x + x) / 2;
      field.y = (field.y + y) / 2;
      field.life = Math.max(field.life || 0, cfg.duration || 5);
      field.maxLife = Math.max(field.maxLife || 0, cfg.duration || 5);
    }
    if (this.metrics) this.metrics.lateMagnetGravity = (this.metrics.lateMagnetGravity || 0) + 1;
    if (!this._seenLateMagnetGravityTip) {
      this._seenLateMagnetGravityTip = true;
      GameRuntime.banner(tr('banner.lateMagnetGravity'), 'good');
    }
    return true;
  },

  updateLateMagnetGravityFields(dt) {
    if (!this.gravityFields) this.gravityFields = [];
    for (let i = this.gravityFields.length - 1; i >= 0; i--) {
      const f = this.gravityFields[i];
      f.life -= dt;
      f.pulse = (f.pulse || 0) + dt;
      if (f.life <= 0) this.gravityFields.splice(i, 1);
    }
  },

  gravitySlowForEnemy(e) {
    const fields = this.gravityFields || [];
    if (!fields.length || !e) return 0;
    const cfg = CFG.lateMagnetGravity || {};
    let slow = 0;
    for (const f of fields) {
      if (!f || dist2(e.x, e.y, f.x, f.y) > (f.r || 1) * (f.r || 1)) continue;
      const edge = Math.sqrt(dist2(e.x, e.y, f.x, f.y)) / Math.max(1, f.r || 1);
      const k = 0.72 + (1 - clamp(edge, 0, 1)) * 0.28;
      const base = e.boss ? (cfg.bossSlow || 0.08) : e.special ? (cfg.specialSlow || 0.20) : (cfg.normalSlow || 0.30);
      slow = Math.max(slow, base * k);
    }
    return slow;
  },

  noteEventParticipation(dt) {
    if (!this.activeEvent || this.activeEvent.state !== 'active') return;
    const p = this.player;
    const ev = this.activeEvent;
    if (!p || dist2(p.x, p.y, ev.x, ev.y) > (ev.r + 24) * (ev.r + 24)) return;
    this._lateEventHold = (this._lateEventHold || 0) + dt;
  },

  updateLateSurvivalBonus(dt) {
    const cfg = CFG.lateSurvivalBonus || {};
    if (cfg.enabled === false || this.time < (cfg.start || CFG.winTime) || !this.player || this.player.dead) return;
    if (typeof this.dir.lateBonusT !== 'number') this.dir.lateBonusT = cfg.interval || 20;
    this.dir.lateBonusT -= dt;
    if (this.dir.lateBonusT > 0) return;
    this.dir.lateBonusT += cfg.interval || 20;
    const killsNow = this.kills || 0;
    const damageBySource = this.metrics && this.metrics.damageBySource || {};
    const bossDamageNow = Object.keys(damageBySource)
      .filter(source => !String(source).startsWith('enemy:') && !String(source).startsWith('hazard'))
      .reduce((sum, source) => sum + Math.max(0, damageBySource[source] || 0), 0);
    const last = this._lateBonusWindow || { kills: killsNow, bossDamage: bossDamageNow };
    const killDelta = Math.max(0, killsNow - last.kills);
    const bossDelta = Math.max(0, bossDamageNow - last.bossDamage);
    const eventHold = this._lateEventHold || 0;
    this._lateBonusWindow = { kills: killsNow, bossDamage: bossDamageNow };
    this._lateEventHold = 0;
    const qualifies = killDelta >= (cfg.minKills || 10) || bossDelta >= (cfg.minBossDamage || 260) || eventHold >= (cfg.eventHoldSeconds || 2);
    if (!qualifies) return;
    const killK = clamp((killDelta - (cfg.minKills || 10)) / Math.max(1, (cfg.strongKills || 36) - (cfg.minKills || 10)), 0, 1);
    const bossK = clamp((bossDelta - (cfg.minBossDamage || 260)) / Math.max(1, (cfg.strongBossDamage || 1400) - (cfg.minBossDamage || 260)), 0, 1);
    const eventK = eventHold >= (cfg.eventHoldSeconds || 2) ? 0.5 : 0;
    const ratio = lerp(cfg.baseRatio || 0.05, cfg.maxRatio || 0.10, Math.max(killK, bossK, eventK));
    const xp = Math.max(1, Math.round((this.player.xpNeed || 1) * ratio));
    this.addXp(xp);
    if (this.metrics) {
      this.metrics.lateSurvivalBonus = (this.metrics.lateSurvivalBonus || 0) + 1;
      this.metrics.lateSurvivalBonusXp = (this.metrics.lateSurvivalBonusXp || 0) + xp;
    }
    const text = tr('banner.lateSurvivalBonus', { value: Math.round(xp) });
    this.spawnText(this.player.x, this.player.y - 70, text, true, '#7dffc1');
    if (!this._seenLateSurvivalBonusTip) {
      this._seenLateSurvivalBonusTip = true;
      GameRuntime.banner(text, 'good');
    }
  },
});
