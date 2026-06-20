'use strict';
// Companion frame update orchestration.
Object.assign(Game, {
  updateCompanions(dt, st) {
    const c = companionStateFor(this.player);
    if (!this.updateCompanionFormation(dt, c)) return;
    this.updateCompanionRoles(dt, st, c);
    this.updateCompanionStriker(dt, st, c);
  },
});
