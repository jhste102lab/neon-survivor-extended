'use strict';
// World-system update helper for Game.update.
Object.assign(Game, {
  updateWorldSystems(dt, st) {
    this.director(dt);
    if (this.updateEvents) this.updateEvents(dt, st);
    this.updateEnemies(dt, st);
    this.updateBullets(dt, st);
    this.updateEBullets(dt);
    this.updateNovas(dt, st);
    if (this.updateHazards) this.updateHazards(dt, st);
    this.updateGems(dt, st);
    if (this.updateBossInteractions) this.updateBossInteractions(dt, st);
    this.updateDrops(dt);
    this.updateFX(dt);
  },
});
