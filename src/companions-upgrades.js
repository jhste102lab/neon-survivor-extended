'use strict';
// Companion unlock, choice generation, and acquisition rules.
Object.assign(Game, {
  companionUnlocked() {
    const p = this.player;
    if (!p) return false;
    const unlockT = CFG.unlockTime || CFG.winTime;
    const afterUnlock = this.endless || this.time >= unlockT;
    if (!afterUnlock) return false;
    const weaponLv = p.weapons.reduce((sum, w) => sum + w.lv, 0);
    const overLv = p.weapons.reduce((sum, w) => sum + Math.max(0, w.lv - MAX_LV), 0);
    const passiveLv = Object.values(p.passives).reduce((sum, v) => sum + v, 0);
    return p.level >= 38 || overLv >= 3 || weaponLv + passiveLv >= 44 || this.time >= unlockT + 75;
  },

  companionSlotCap() {
    if (!this.companionUnlocked()) return 0;
    const late = Math.max(0, this.time - (CFG.unlockTime || CFG.winTime));
    if (late < 300) return Math.min(4, 1 + Math.floor(late / 90));
    if (late < 900) return Math.min(COMPANION_VISIBLE_ROLES, 4 + Math.floor((late - 300) / 150));
    return Math.min(COMPANION_MAX_COUNT, COMPANION_VISIBLE_ROLES + Math.floor((late - 900) / 240));
  },

  companionChoices() {
    if (!this.companionUnlocked()) return [];
    const c = companionStateFor(this.player);
    const cap = this.companionSlotCap();
    if (c.count >= cap || c.count >= COMPANION_MAX_COUNT) return [];
    const weights = { guardian: 6.8, scout: 5.8, marker: 5.6, decoy: 5.2, striker: 4.8, cleanser: 5.4 };
    const opts = [];
    if (c.roles.length < COMPANION_VISIBLE_ROLES) {
      for (const id in COMPANION_ROLES) {
        if (!c.roles.includes(id)) opts.push({ kind: 'nc', id, w: weights[id] || 4 });
      }
    }
    if (!opts.length && c.roles.length > 0) {
      for (const role of c.roles) {
        const rank = c.roleRanks[role] || 1;
        if (rank < 3) opts.push({ kind: 'nc', id: `echo_${role}`, role, w: Math.max(2.2, (weights[role] || 4) - rank * 0.8) });
      }
    }
    return opts;
  },

  applyCompanionUpgrade(o) {
    if (!o || o.kind !== 'nc') return false;
    const c = companionStateFor(this.player);
    let id = o.id;
    if (id === 'new') id = this.companionChoices()[0] && this.companionChoices()[0].id;
    const cap = this.companionSlotCap();
    if (c.count >= cap) return false;
    if (id && id.startsWith('echo_')) {
      const role = id.slice(5);
      if (!COMPANION_ROLES[role] || !c.roles.includes(role) || (c.roleRanks[role] || 1) >= 3) return false;
      c.echoes.push(role);
      c.roleRanks[role] = (c.roleRanks[role] || 1) + 1;
      c.count = c.roles.length + c.echoes.length;
      this.metrics.companionRoles = [...c.roles];
      this.metrics.companionEchoes = [...c.echoes];
      this.slotsDirty = true;
      return true;
    }
    if (!COMPANION_ROLES[id] || c.roles.includes(id) || c.roles.length >= COMPANION_VISIBLE_ROLES) return false;
    c.roles.push(id);
    c.roleRanks[id] = 1;
    c.count = c.roles.length + c.echoes.length;
    const p = this.player;
    c.nodes.push({ x: p.x - p.moveX * (42 + c.roles.length * 10), y: p.y - p.moveY * (42 + c.roles.length * 10), phase: rand(0, TAU), role: id });
    this.metrics.companionRoles = [...c.roles];
    this.slotsDirty = true;
    return true;
  },
});
