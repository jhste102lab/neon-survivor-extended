'use strict';
// Boss AI orchestrator. Load the enemy-ai-boss-* helper files before this file.
Object.assign(Game, {
  updateBossEnemy(e, dt, dx, dy, dist) {
    const bossDef = e.bossDef;
    if (updateBossFormation(e, dt, bossDef)) return { mvx: 0, mvy: 0 };

    const enrage = getBossEnrage(this, e);
    updateBossDashState(e, dt, dx, dy, enrage);
    const movement = getBossMovement(e, dx, dy, dist, enrage);
    updateBossPatternPhase(this, e, dt);
    updateBossSummonPattern(this, e, dt, enrage, bossDef);
    updateBossRingBulletPattern(this, e, dt, enrage, bossDef);
    updateBossMegaHazardPatterns(this, e, dt, enrage, bossDef);
    updateBossSlimeTrailPattern(this, e, dt, bossDef);
    updateBossFortifySpawnPattern(this, e, dt, enrage, bossDef);
    updateBossTankForgePattern(this, e, dt);
    updateBossFairnessLaserPattern(this, e, dt, enrage, bossDef);
    updateBossVertexLaserPattern(this, e, dt, enrage, bossDef);
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

function updateBossPatternPhase(game, e, dt) {
  e.patternPhaseT = Math.max(0, (e.patternPhaseT || 0) - dt);
  e.patternWarnT = Math.max(0, (e.patternWarnT || 0) - dt);
  if (e.patternPhaseT > 0 && game.applyPatternCrowdRelief) {
    const cfg = CFG.bossPatternPhase || {};
    game.applyPatternCrowdRelief(game.player, cfg.shoveRadius || 430, (cfg.shoveForce || 150) * dt);
  }
}

function startBossPatternPhase(game, e, warn, duration) {
  const cfg = CFG.bossPatternPhase || {};
  e.patternWarnT = Math.max(e.patternWarnT || 0, warn || cfg.warn || 1);
  e.patternPhaseT = Math.max(e.patternPhaseT || 0, (warn || cfg.warn || 1) + (duration || cfg.duration || 5));
  if (game.markMajorDanger) game.markMajorDanger(e.patternPhaseT + ((CFG.dangerDirector || {}).bossPatternIdleGrace || 1), 'boss-pattern');
  if (game.metrics) game.metrics.bossPatternPhases = (game.metrics.bossPatternPhases || 0) + 1;
}

function updateBossFairnessLaserPattern(game, e, dt, enrage, bossDef) {
  const cfg = CFG.bossPatternPhase || {};
  if (cfg.enabled === false || !game.spawnLineHazard || game.time < (cfg.start || 300)) return;
  if (typeof e.fairLaserT !== 'number') e.fairLaserT = rand(6.0, 9.0);
  e.fairLaserT -= dt;
  if (e.fairLaserT > 0) return;
  const hard = game.time >= (cfg.hardStart || CFG.winTime);
  const cd = bossDef.mega ? (cfg.megaLaserCd || 8.8) : (cfg.laserCd || 12.5);
  e.fairLaserT = Math.max(5.8, cd / (1 + enrage * 0.12)) * rand(0.88, 1.14);
  startBossPatternPhase(game, e, cfg.warn || 1, bossDef.mega || hard ? cfg.duration || 5 : 3.2);
  spawnBossLaserVolley(game, e, bossDef, hard, enrage);
}

function spawnBossLaserVolley(game, e, bossDef, hard, enrage) {
  const cfg = CFG.bossPatternPhase || {};
  const p = game.player;
  const base = Math.atan2(p.y - e.y, p.x - e.x);
  const count = bossDef.mega ? (hard ? 3 : 2) : hard ? 2 : 1;
  const spread = count === 1 ? [0] : count === 2 ? [-0.18, 0.18] : [-0.28, 0, 0.28];
  const length = bossDef.mega ? 980 : 820;
  for (const offset of spread) {
    const a = base + offset;
    const cx = e.x + Math.cos(a) * length * 0.32;
    const cy = e.y + Math.sin(a) * length * 0.32;
    const hx = Math.cos(a) * length;
    const hy = Math.sin(a) * length;
    game.spawnLineHazard({
      kind: bossDef.mega ? 'mega-laser' : 'boss-laser',
      x1: cx - hx, y1: cy - hy, x2: cx + hx, y2: cy + hy,
      width: cfg.laserWidth || 28,
      warn: cfg.warn || 1.0,
      life: 1.15,
      dmg: (bossDef.mega ? cfg.megaLaserDamage || 34 : cfg.laserDamage || 22) + Math.floor(enrage * 2),
      tick: 1.2,
      color: bossDef.color || '#ff2bd6',
      source: bossDef.mega ? 'boss:mega-laser' : 'boss:laser',
      label: 'LASER',
    });
  }
  markBossVulnerable(e, cfg.vulnerability || 1.0, bossDef.mega ? 0.16 : 0.12);
  GameRuntime.playSound('shoot');
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

function updateBossFortifySpawnPattern(game, e, dt, enrage, bossDef) {
  const cfg = CFG.bossFortifySpawn || {};
  if (cfg.enabled === false || game.time < (cfg.start || CFG.winTime)) return;
  if (typeof e.fortifySpawnT !== 'number') e.fortifySpawnT = rand(10, 15);
  e.fortifySpawnT -= dt;
  if (e.fortifySpawnT > 0) return;
  e.fortifySpawnT = Math.max(22, (cfg.cooldown || 34) / (1 + enrage * 0.12));
  game.bossFortifySpawnT = Math.max(game.bossFortifySpawnT || 0, cfg.duration || 16);
  markBossVulnerable(e, 1.3, 0.14);
  game.spawnText(e.x, e.y - e.r - 34, '방어 오라', true, '#ffd23d');
}

function updateBossTankForgePattern(game, e, dt) {
  const cfg = CFG.bossTankForge || {};
  if (cfg.enabled === false || game.time < (cfg.start || CFG.winTime + 60)) return;
  e.tankForgeT = Math.max(0, (e.tankForgeT || 0) - dt);
  if (e.tankForgeT > 0) return;
  const radius = cfg.radius || 170;
  const tanks = game.enemies.filter(enemy => enemy && !enemy.boss && !enemy.elite && enemy.type === 'tank' && dist2(enemy.x, enemy.y, e.x, e.y) < radius * radius)
    .sort((a, b) => dist2(a.x, a.y, e.x, e.y) - dist2(b.x, b.y, e.x, e.y));
  if (tanks.length < (cfg.count || 7)) return;
  e.tankForgeT = cfg.cooldown || 16;
  const consume = tanks.slice(0, Math.min(cfg.consume || 5, tanks.length));
  let hp = 0, x = 0, y = 0;
  for (const tank of consume) { hp += Math.max(0, tank.hp || tank.maxHp || 0); x += tank.x; y += tank.y; }
  x = x / consume.length; y = y / consume.length;
  for (const tank of consume) {
    const idx = game.enemies.indexOf(tank);
    if (idx >= 0) game.enemies.splice(idx, 1);
  }
  const mini = game.spawnEnemy('brute', x, y, true);
  if (mini) {
    mini.hp += hp * 0.42;
    mini.maxHp += hp * 0.42;
    mini.fortifiedT = 10;
    mini.armorK = 0.22;
    game.spawnText(mini.x, mini.y - mini.r - 20, '탱커 응집체', true, '#a36bff');
    game.spawnBurst(mini.x, mini.y, '#a36bff', 14, 160, 7, 0.4);
  }
  markBossVulnerable(e, 1.4, 0.16);
}

function updateBossSlimeTrailPattern(game, e, dt, bossDef) {
  if (!bossDef.slimeTrail || !game.spawnHazard) return;
  e.slimeTrailT = Math.max(0, (e.slimeTrailT || 0) - dt);
  if (e.slimeTrailT > 0) return;
  e.slimeTrailT = bossDef.mega ? 0.9 : 1.25;
  game.spawnHazard({ kind: 'boss-slime', x: e.x, y: e.y, r: bossDef.mega ? 46 : 34, warn: 0.05, life: 16, dmg: bossDef.mega ? 8 : 4, tick: 0.95, slow: 0.38, color: '#7dffc1', source: 'boss:slime', label: 'SLOW' });
}

function updateBossVertexLaserPattern(game, e, dt, enrage, bossDef) {
  const cfg = CFG.bossPatternPhase || {};
  if (cfg.enabled === false || !game.spawnLineHazard || game.time < (cfg.hardStart || CFG.winTime)) return;
  if (typeof e.vertexLaserT !== 'number') e.vertexLaserT = rand(8, 13);
  e.vertexLaserT -= dt;
  if (e.vertexLaserT > 0) return;
  e.vertexLaserT = Math.max(11, (cfg.vertexLaserCd || 18) / (1 + enrage * 0.10)) * rand(0.92, 1.16);
  startBossPatternPhase(game, e, cfg.warn || 1, 3.4);
  spawnBossVertexLaserVolley(game, e, bossDef, enrage);
}

function bossVertexCount(bossDef) {
  if (bossDef.shape === 'oct') return 8;
  if (bossDef.shape === 'star') return 5;
  if (bossDef.shape === 'hex') return 6;
  return 5;
}

function spawnBossVertexLaserVolley(game, e, bossDef, enrage) {
  const cfg = CFG.bossPatternPhase || {};
  const n = bossVertexCount(bossDef);
  const step = Math.max(1, Math.floor(n / (bossDef.mega ? 4 : 3)));
  const base = (e.wobble || 0) + rand(0, TAU / n);
  const length = bossDef.mega ? 820 : 680;
  for (let i = 0; i < n; i += step) {
    const a = base + i / n * TAU;
    const ox = e.x + Math.cos(a) * (e.r * 0.9);
    const oy = e.y + Math.sin(a) * (e.r * 0.9);
    const aim = Math.atan2(game.player.y - oy, game.player.x - ox) + rand(-0.16, 0.16);
    game.spawnLineHazard({
      kind: 'boss-vertex-laser',
      x1: ox, y1: oy,
      x2: ox + Math.cos(aim) * length, y2: oy + Math.sin(aim) * length,
      width: Math.max(18, (cfg.laserWidth || 28) * 0.72), warn: cfg.warn || 1.0, life: 0.95,
      dmg: (cfg.vertexLaserDamage || 18) + Math.floor(enrage * 2), tick: 1.1,
      color: bossDef.color || '#ff2bd6', source: 'boss:vertex-laser', label: 'EDGE',
    });
  }
  markBossVulnerable(e, 1.0, bossDef.mega ? 0.16 : 0.13);
  GameRuntime.playSound('shoot');
}
