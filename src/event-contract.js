'use strict';
// Active contract event behavior.
Object.assign(Game, {
  updateContractEvent(ev, dt) {
    ev.spawnT -= dt;
    if (ev.spawnT <= 0) {
      ev.spawnT = 3.8;
      const type = pick(['bulwark', 'warden', 'brute', 'charger']);
      const elite = type === 'brute' && RNG.next() < 0.35;
      this.spawnEnemy(type, null, null, elite);
    }
    if (ev.life <= 0) this.completeEvent(ev, true);
  },
});
