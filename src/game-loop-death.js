'use strict';
// Player death transition helper for Game.update.
Object.assign(Game, {
  updateDeathTransition(rdt) {
    this.deathT -= rdt;
    if (this.deathT <= 0 && this.deathT > -100) {
      this.deathT = -200;
      GameRuntime.gameOver();
    }
  },
});

