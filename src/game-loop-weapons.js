'use strict';
// Weapon cooldown and persistent weapon-effect helpers for Game.update.
Object.assign(Game, {
  fireReadyWeaponCooldowns(dt, st) {
    const p = this.player;
    for (const w of p.weapons) {
      if (w.id === 'orbit' || w.id === 'frost') continue; // 지속형
      if (this.isWeaponSilenced && this.isWeaponSilenced(w)) continue;
      w.timer -= dt;
      if (w.timer <= 0) {
        const s = weaponStats(w.id, w.lv);
        this.fireWeapon(w, s, st);
        w.timer = Math.max(0.12, (s.cd || 1) * st.cd);
      }
    }
  },

  updatePersistentWeaponEffects(dt, st) {
    if (!(this.isWeaponSilenced && this.isWeaponSilenced({ id: 'orbit' }))) this.updateOrbit(dt, st);
    if (!(this.isWeaponSilenced && this.isWeaponSilenced({ id: 'frost' }))) this.updateFrost(dt, st);
  },
});
