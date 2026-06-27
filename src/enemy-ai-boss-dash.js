'use strict';
// Boss dash state transitions.
function updateBossDashState(e, dt, dx, dy, enrage) {
  e.dashT -= dt;
  if (e.dashState === 0 && e.dashT <= 0) { e.dashState = 1; e.dashT = e.bossDef && e.bossDef.mega ? 1.15 : 0.8; }
  else if (e.dashState === 1 && e.dashT <= 0) {
    e.dashState = 2; e.dashT = e.bossDef && e.bossDef.mega ? 0.62 : 0.85;
    e.dashDir = Math.atan2(dy, dx);
    GameRuntime.playSound('missile');
  } else if (e.dashState === 2 && e.dashT <= 0) {
    e.dashState = 0;
    if (e.bossDef && e.bossDef.mega) markBossVulnerable(e, 2.0, 0.22);
    e.dashT = e.bossDef && e.bossDef.mega
      ? rand(Math.max(4.6, 7.2 - enrage * 0.55), Math.max(6.2, 9.2 - enrage * 0.7))
      : rand(Math.max(2.8, 4.5 - enrage * 0.9), Math.max(4.0, 6.5 - enrage));
  }
}
