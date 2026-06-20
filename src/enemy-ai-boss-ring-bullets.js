'use strict';
// Boss radial ring bullet pattern.
function updateBossRingBulletPattern(game, e, dt, enrage, bossDef) {
  if (bossDef.ring || enrage > 0.25) {
    e.ringT -= dt;
    if (e.ringT <= 0) {
      const ringCd = bossDef.ringCd || 5.6;
      const ringN = (bossDef.ringN || 8) + Math.floor(enrage * (bossDef.mega ? 6 : 4));
      const gapWidth = Math.max(0, Math.min(ringN - 1, bossDef.ringGap || 0));
      const gapStart = gapWidth > 0 ? randi(0, ringN - 1) : -1;
      e.ringT = Math.max(bossDef.mega ? 2.6 : 2.8, ringCd / (1 + enrage * 0.28));
      const base = rand(0, TAU);
      for (let k = 0; k < ringN; k++) {
        if (gapWidth > 0 && ringSlotInGap(k, gapStart, gapWidth, ringN)) continue;
        const a = base + k / ringN * TAU;
        const speed = (bossDef.mega ? 178 : 150) + enrage * (bossDef.mega ? 26 : 18);
        const dmg = (bossDef.mega ? 22 : 12) + enrage * (bossDef.mega ? 4 : 2);
        game.spawnEnemyBullet(e.x, e.y, Math.cos(a) * speed, Math.sin(a) * speed, { r: bossDef.mega ? 9 : 8, dmg, life: 5, kind: 'ring', source: bossDef.mega ? 'boss:mega-ring-bullet' : 'enemy:ring' });
      }
      GameRuntime.playSound('shoot');
    }
  }
}

function ringSlotInGap(slot, start, width, total) {
  for (let i = 0; i < width; i++) {
    if (slot === (start + i) % total) return true;
  }
  return false;
}
