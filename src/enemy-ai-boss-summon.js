'use strict';
// Boss minion summon pattern.
function updateBossSummonPattern(game, e, dt, enrage, bossDef) {
  e.summonT -= dt;
  if (e.summonT <= 0 && bossDef.summon) {
    e.summonT = Math.max(4.4, bossDef.summonCd / (1 + enrage * 0.20));
    const summonN = bossDef.summonN + Math.floor(enrage * 1.4);
    for (let k = 0; k < summonN; k++) {
      const a = rand(0, TAU);
      game.spawnEnemy(bossDef.summon, e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70);
    }
    game.spawnBurst(e.x, e.y, bossDef.color, 12, 160, 6, 0.5);
  }
}
