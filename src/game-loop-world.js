'use strict';
// World-system update helper for Game.update.
Object.assign(Game, {
  updateWorldSystems(dt, st) {
    if (this.updateDangerDirectorTimers) this.updateDangerDirectorTimers(dt);
    this.director(dt);
    if (this.updateEvents) this.updateEvents(dt, st);
    if (this.updateSupportBuffs) this.updateSupportBuffs(dt, st);
    if (this.updateLateMagnetGravityFields) this.updateLateMagnetGravityFields(dt);
    this.updateEnemies(dt, st);
    this.updateBullets(dt, st);
    this.updateEBullets(dt);
    this.updateNovas(dt, st);
    if (this.updateHazards) this.updateHazards(dt, st);
    this.updateGems(dt, st);
    if (this.updateBossInteractions) this.updateBossInteractions(dt, st);
    this.updateDrops(dt);
    if (this.noteEventParticipation) this.noteEventParticipation(dt);
    this.updateFX(dt);
  },
});
