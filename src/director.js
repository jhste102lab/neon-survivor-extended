'use strict';
// Enemy director orchestration. Spawn scheduling lives in director-spawn.js.
Object.assign(Game, {
  director(dt) {
    const t = this.time;
    this.directNormalEnemySpawns(dt, t);
    if (this.compactEnemyCrowd) this.compactEnemyCrowd(dt);
    if (this.directLatePressure) this.directLatePressure(dt);
    if (this.directIdlePressure) this.directIdlePressure(dt);
    this.directSwarmBurst(dt, t);
    this.directEliteSpawns(dt, t);
    this.directScheduledBossSpawns(t);
    this.directMegaBossSpawn(t);
    this.directEndlessBossSpawns(dt, t);
  },
});
