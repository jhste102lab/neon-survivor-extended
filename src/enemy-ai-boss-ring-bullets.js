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
      e.ringT = Math.max(bossDef.mega ? 2.35 : 2.5, ringCd / (1 + enrage * 0.28));
      const base = rand(0, TAU);
      for (let k = 0; k < ringN; k++) {
        if (gapWidth > 0 && ringSlotInGap(k, gapStart, gapWidth, ringN)) continue;
        const a = base + k / ringN * TAU;
        const speed = (bossDef.mega ? 200 : 175) + enrage * (bossDef.mega ? 28 : 20);
        const dmg = (bossDef.mega ? 22 : 12) + enrage * (bossDef.mega ? 4 : 2);
        game.spawnEnemyBullet(e.x, e.y, Math.cos(a) * speed, Math.sin(a) * speed, { r: bossDef.mega ? 9 : 8, dmg, life: 5, kind: 'ring', source: bossDef.mega ? 'boss:mega-ring-bullet' : 'enemy:ring' });
      }
      markBossVulnerable(e, bossDef.mega ? 0.95 : 0.75, bossDef.mega ? 0.15 : 0.12);
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
