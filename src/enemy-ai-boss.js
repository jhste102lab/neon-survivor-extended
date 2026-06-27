'use strict';
// Boss AI orchestrator. Load the enemy-ai-boss-* helper files before this file.
Object.assign(Game, {
  updateBossEnemy(e, dt, dx, dy, dist) {
    const bossDef = e.bossDef;
    if (updateBossFormation(e, dt, bossDef)) return { mvx: 0, mvy: 0 };

    const enrage = getBossEnrage(this, e);
    updateBossDashState(e, dt, dx, dy, enrage);
    const movement = getBossMovement(e, dx, dy, dist, enrage);
    updateBossSummonPattern(this, e, dt, enrage, bossDef);
    updateBossRingBulletPattern(this, e, dt, enrage, bossDef);
    updateBossMegaHazardPatterns(this, e, dt, enrage, bossDef);
    return applyBossFinalMovementModifiers(e, movement);
  },
});

function updateBossFormation(e, dt, bossDef) {
  if (!bossDef || !bossDef.mega || !(e.megaFormT > 0)) return false;
  e.megaFormT = Math.max(0, e.megaFormT - dt);
  e.vulnerableT = Math.max(e.vulnerableT || 0, 0.25);
  return true;
}

function updateBossMegaHazardPatterns(game, e, dt, enrage, bossDef) {
  if (!bossDef || !(game.spawnHazard)) return;
  if (bossDef.mega || bossDef.trap) updateBossMegaRingTrap(game, e, dt, enrage, bossDef);
  if (bossDef.mega || bossDef.laneTrap) updateBossMegaLaneTrap(game, e, dt, enrage, bossDef);
}

function updateBossMegaRingTrap(game, e, dt, enrage, bossDef) {
  e.megaTrapT -= dt;
  if (e.megaTrapT > 0) return;
  e.megaTrapT = Math.max(bossDef.mega ? 3.6 : 4.9, (bossDef.trapCd || 7.2) / (1 + enrage * 0.22));
  const p = game.player;
  const n = (bossDef.mega ? 7 : 5) + Math.min(3, Math.floor(enrage * 2.2));
  const gaps = new Set([randi(0, n - 1)]);
  if (bossDef.mega && n >= 8) gaps.add((randi(0, n - 1) + Math.floor(n / 2)) % n);
  const base = rand(0, TAU);
  const radius = 190 + Math.min(55, enrage * 26);
  for (let i = 0; i < n; i++) {
    if (gaps.has(i)) continue;
    const a = base + i / n * TAU;
    game.spawnHazard({
      kind: 'mega-ring', x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius,
      r: bossDef.mega ? 46 : 34, warn: bossDef.mega ? 0.92 : 1.05, life: 2.65, dmg: (bossDef.mega ? 32 : 14) + Math.floor(enrage * 5), tick: bossDef.mega ? 0.46 : 0.58,
      color: bossDef.color, source: bossDef.mega ? 'boss:mega-ring' : 'boss:ring-trap', label: bossDef.mega ? 'CORE' : 'BOSS', bypassInvuln: !!bossDef.mega,
    });
  }
  markBossVulnerable(e, bossDef.mega ? 1.1 : 0.85, bossDef.mega ? 0.16 : 0.12);
  GameRuntime.playSound('shoot');
}

function updateBossMegaLaneTrap(game, e, dt, enrage, bossDef) {
  e.megaLaneT -= dt;
  if (e.megaLaneT > 0) return;
  e.megaLaneT = Math.max(bossDef.mega ? 4.2 : 5.8, (bossDef.laneCd || 9.0) / (1 + enrage * 0.20));
  const p = game.player;
  const mx = p.moveX || 0;
  const my = p.moveY || (mx ? 0 : 1);
  const ma = Math.atan2(my, mx);
  const pa = ma + Math.PI / 2;
  const gap = randi(-1, 1);
  const ahead = 132 + Math.min(60, enrage * 24);
  for (let i = -2; i <= 2; i++) {
    if (i === gap) continue;
    game.spawnHazard({
      kind: 'mega-lane', x: p.x + Math.cos(ma) * ahead + Math.cos(pa) * i * 84, y: p.y + Math.sin(ma) * ahead + Math.sin(pa) * i * 84,
      r: bossDef.mega ? 44 : 34, warn: bossDef.mega ? 0.82 : 0.95, life: 2.55, dmg: (bossDef.mega ? 34 : 15) + Math.floor(enrage * 5), tick: bossDef.mega ? 0.44 : 0.58,
      color: '#ffd23d', source: bossDef.mega ? 'boss:mega-lane' : 'boss:lane-trap', label: bossDef.mega ? 'CORE' : 'BOSS', bypassInvuln: !!bossDef.mega,
    });
  }
  markBossVulnerable(e, bossDef.mega ? 1.25 : 0.95, bossDef.mega ? 0.17 : 0.12);
}
