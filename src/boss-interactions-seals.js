'use strict';
// Endless boss temporary weapon seal helpers.
Object.assign(Game, {
  weaponSealCountForBoss(boss) {
    const cfg = CFG.weaponSeals || {};
    const ratio = clamp(Number(cfg.maxOwnedRatio == null ? 0.6 : cfg.maxOwnedRatio), 0, 0.95);
    return Math.floor(((this.player && this.player.weapons) || []).filter(w => w && w.id).length * ratio);
  },

  sealRecentWeapon(duration, source = 'magnet') {
    const recent = (this.player.recentWeaponIds || []).filter(id => this.player.weapons.some(w => w.id === id));
    const targetId = recent[0] || this.highLevelWeaponCandidates()[0] && this.highLevelWeaponCandidates()[0].id;
    if (!targetId) return [];
    const sealed = this.applyWeaponSeals(1, duration, source, [targetId]);
    if (sealed.length) GameRuntime.banner(tr('boss.magnetWeaponSeal', { name: WEAPONS[targetId] && WEAPONS[targetId].name ? WEAPONS[targetId].name : targetId }), 'warn');
    return sealed;
  },

  highLevelWeaponCandidates() {
    return [...(this.player.weapons || [])].sort((a, b) => (b.lv || 0) - (a.lv || 0));
  },

  applyWeaponSeals(count, duration, source = 'boss', preferredIds = null) {
    this.ensureBossInteractionState();
    const cfg = CFG.weaponSeals || {};
    if (cfg.enabled === false) return [];
    const weapons = (this.player.weapons || []).filter(w => w && w.id);
    const existing = new Set((this.bossDebuffs.weaponSeals || []).map(seal => seal.id));
    const maxSealed = Math.floor(weapons.length * clamp(Number(cfg.maxOwnedRatio == null ? 0.6 : cfg.maxOwnedRatio), 0, 0.95));
    const room = Math.max(0, maxSealed - existing.size);
    const wanted = Math.max(0, Math.min(Math.floor(count || 0), room));
    if (!wanted) {
      this.extendWeaponSeals(10);
      return [];
    }
    const ranked = this.highLevelWeaponCandidates();
    const top = new Set(ranked.slice(0, cfg.topWeaponProtectedCount || 3).map(w => w.id));
    let topUsed = (this.bossDebuffs.weaponSeals || []).filter(seal => top.has(seal.id)).length;
    const topLimit = cfg.topWeaponSealLimit || 1;
    const pool = (preferredIds || weapons.map(w => w.id))
      .map(id => weapons.find(w => w.id === id))
      .filter(Boolean)
      .filter(w => !existing.has(w.id));
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = randi(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = [];
    for (const weapon of shuffled) {
      if (selected.length >= wanted) break;
      if (top.has(weapon.id) && topUsed >= topLimit) continue;
      selected.push(weapon.id);
      if (top.has(weapon.id)) topUsed++;
    }
    if (selected.length < wanted) {
      for (const weapon of shuffled) {
        if (selected.length >= wanted) break;
        if (selected.includes(weapon.id)) continue;
        selected.push(weapon.id);
      }
    }
    for (const id of selected) {
      this.bossDebuffs.weaponSeals.push({ id, t: duration, max: duration, source, elapsed: 0 });
    }
    if (selected.length) this.slotsDirty = true;
    return selected;
  },

  extendWeaponSeals(extraT) {
    const seals = this.bossDebuffs && this.bossDebuffs.weaponSeals || [];
    if (!seals.length) return false;
    for (const seal of seals) seal.t += extraT;
    this.slotsDirty = true;
    return true;
  },

  releaseWeaponSeals(reason = 'bossKill') {
    this.ensureBossInteractionState();
    if (!this.bossDebuffs.weaponSeals.length) return false;
    this.bossDebuffs.weaponSeals = [];
    this.slotsDirty = true;
    GameRuntime.banner(tr('boss.silence.release'), 'good');
    return true;
  },

});
