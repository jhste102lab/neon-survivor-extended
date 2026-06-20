'use strict';
// Persistent weapon effects for orbit and frost. Helper modules own geometry, hits, pickup pull, and FX.
function assertWeaponAuraHelpers() {
  const missing = [];
  if (typeof WeaponAuraOrbitGeometry === 'undefined') missing.push('weapon-aura-orbit-geometry.js');
  if (typeof WeaponAuraOrbitHits === 'undefined') missing.push('weapon-aura-orbit-hits.js');
  if (typeof WeaponAuraOrbitFx === 'undefined') missing.push('weapon-aura-orbit-fx.js');
  if (typeof WeaponAuraFrostDamageSlow === 'undefined') missing.push('weapon-aura-frost-damage-slow.js');
  if (typeof WeaponAuraFrostPickupPull === 'undefined') missing.push('weapon-aura-frost-pickup-pull.js');
  if (typeof WeaponAuraFrostFx === 'undefined') missing.push('weapon-aura-frost-fx.js');
  if (missing.length) throw new Error(`Weapon aura helper scripts missing: ${missing.join(', ')}. Load weapon-aura-* helpers before weapon-auras.js.`);
}
assertWeaponAuraHelpers();

Object.assign(Game, {
  updateOrbit(dt, st) {
    const w = this.player.weapons.find(w => w.id === 'orbit');
    if (!w) return;

    const evolved = this.weaponEvolved && this.weaponEvolved('orbit');
    const s = weaponStats('orbit', w.lv);
    const p = this.player;

    globalThis.WeaponAuraOrbitGeometry.advanceAngle(this.blades, s, evolved, dt);
    for (const blade of globalThis.WeaponAuraOrbitGeometry.bladePositions(p, s, evolved, this.blades.angle)) {
      globalThis.WeaponAuraOrbitHits.hitEnemiesNearBlade(this, blade, { stats: s, combatStats: st, evolved, player: p }, hitBlade => {
        globalThis.WeaponAuraOrbitFx.spawnBladeHitFx(this, hitBlade, evolved);
      });
    }
  },

  updateFrost(dt, st) {
    const w = this.player.weapons.find(w => w.id === 'frost');
    if (!w || this.player.dead) return;

    const evolved = this.weaponEvolved && this.weaponEvolved('frost');
    const s = weaponStats('frost', w.lv);
    const p = this.player;
    const radius = globalThis.WeaponAuraFrostDamageSlow.auraRadius(s, evolved);
    const doDamage = globalThis.WeaponAuraFrostDamageSlow.stepDamageTick(w, dt, evolved);

    globalThis.WeaponAuraFrostDamageSlow.applyToEnemies(this, p, s, st, evolved, radius, doDamage);
    if (evolved) globalThis.WeaponAuraFrostPickupPull.pullPickups(this, p, radius, dt);
    globalThis.WeaponAuraFrostFx.maybeSpawnAuraParticle(this, p, radius, evolved);
  },
});
