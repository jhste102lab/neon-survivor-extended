'use strict';
// Boss dash state transitions.
function updateBossDashState(e, dt, dx, dy, enrage) {
  e.dashT -= dt;
  if (e.dashState === 0 && e.dashT <= 0) { e.dashState = 1; e.dashT = 0.8; }
  else if (e.dashState === 1 && e.dashT <= 0) {
    e.dashState = 2; e.dashT = 0.85;
    e.dashDir = Math.atan2(dy, dx);
    GameRuntime.playSound('missile');
  } else if (e.dashState === 2 && e.dashT <= 0) {
    e.dashState = 0;
    if (e.bossDef && e.bossDef.mega) e.vulnerableT = Math.max(e.vulnerableT || 0, 1.6);
    e.dashT = rand(Math.max(2.8, 4.5 - enrage * 0.9), Math.max(4.0, 6.5 - enrage));
  }
}
