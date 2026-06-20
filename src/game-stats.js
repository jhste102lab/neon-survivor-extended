'use strict';
// Derived player stats, runtime caps, and late-game scalar helpers.
Object.assign(Game, {
  /* ---------- 파생 스탯 ---------- */

  stat() {
    const p = this.player.passives, t = this.player.transcend;
    return {
      dmg: 1 + 0.12 * (p.power || 0) + 0.08 * t.dmg,
      cd: Math.max(0.3, Math.pow(0.93, p.haste || 0) * Math.pow(0.96, t.cd)),
      spd: CFG.player.speed * Math.min(2.3, (1 + 0.08 * (p.boots || 0)) * (1 + 0.05 * t.spd)),
      maxHp: CFG.player.hp + 20 * (p.vitality || 0) + 20 * t.hp,
      pickup: CFG.player.pickup * (1 + 0.4 * (p.magnet || 0)),
      regen: 0.65 * (p.regen || 0),
      crit: Math.min(0.6, CFG.critChance + 0.03 * (p.luck || 0)),
      luck: 1 + 0.3 * (p.luck || 0),
      xp: 1 + 0.1 * (p.wisdom || 0),
    };
  },

  isMobileRuntime() {
    return GameRuntime.isMobileViewport();
  },

  lateThreat() {
    const start = CFG.lateRampStart || ((CFG.unlockTime || CFG.winTime) + 120);
    if (!this.player || this.time < start) return 0;
    const minutes = Math.max(0, (this.time - start) / 60);
    const exp = Math.pow(CFG.lateRampBase || 1.16, minutes) - 1;
    const p = this.player;
    const weaponLv = p.weapons.reduce((sum, w) => sum + w.lv, 0);
    const passiveLv = Object.values(p.passives || {}).reduce((sum, lv) => sum + lv, 0);
    const companionN = p.companions ? (p.companions.count || 0) + ((p.companions.echoes || []).length * 0.65) : 0;
    const buildRamp = clamp((this.time - (CFG.idlePressureStart || 480)) / 180, 0, 1);
    const buildK = (p.weapons.length >= Object.keys(WEAPONS).length ? 0.34 : 0)
      + Math.min(0.42, Math.max(0, weaponLv - 36) / 78)
      + Math.min(0.28, Object.keys(p.evolved || {}).length * 0.055)
      + buildRamp * (
        Math.min(0.26, Math.max(0, p.weapons.length - 5) * 0.04)
        + Math.min(0.22, Math.max(0, passiveLv - 18) / 72)
        + Math.min(0.24, companionN * 0.035)
      );
    return exp * (1 + buildK);
  },

  loadShedK(start = CFG.unlockTime || 300, span = 240) {
    return clamp((this.time - start) / span, 0, 1);
  },

  enemyLimit() {
    const pressureT = Math.max(0, this.time - (CFG.dropTaperStart || 360));
    const endlessT = Math.max(0, this.time - CFG.winTime);
    const pressureBonus = Math.min(90, Math.floor(pressureT / 3.2));
    const endlessBonus = this.endless ? 120 + Math.min(150, Math.floor(endlessT / 4)) : 0;
    const base = CFG.maxEnemies + pressureBonus + endlessBonus;
    if (!this.isMobileRuntime()) {
      const late = this.loadShedK(CFG.dropTaperStart || 360, 300);
      const cap = Math.round(lerp(CFG.maxEnemies, CFG.maxEnemies + 90, late)) + endlessBonus;
      return Math.min(base, Math.max(CFG.lateEnemyCap || 275, cap));
    }
    const late = clamp((this.time - (CFG.dropTaperStart || 360)) / 300, 0, 1);
    const mobilePressureBonus = Math.min(52, Math.floor(pressureT / 5));
    const mobileBonus = (this.endless ? 56 + Math.min(74, Math.floor(endlessT / 7)) : 0) + mobilePressureBonus;
    const cap = Math.round(lerp(CFG.mobile.enemyCap || 300, (CFG.mobile.enemyCap || 300) + 52, late)) + (this.endless ? Math.min(74, Math.floor(endlessT / 7)) : 0);
    return Math.min((CFG.mobile.enemyCap || 300) + mobileBonus, Math.max(CFG.mobile.lateEnemyCap || 230, cap));
  },

  gemLimit() {
    if (!this.isMobileRuntime()) {
      const late = this.loadShedK(CFG.unlockTime || 300, 240);
      return Math.round(lerp(CFG.maxGems, CFG.lateGemCap || 260, late));
    }
    const late = clamp((this.time - (CFG.lateRampStart || 420)) / 240, 0, 1);
    return Math.round(lerp(CFG.mobile.gemCap || 300, CFG.mobile.lateGemCap || 220, late));
  },

  playerBulletLimit() {
    if (!this.isMobileRuntime()) {
      const late = this.loadShedK(CFG.unlockTime || 300, 300);
      return Math.round(lerp(CFG.maxPlayerBullets, CFG.latePlayerBulletCap || 330, late));
    }
    const late = clamp((this.time - (CFG.lateRampStart || 420)) / 240, 0, 1);
    return Math.round(lerp(CFG.mobile.bulletCap || 330, CFG.mobile.lateBulletCap || 280, late));
  },

  enemyBulletLimit() {
    return this.isMobileRuntime() ? (CFG.mobile.enemyBulletCap || 130) : (CFG.maxEnemyBullets || 220);
  },

  particleLimit() {
    const late = this.loadShedK(CFG.unlockTime || 300, 240);
    if (!this.isMobileRuntime()) return Math.round(lerp(500, CFG.lateParticleCap || 280, late));
    return Math.round(lerp(CFG.mobile.particleCap || 320, CFG.mobile.lateParticleCap || 220, late));
  },

  textLimit() {
    if (this.isMobileRuntime()) return CFG.mobile.textCap || 44;
    const late = this.loadShedK(CFG.unlockTime || 300, 240);
    return Math.round(lerp(56, CFG.lateTextCap || 38, late));
  },

  dropLimit() {
    if (this.isMobileRuntime()) return CFG.mobile.dropCap || 82;
    const late = this.loadShedK(CFG.unlockTime || 300, 240);
    return Math.round(lerp(CFG.maxDrops || 130, CFG.lateDropCap || 92, late));
  },

  fxScale() {
    const late = this.loadShedK(CFG.unlockTime || 300, 240);
    if (!this.isMobileRuntime()) return lerp(0.92, 0.52, late);
    return lerp(0.68, 0.34, late);
  },

  itemDropScale() {
    const start = CFG.dropTaperStart || 360;
    if (!this.player || this.time < start) return 1;
    const settle = clamp((this.time - start) / 120, 0, 1);
    const afterMinutes = Math.max(0, (this.time - start - 120) / 60);
    let scale = lerp(1, 0.68, settle) / Math.pow(1.07, afterMinutes);
    if (this.player.weapons.length >= Object.keys(WEAPONS).length) scale *= 0.82;
    return clamp(scale, 0.38, 1);
  },
});
