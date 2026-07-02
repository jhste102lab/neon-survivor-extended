'use strict';
// Dimension mode runtime: gatekeeper, hub, room goals, relics, rewards, and checkpoint state.
(function attachDimensionMode() {
  const WORLD_KEYS = Object.freeze(['enemies', 'bullets', 'ebullets', 'gems', 'drops', 'hazards', 'gravityFields', 'novas']);
  const VISUAL_KEYS = Object.freeze(['particles', 'texts', 'beams', 'bolts', 'megaAbsorbs']);
  const HOLD_SECONDS = 5;

  function cloneArray(value) {
    return JSON.parse(JSON.stringify(value || []));
  }

  function copyArraysFromSnapshot(game, snapshot) {
    for (const key of WORLD_KEYS) {
      if (!game[key]) game[key] = [];
      game[key].length = 0;
      game[key].push(...cloneArray(snapshot && snapshot[key]));
    }
    for (const key of VISUAL_KEYS) if (game[key]) game[key].length = 0;
    if (typeof Grid !== 'undefined' && Grid.map) Grid.rebuild(game.enemies);
    game.boss = game.enemies.find(e => e && e.boss && e.hp > 0) || null;
    if (game.boss) GameRuntime.showBossBar(game.boss.bossDef ? game.boss.bossDef.name : 'BOSS');
    else GameRuntime.hideBossBar();
  }

  function takeWorldSnapshot(game) {
    const snapshot = {};
    for (const key of WORLD_KEYS) snapshot[key] = cloneArray(game[key]);
    return snapshot;
  }

  function emptyWorld(game) {
    for (const key of WORLD_KEYS) if (game[key]) game[key].length = 0;
    for (const key of VISUAL_KEYS) if (game[key]) game[key].length = 0;
    game.boss = null;
    GameRuntime.hideBossBar();
    if (typeof Grid !== 'undefined' && Grid.map) Grid.map.clear();
  }

  function dimensionById(id) {
    return (DIMENSIONS || []).find(d => d.id === id) || null;
  }

  function relicFor(id) {
    return DIMENSION_RELICS[id] || null;
  }

  function completedCount(dim) {
    return Object.keys((dim && dim.completed) || {}).length;
  }

  function ensureDimensionState(game) {
    if (!game.dimension) game.dimension = createDimensionState();
    return game.dimension;
  }

  function createDimensionState() {
    return {
      unlocked: false, gatekeeperSpawned: false, gatekeeperDefeated: false,
      mode: 'external', localTime: 0, activeId: '', activeDef: null,
      entryPortal: null, exitPortal: null, hubPortals: [], completed: {}, relics: {}, rewardChoices: [], bonuses: {},
      external: null, externalPlayer: null, dimensionCheckpoint: null, challenge: null,
      collapseT: 0, successT: 0, completeAnnounced: false, reentryUnlocked: false,
      nextRelicPulseT: 0, relicCooldowns: {}, pendingReward: null,
    };
  }

  function makePortal({ id = '', x, y, r = 82, color = '#41f0ff', name = '', icon = '', asset = '', danger = 1, hold = HOLD_SECONDS }) {
    return { id, x, y, r, color, name, icon, asset, danger, hold, charge: 0, active: false, phase: rand(0, TAU), open: true };
  }

  function updatePortalCharge(game, portal, dt, onComplete) {
    if (!portal || !portal.open || !game.player) return;
    const inside = dist2(game.player.x, game.player.y, portal.x, portal.y) <= (portal.r + CFG.player.radius) ** 2;
    portal.active = inside;
    portal.charge = inside ? Math.min(portal.hold || HOLD_SECONDS, (portal.charge || 0) + dt) : Math.max(0, (portal.charge || 0) - dt * 1.6);
    if (portal.charge >= (portal.hold || HOLD_SECONDS)) {
      portal.charge = 0;
      onComplete();
    }
  }

  function buildHubPortals(dim) {
    const radius = 360;
    dim.hubPortals = DIMENSIONS.map((def, index) => {
      const a = -Math.PI / 2 + index / DIMENSIONS.length * TAU;
      return makePortal({ id: def.id, x: Math.cos(a) * radius, y: Math.sin(a) * radius, r: 74, color: def.color, name: def.name, icon: def.icon, asset: def.asset, danger: def.danger });
    });
    dim.exitPortal = makePortal({ id: 'external', x: 0, y: 520, r: 86, color: '#7dffc1', name: '외부 전장', icon: '↩', danger: 1, hold: 2.2 });
  }

  function powerSnapshot(game) {
    const p = game.player || { weapons: [], passives: {}, evolved: {}, companions: {} };
    const st = game.stat ? game.stat() : { dmg: 1, cd: 1, spd: CFG.player.speed, maxHp: CFG.player.hp };
    const weaponLv = (p.weapons || []).reduce((sum, w) => sum + (w.lv || 0), 0);
    const passiveLv = Object.values(p.passives || {}).reduce((sum, lv) => sum + (lv || 0), 0);
    const evolved = Object.keys(p.evolved || {}).length;
    const companions = p.companions ? (p.companions.count || 0) + ((p.companions.echoes || []).length * 0.65) : 0;
    const raw = weaponLv * 0.06 + passiveLv * 0.05 + evolved * 0.42 + (st.dmg - 1) * 1.4 + (1 - st.cd) * 1.2 + companions * 0.09;
    return { weaponLv, passiveLv, evolved, companions, stat: st, raw: Math.max(1, raw) };
  }

  function dimensionDifficulty(game, def) {
    const dim = ensureDimensionState(game);
    const snap = powerSnapshot(game);
    const clearK = completedCount(dim) * 0.16 + Math.max(0, dim.externalDanger || 0) * 0.06;
    const externalK = Math.min(0.9, Math.max(0, (game.time - CFG.winTime) / 600) * 0.4);
    const powerK = Math.min(1.35, (snap.raw - 2.1) * 0.16);
    return { snap, value: Math.max(1, 1 + clearK + externalK + powerK), clearK, powerK, danger: def.danger || 3 };
  }

  function dimensionEnemy(def, opts = {}) {
    const hp = Math.max(1, opts.hp || 100);
    const color = opts.color || def.color || '#41f0ff';
    return {
      type: opts.type || 'dimension', def: { shape: opts.shape || 'hex', color, r: opts.r || 24, knock: opts.knock == null ? 0.2 : opts.knock },
      x: opts.x || 0, y: opts.y || 0, kx: 0, ky: 0, r: opts.r || 24, hp, maxHp: hp,
      spd: opts.spd || 0, dmg: opts.dmg || 12, xp: opts.xp == null ? 0 : opts.xp,
      flash: 0, orbitCd: 0, boomCd: 0, novaId: 0, slowT: 0, slowK: 0, elite: !!opts.elite, boss: !!opts.boss,
      shootT: rand(1, 2.5), wobble: rand(0, TAU), age: 0,
      dimensionEnemy: true, dimensionObjective: !!opts.objective, dimensionStatic: !!opts.static, dimensionNoRewards: !!opts.noRewards,
      dimensionContact: !!opts.contact, dimensionKind: opts.kind || '', label: opts.label || '', bossDef: opts.bossDef || null,
    };
  }

  function spawnRingEnemies(game, def, count, radius, opts = {}) {
    const list = [];
    const base = rand(0, TAU);
    for (let i = 0; i < count; i++) {
      const a = base + i / count * TAU;
      const e = dimensionEnemy(def, { ...opts, x: Math.cos(a) * radius, y: Math.sin(a) * radius });
      game.enemies.push(e);
      list.push(e);
    }
    return list;
  }

  function challengeTargetsAlive(game) {
    return game.enemies.filter(e => e && e.dimensionObjective && e.hp > 0).length;
  }

  function challengeEnemiesAlive(game) {
    return game.enemies.filter(e => e && e.dimensionEnemy && e.hp > 0).length;
  }

  function spawnDimensionHazardRing(game, def, count, radius, opts = {}) {
    const p = game.player;
    const gap = randi(0, Math.max(0, count - 1));
    const base = rand(0, TAU);
    for (let i = 0; i < count; i++) {
      if (i === gap) continue;
      const a = base + i / count * TAU;
      game.spawnHazard({
        kind: `dimension-${def.id}`, x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius,
        r: opts.r || 34, warn: opts.warn || 0.9, life: opts.life || 2.35, dmg: opts.dmg || 13, tick: 0.65,
        color: def.color, source: `dimension:${def.id}:hazard`, label: opts.label || 'RIFT',
      });
    }
  }

  function spawnDimensionBulletCircle(game, x, y, def, count, speed, opts = {}) {
    const gap = opts.gap == null ? -1 : opts.gap;
    const base = opts.base == null ? rand(0, TAU) : opts.base;
    for (let i = 0; i < count; i++) {
      if (i === gap) continue;
      const a = base + i / count * TAU;
      game.spawnEnemyBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, { r: opts.r || 7, dmg: opts.dmg || 12, life: opts.life || 4.5, kind: `dimension-${def.id}`, source: `dimension:${def.id}:bullet` });
    }
  }

  function spawnLineAtAngle(game, def, angle, offset = 0, width = 30) {
    const len = 1180;
    const cx = Math.cos(angle + Math.PI / 2) * offset;
    const cy = Math.sin(angle + Math.PI / 2) * offset;
    const hx = Math.cos(angle) * len;
    const hy = Math.sin(angle) * len;
    game.spawnLineHazard({ x1: cx - hx, y1: cy - hy, x2: cx + hx, y2: cy + hy, width, warn: 0.95, life: 1.1, dmg: 18, color: def.color, source: `dimension:${def.id}:laser`, label: 'LASER' });
  }

  function spawnRoomLayout(game, def, diff) {
    const dim = game.dimension;
    const d = diff.value;
    const hpMul = 1 + (d - 1) * 0.35;
    dim.challenge = { id: def.id, kind: def.kind, progress: 0, target: def.target, patternT: 1.4, waveT: 2.2, round: 0, objectiveTotal: def.target, objectiveKilled: 0, lastLowHpDropT: -999, contract: null };
    emptyWorld(game);
    game.player.x = 0; game.player.y = 220; game.cam.x = 0; game.cam.y = 0;
    if (def.kind === 'core') {
      game.enemies.push(dimensionEnemy(def, { x: 0, y: -160, r: 52, hp: 7000 * hpMul, objective: true, static: true, noRewards: true, kind: 'core', label: '성운 코어', shape: 'star' }));
      spawnRingEnemies(game, def, 4, 240, { r: 22, hp: 1200 * hpMul, objective: true, static: true, noRewards: true, kind: 'node', shape: 'diamond' });
    } else if (def.kind === 'generators') {
      spawnRingEnemies(game, def, 4, 310, { r: 32, hp: 2300 * hpMul, objective: true, static: true, noRewards: true, kind: 'generator', shape: 'hex' });
      spawnRingEnemies(game, def, 4, 430, { r: 16, hp: 700 * hpMul, static: true, noRewards: true, kind: 'turret', shape: 'diamond' });
    } else if (def.kind === 'anchors') {
      spawnRingEnemies(game, def, 3, 320, { r: 36, hp: 3000 * hpMul, objective: true, static: true, noRewards: true, kind: 'anchor', shape: 'hex' });
      spawnDimensionWave(game, def, 8 + Math.floor(d * 2), hpMul);
    } else if (def.kind === 'duel') {
      const bossDef = { name: '심판자', color: def.color, shape: 'penta' };
      const boss = dimensionEnemy(def, { x: 0, y: -220, r: 62, hp: 10500 * hpMul, objective: true, boss: false, elite: true, noRewards: true, kind: 'judge', shape: 'penta', dmg: 26, spd: 38, bossDef });
      game.enemies.push(boss); game.boss = boss; GameRuntime.showBossBar('심판자');
    } else if (def.kind === 'nests') {
      spawnRingEnemies(game, def, 5, 330, { r: 34, hp: 2100 * hpMul, objective: true, static: true, noRewards: true, kind: 'nest', shape: 'circle' });
      spawnDimensionWave(game, def, 10, hpMul, 'plague');
    } else if (def.kind === 'mirrors') {
      spawnRingEnemies(game, def, 3, 300, { r: 34, hp: 2500 * hpMul, objective: true, static: true, noRewards: true, kind: 'true-mirror', shape: 'diamond' });
      spawnRingEnemies(game, def, 3, 420, { r: 28, hp: 850 * hpMul, static: true, noRewards: true, kind: 'fake-mirror', shape: 'diamond', color: '#6f87a8' });
    } else if (def.kind === 'train') {
      dim.challenge.round = 1;
      spawnDimensionWave(game, def, 12 + Math.floor(d * 2), hpMul, 'train');
      game.enemies.push(dimensionEnemy(def, { x: 0, y: -360, r: 42, hp: 3600 * hpMul, objective: true, static: true, noRewards: true, kind: 'assault-ship', shape: 'tri' }));
    } else if (def.kind === 'casino') {
      spawnCasinoRound(game, def, hpMul);
    }
    Grid.rebuild(game.enemies);
  }

  function spawnDimensionWave(game, def, count, hpMul, theme = '') {
    const radius = 620;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const fast = RNG.next() < 0.34;
      game.enemies.push(dimensionEnemy(def, {
        x: Math.cos(a) * radius + rand(-60, 60), y: Math.sin(a) * radius + rand(-60, 60),
        r: fast ? 11 : 15, hp: (fast ? 95 : 150) * hpMul, spd: fast ? 168 : 102, dmg: fast ? 8 : 12,
        xp: 1, contact: true, kind: theme || 'wave', shape: fast ? 'tri' : 'circle', color: fast ? def.accent : def.color,
      }));
    }
  }

  function spawnCasinoRound(game, def, hpMul) {
    const dim = game.dimension;
    const c = dim.challenge;
    c.round += 1;
    const contracts = [
      { name: '안전 배당', risk: '적 체력 +10%', reward: '회복 드롭 보정', hp: 1.1, bullets: 0.85, color: '#7dffc1' },
      { name: '고위험 잭팟', risk: '탄막 +35%', reward: '점수 크게 증가', hp: 1.0, bullets: 1.35, color: '#ffd23d' },
      { name: '피의 판돈', risk: '현재 체력 -10%', reward: '이번 라운드 피해 보정', hp: 0.85, bullets: 1.05, color: '#ff4d5e', selfDamage: 0.10 },
    ];
    c.contract = pick(contracts);
    if (c.contract.selfDamage) game.player.hp = Math.max(1, game.player.hp - game.stat().maxHp * c.contract.selfDamage);
    GameRuntime.banner(`${c.contract.name}: ${c.contract.risk} / ${c.contract.reward}`, 'info');
    spawnDimensionWave(game, def, 10 + c.round * 3, hpMul * c.contract.hp, 'casino');
    game.enemies.push(dimensionEnemy(def, { x: 0, y: -260, r: 36, hp: (2200 + c.round * 600) * hpMul * c.contract.hp, objective: true, static: true, noRewards: true, kind: 'contract-core', shape: 'hex', color: c.contract.color }));
  }

  function applyEntrySafety(game) {
    const st = game.stat();
    const minHp = st.maxHp * 0.60;
    if (game.player.hp < minHp) game.player.hp = minHp;
    else game.player.barrier = Math.max(game.player.barrier || 0, st.maxHp * 0.15);
    game.player.invuln = Math.max(game.player.invuln || 0, 0.9);
  }

  function rewardChoicesForDimension() {
    const byType = type => DIMENSION_REWARD_CARDS.filter(c => c.type === type || (type === 'economy' && c.type === 'risk'));
    return [pick(byType('survival')), pick(byType('combat')), pick(byType('economy'))].filter(Boolean);
  }

  function applyDimensionRewardCard(game, card) {
    const st = game.stat();
    const b = game.dimension.bonuses || (game.dimension.bonuses = {});
    if (card.id === 'recover') game.player.hp = Math.min(st.maxHp, game.player.hp + st.maxHp * 0.35);
    else if (card.id === 'barrier') game.player.barrier = Math.max(game.player.barrier || 0, st.maxHp * 0.25);
    else if (card.id === 'weapon_power') b.weaponPower = (b.weaponPower || 0) + 0.08;
    else if (card.id === 'boss_mark') b.bossDamage = (b.bossDamage || 0) + 0.10;
    else if (card.id === 'drop_quality') b.dropQuality = (b.dropQuality || 0) + 0.12;
    else if (card.id === 'risk_pact') { b.weaponPower = (b.weaponPower || 0) + 0.06; game.dimension.externalDanger = (game.dimension.externalDanger || 0) + 1; }
    GameRuntime.banner(`${card.name} 획득`, 'good');
  }

  Object.assign(Game, {
    createDimensionState,

    ensureDimensionState() { return ensureDimensionState(this); },

    resetDimensionMode() {
      this.dimension = createDimensionState();
    },

    shouldDelayEndlessForDimension() {
      const dim = ensureDimensionState(this);
      return !dim.gatekeeperDefeated;
    },

    maybeSpawnDimensionGatekeeper(t = this.time) {
      const dim = ensureDimensionState(this);
      if (dim.gatekeeperSpawned || dim.gatekeeperDefeated || t < CFG.winTime) return false;
      if (this.boss && !this.boss.dimensionGatekeeper) {
        const oldBoss = this.boss;
        oldBoss.dimensionNoRewards = true;
        this.spawnBurst(oldBoss.x, oldBoss.y, '#41f0ff', 34, 220, 10, 0.7);
        GameRuntime.banner('기존 보스가 균열에 흡수되었습니다', 'warn');
      }
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e && e.boss && !e.dimensionGatekeeper) {
          e.dimensionNoRewards = true;
          this.enemies.splice(i, 1);
        }
      }
      this.boss = null;
      GameRuntime.hideBossBar();
      if (typeof Grid !== 'undefined' && Grid.map) Grid.rebuild(this.enemies);
      if (this.boss) return false;
      const position = EnemyFactoryPlacement.bossPosition(this);
      const diff = Math.max(1, 1 + Math.max(0, t - CFG.winTime) / 480);
      const boss = BossSpawnEntity.createBoss(DIMENSION_GATEKEEPER, position, diff, 1, { defPatch: { ring: true, trap: true, laneTrap: true } });
      boss.dimensionGatekeeper = true;
      BossSpawnRegistration.registerBoss(this, boss);
      if (this.prepareBossAfterSpawn) this.prepareBossAfterSpawn(boss, { kind: 'gatekeeper', affixes: [] });
      BossSpawnEffects.showBossSpawnWarning(this, boss.bossDef);
      GameRuntime.banner('균열 문지기 등장', 'warn');
      dim.gatekeeperSpawned = true;
      return true;
    },

    openDimensionHubPortal(x = this.player.x, y = this.player.y) {
      const dim = ensureDimensionState(this);
      dim.unlocked = true;
      dim.gatekeeperDefeated = true;
      dim.mode = 'external';
      dim.entryPortal = makePortal({ x, y, r: 104, color: '#41f0ff', name: '차원 허브', icon: '🌀' });
      for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].boss && dist2(this.enemies[i].x, this.enemies[i].y, x, y) < 520 * 520) this.enemies.splice(i, 1);
      GameRuntime.banner('차원 허브가 열렸습니다', 'good');
      this.spawnBurst(x, y, '#41f0ff', 52, 260, 12, 0.85);
      if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    },

    updateExternalDimensionPortal(dt) {
      const dim = ensureDimensionState(this);
      if (!dim.unlocked || dim.mode !== 'external' || !dim.entryPortal) return;
      for (const e of this.enemies) {
        if (e.boss) continue;
        const dx = e.x - dim.entryPortal.x, dy = e.y - dim.entryPortal.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < dim.entryPortal.r + 80) { e.x += dx / d * 180 * dt; e.y += dy / d * 180 * dt; }
      }
      updatePortalCharge(this, dim.entryPortal, dt, () => this.enterDimensionHub());
    },

    enterDimensionHub() {
      const dim = ensureDimensionState(this);
      if (!dim.unlocked || dim.mode !== 'external') return;
      dim.external = takeWorldSnapshot(this);
      dim.externalPlayer = { x: this.player.x, y: this.player.y, camX: this.cam.x, camY: this.cam.y };
      buildHubPortals(dim);
      emptyWorld(this);
      dim.mode = 'hub';
      dim.localTime = 0;
      this.player.x = 0; this.player.y = 0; this.cam.x = 0; this.cam.y = 0;
      this.player.invuln = Math.max(this.player.invuln || 0, 1.0);
      GameRuntime.banner('차원 허브', 'info');
      if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    },

    exitDimensionHub() {
      const dim = ensureDimensionState(this);
      if (dim.mode !== 'hub') return;
      copyArraysFromSnapshot(this, dim.external || {});
      const pos = dim.externalPlayer || { x: 0, y: 0, camX: 0, camY: 0 };
      this.player.x = pos.x; this.player.y = pos.y; this.cam.x = pos.camX; this.cam.y = pos.camY;
      dim.mode = 'external';
      dim.localTime = 0;
      GameRuntime.banner('외부 전장 복귀', 'info');
      if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    },

    enterDimensionRoom(id) {
      const dim = ensureDimensionState(this);
      const def = dimensionById(id);
      if (!def || dim.mode !== 'hub') return;
      if (dim.completed[id] && !dim.reentryUnlocked) { GameRuntime.banner('이미 정복한 차원입니다', 'info'); return; }
      dim.dimensionCheckpoint = {
        player: JSON.parse(JSON.stringify(this.player)),
        completed: { ...dim.completed }, relics: { ...dim.relics }, bonuses: { ...(dim.bonuses || {}) },
        external: cloneArray([]), // marker only; external world remains in dim.external
      };
      dim.mode = 'dimension'; dim.activeId = id; dim.activeDef = def; dim.localTime = 0; dim.successT = 0; dim.collapseT = 0;
      applyEntrySafety(this);
      spawnRoomLayout(this, def, dimensionDifficulty(this, def));
      GameRuntime.banner(`${def.name} 진입`, 'warn');
      if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    },

    completeDimensionRoom() {
      const dim = ensureDimensionState(this);
      const def = dim.activeDef;
      if (!def || dim.mode !== 'dimension') return;
      dim.completed[def.id] = true;
      const relic = relicFor(def.relic);
      if (relic) dim.relics[relic.id] = true;
      dim.pendingReward = { def, relic, choices: rewardChoicesForDimension() };
      emptyWorld(this);
      dim.mode = 'hub'; dim.activeId = ''; dim.activeDef = null; dim.challenge = null; dim.localTime = 0;
      buildHubPortals(dim);
      this.player.x = 0; this.player.y = 0; this.cam.x = 0; this.cam.y = 0;
      this.player.hp = Math.max(this.player.hp, this.stat().maxHp * 0.50);
      if (relic) GameRuntime.banner(`${relic.icon} ${relic.name} 획득`, 'good');
      this.showDimensionRewardChoices();
      this.checkDimensionConquest();
      if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    },

    showDimensionRewardChoices() {
      const dim = ensureDimensionState(this);
      const reward = dim.pendingReward;
      if (!reward || !reward.choices || !reward.choices.length) return;
      const choices = reward.choices.map(card => ({ kind: 'dimensionReward', id: card.id, card }));
      if (typeof UI !== 'undefined' && UI.showDimensionRewardCards) UI.showDimensionRewardCards(choices, reward.def.name);
      else applyDimensionRewardCard(this, reward.choices[0]);
    },

    pickDimensionReward(choice) {
      if (!choice || !choice.card) return false;
      applyDimensionRewardCard(this, choice.card);
      this.dimension.pendingReward = null;
      return true;
    },

    failDimensionRoom(source = 'collapse') {
      const dim = ensureDimensionState(this);
      if (dim.mode !== 'dimension') return;
      dim.mode = 'collapse'; dim.collapseT = 2.0; dim.collapseSource = source;
      this.player.dead = false; this.player.hp = Math.max(1, this.stat().maxHp * 0.25); this.deathT = -1; this.player.invuln = 2.0;
      emptyWorld(this);
      GameRuntime.banner('차원 붕괴 — 자동 탈출', 'warn');
      this.shake(16, 1.2);
    },

    finishDimensionCollapse() {
      const dim = ensureDimensionState(this);
      dim.mode = 'hub'; dim.activeId = ''; dim.activeDef = null; dim.challenge = null; dim.collapseT = 0; dim.localTime = 0;
      buildHubPortals(dim);
      this.player.x = 0; this.player.y = 0; this.cam.x = 0; this.cam.y = 0;
      this.player.dead = false; this.deathT = -1; this.player.hp = Math.max(1, this.stat().maxHp * 0.30); this.player.invuln = 1.8;
      if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    },

    checkDimensionConquest() {
      const dim = ensureDimensionState(this);
      if (completedCount(dim) < DIMENSIONS.length || dim.completeAnnounced) return false;
      dim.completeAnnounced = true; dim.reentryUnlocked = true;
      this.metrics.dimensionConquest = true;
      this.metrics.dimensionConquestTime = Math.round(this.time + (dim.localTime || 0));
      GameRuntime.banner('차원 정복 완료 — 자유 플레이 개방', 'good');
      this.spawnBurst(this.player.x, this.player.y, '#ffd23d', 72, 340, 14, 1.1);
      return true;
    },

    isDimensionSpaceActive() {
      const dim = this.dimension;
      return !!(dim && (dim.mode === 'hub' || dim.mode === 'dimension' || dim.mode === 'collapse'));
    },

    runDimensionFrame(dt, rdt) {
      const dim = ensureDimensionState(this);
      dim.localTime += dt;
      const st = this.cacheFrameStats();
      this.refreshWeaponSlotCap(this.player);
      const mv = this.updatePlayerMovement(dt, st);
      this.updatePlayerInvulnerability(dt);
      this.updatePlayerRegen(dt, st);
      this.updatePlayerTrail(dt, mv);
      this.updateCompanionRuntime(dt, st);
      if (dim.mode === 'dimension') {
        this.fireReadyWeaponCooldowns(dt, st);
        this.updatePersistentWeaponEffects(dt, st);
      }
      this.updateDimensionWorld(dt, st);
      this.updateComboTimer(dt);
      this.updateCameraFollow(dt, this.player);
      this.updateMusicIntensity();
      this.saveRunSnapshotIfDue();
    },

    updateDimensionWorld(dt, st) {
      const dim = ensureDimensionState(this);
      if (dim.mode === 'hub') this.updateDimensionHub(dt);
      else if (dim.mode === 'dimension') this.updateDimensionRoom(dt, st);
      else if (dim.mode === 'collapse') { dim.collapseT -= dt; if (dim.collapseT <= 0) this.finishDimensionCollapse(); }
      this.updateDimensionRelics(dt, st);
      if (dim.mode !== 'collapse') {
        this.updateEnemies(dt, st);
        this.updateBullets(dt, st);
        this.updateEBullets(dt);
        this.updateNovas(dt, st);
        if (this.updateHazards) this.updateHazards(dt, st);
        this.updateGems(dt, st);
        this.updateDrops(dt);
      }
      this.updateFX(dt);
      if (this.player.dead && dim.mode === 'dimension') this.failDimensionRoom('hp0');
    },

    updateDimensionHub(dt) {
      const dim = ensureDimensionState(this);
      for (const portal of dim.hubPortals || []) updatePortalCharge(this, portal, dt, () => this.enterDimensionRoom(portal.id));
      if (dim.exitPortal) updatePortalCharge(this, dim.exitPortal, dt, () => this.exitDimensionHub());
    },

    updateDimensionRoom(dt, st) {
      const dim = ensureDimensionState(this);
      const def = dim.activeDef;
      const c = dim.challenge;
      if (!def || !c) return;
      this.updateDimensionSafetyDrops(dt);
      this.updateDimensionPatterns(dt, def, c);
      const objectiveAlive = challengeTargetsAlive(this);
      const killed = Math.max(0, c.objectiveTotal - objectiveAlive);
      c.objectiveKilled = Math.max(c.objectiveKilled || 0, killed);
      if (def.kind === 'casino' && objectiveAlive <= 0 && challengeEnemiesAlive(this) <= 0) {
        if (c.round >= c.target) this.completeDimensionRoom();
        else spawnCasinoRound(this, def, dimensionDifficulty(this, def).value);
        return;
      }
      if (def.kind === 'train' && objectiveAlive <= 0 && challengeEnemiesAlive(this) <= 0) {
        c.progress += 1;
        if (c.progress >= c.target) this.completeDimensionRoom();
        else spawnDimensionWave(this, def, 12 + c.progress * 4, dimensionDifficulty(this, def).value, 'train');
        return;
      }
      if (objectiveAlive <= 0) this.completeDimensionRoom();
    },

    updateDimensionPatterns(dt, def, c) {
      c.patternT -= dt;
      c.waveT -= dt;
      if (def.kind === 'gravity_well' || def.kind === 'anchors') this.applyDimensionGravity(dt, def);
      if (c.waveT <= 0 && ['anchors', 'nests'].includes(def.kind) && this.enemies.length < 34) {
        c.waveT = 8.5;
        spawnDimensionWave(this, def, 5 + Math.floor((this.dimension.localTime || 0) / 40), dimensionDifficulty(this, def).value, def.kind);
      }
      if (c.patternT > 0) return;
      const d = dimensionDifficulty(this, def).value;
      c.patternT = Math.max(1.8, 4.2 - Math.min(1.6, d * 0.28)) * rand(0.85, 1.18);
      if (def.kind === 'core') {
        const core = this.enemies.find(e => e.dimensionKind === 'core') || this.player;
        spawnDimensionBulletCircle(this, core.x, core.y, def, 14 + Math.floor(d * 3), 120 + d * 18, { gap: randi(0, 16), r: 6, dmg: 11 });
      } else if (def.kind === 'generators') {
        spawnLineAtAngle(this, def, rand(0, Math.PI), rand(-220, 220), 26 + d * 2);
        spawnDimensionHazardRing(this, def, 5, 150 + d * 15, { r: 34, label: 'VOLT', dmg: 13 });
      } else if (def.kind === 'anchors') {
        spawnDimensionHazardRing(this, def, 6, 190, { r: 36, label: 'GRAV', dmg: 13 });
      } else if (def.kind === 'duel') {
        spawnLineAtAngle(this, def, rand(0, Math.PI), 0, 32);
        spawnLineAtAngle(this, def, rand(0, Math.PI), rand(-160, 160), 22);
        spawnDimensionHazardRing(this, def, 5, 180, { r: 38, label: 'JUDGE', dmg: 17 });
      } else if (def.kind === 'nests') {
        spawnDimensionHazardRing(this, def, 5, 170, { r: 44, label: 'SPORE', dmg: 12, color: def.color });
      } else if (def.kind === 'mirrors') {
        spawnLineAtAngle(this, def, rand(0, Math.PI), rand(-260, 260), 22);
        const fake = this.enemies.find(e => e.dimensionKind === 'fake-mirror');
        if (fake) spawnDimensionBulletCircle(this, fake.x, fake.y, def, 10, 145, { r: 5, dmg: 10 });
      } else if (def.kind === 'train') {
        spawnLineAtAngle(this, def, 0, rand(-280, 280), 24);
        spawnDimensionHazardRing(this, def, 4, 180, { r: 34, label: 'RAID', dmg: 12 });
      } else if (def.kind === 'casino') {
        const mul = c.contract ? c.contract.bullets : 1;
        spawnDimensionHazardRing(this, def, Math.round(4 * mul), 160 + d * 12, { r: 34, label: 'BET', dmg: 13 });
      }
    },

    applyDimensionGravity(dt, def) {
      const p = this.player;
      const pull = Math.sin((this.dimension.localTime || 0) * 0.55) > -0.2 ? -1 : 1;
      const dx = p.x, dy = p.y;
      const d = Math.hypot(dx, dy) || 1;
      p.x += dx / d * pull * 26 * dt;
      p.y += dy / d * pull * 26 * dt;
      for (const e of this.enemies) {
        if (e.boss || e.dimensionStatic) continue;
        const ed = Math.hypot(e.x, e.y) || 1;
        e.x -= e.x / ed * 38 * dt;
        e.y -= e.y / ed * 38 * dt;
      }
    },

    updateDimensionSafetyDrops(dt) {
      const dim = ensureDimensionState(this);
      const c = dim.challenge;
      if (!c) return;
      const st = this.stat();
      const hpRatio = this.player.hp / Math.max(1, st.maxHp);
      if (hpRatio < 0.20 && (dim.localTime - (c.lastLowHpDropT || -999)) > 8) {
        c.lastLowHpDropT = dim.localTime;
        this.spawnDrop('chicken', this.player.x + rand(-80, 80), this.player.y + rand(-80, 80));
        this.player.barrier = Math.max(this.player.barrier || 0, st.maxHp * 0.10);
      } else if (hpRatio < 0.35 && (dim.localTime - (c.lastLowHpDropT || -999)) > 12) {
        c.lastLowHpDropT = dim.localTime;
        this.spawnDrop('chicken', this.player.x + rand(-140, 140), this.player.y + rand(-140, 140));
      }
    },

    updateDimensionRelics(dt, st) {
      const dim = ensureDimensionState(this);
      const relics = dim.relics || {};
      const cd = dim.relicCooldowns || (dim.relicCooldowns = {});
      for (const key of Object.keys(cd)) cd[key] = Math.max(0, cd[key] - dt);
      if (relics.gravity_fracture) {
        dim.nextRelicPulseT = (dim.nextRelicPulseT || 0) - dt;
        if (dim.nextRelicPulseT <= 0 && this.state === 'play') {
          dim.nextRelicPulseT = 10;
          const p = this.player;
          for (const e of this.enemies) {
            const dx = p.x - e.x, dy = p.y - e.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 380) { e.x += dx / d * 34; e.y += dy / d * 34; this.damageEnemy(e, e.boss ? 38 : 95, 0, 0, 'relic:gravity_fracture'); }
          }
          this.spawnBurst(p.x, p.y, '#a36bff', 18, 180, 5, 0.34);
        }
      }
      if (relics.propulsion_core && this.player.moving) {
        dim.propulsionT = Math.max(0, (dim.propulsionT || 0) - dt);
        dim.propulsionCd = Math.max(0, (dim.propulsionCd || 0) - dt);
        if (!(dim.propulsionT > 0) && !(dim.propulsionCd > 0)) { dim.propulsionT = 1.1; dim.propulsionCd = 12; }
        if (dim.propulsionT > 0) {
          this.player.x += (this.player.moveX || 0) * st.spd * 0.32 * dt;
          this.player.y += (this.player.moveY || 0) * st.spd * 0.32 * dt;
        }
      }
    },

    modifyIncomingPlayerDamage(dmg, source) {
      const dim = ensureDimensionState(this);
      const relics = dim.relics || {};
      const cd = dim.relicCooldowns || (dim.relicCooldowns = {});
      const s = String(source || '');
      if (relics.insulated_glove && (s.includes('hazard') || s.includes('laser') || s.includes('dimension')) && !(cd.insulated_glove > 0)) {
        cd.insulated_glove = 16;
        this.spawnText(this.player.x, this.player.y - 50, '절연!', true, '#ffd23d');
        return dmg * 0.20;
      }
      if (relics.cleansing_spore && (s.includes('plague') || s.includes('spore') || s.includes('nests'))) dmg *= 0.75;
      if (relics.nebula_sense && !(cd.nebula_sense > 0) && this.player.hp - dmg <= this.stat().maxHp * 0.18) {
        cd.nebula_sense = 18;
        this.hitStop(0.35, 0.45);
        this.player.invuln = Math.max(this.player.invuln || 0, 0.35);
        this.spawnText(this.player.x, this.player.y - 54, '성운 감각', true, '#7de8ff');
        return dmg * 0.45;
      }
      if (relics.mirror_veil && s.includes('bullet') && !(cd.mirror_veil > 0)) {
        cd.mirror_veil = 14;
        this.spawnText(this.player.x, this.player.y - 54, '반사막', true, '#9ff3ff');
        return 0;
      }
      return dmg;
    },

    dimensionDamageMultiplierForEnemy(e) {
      const dim = ensureDimensionState(this);
      let mul = 1 + ((dim.bonuses && dim.bonuses.weaponPower) || 0);
      if ((e.boss || e.elite) && dim.relics && dim.relics.verdict_mark) mul *= 1.12;
      if ((e.boss || e.elite) && dim.bonuses && dim.bonuses.bossDamage) mul *= 1 + dim.bonuses.bossDamage;
      if (dim.activeDef && dim.activeDef.kind === 'casino' && dim.challenge && dim.challenge.contract && dim.challenge.contract.name === '피의 판돈') mul *= 1.10;
      return mul;
    },

    dimensionProgressText() {
      const dim = ensureDimensionState(this);
      const def = dim.activeDef;
      const c = dim.challenge;
      if (!def || !c) return '';
      if (def.kind === 'duel') {
        const boss = this.enemies.find(e => e.dimensionKind === 'judge');
        const hp = boss ? Math.max(0, Math.round(boss.hp / Math.max(1, boss.maxHp) * 100)) : 0;
        return `심판자 체력 ${hp}%`;
      }
      if (def.kind === 'core') {
        const total = this.enemies.filter(e => e.dimensionObjective).reduce((sum, e) => sum + (e.maxHp || 0), 0) + (c.destroyedHp || 0);
        const alive = this.enemies.filter(e => e.dimensionObjective).reduce((sum, e) => sum + Math.max(0, e.hp || 0), 0);
        const pct = total ? Math.round((1 - alive / total) * 100) : 100;
        return `성운 코어 안정화 ${clamp(pct, 0, 100)}%`;
      }
      if (def.kind === 'casino') return `계약 라운드 ${Math.min(c.round, c.target)}/${c.target}`;
      if (def.kind === 'train') return `강습 웨이브 ${Math.min(c.progress + 1, c.target)}/${c.target}`;
      return `${def.objectiveLabel} ${Math.min(c.objectiveKilled || 0, c.objectiveTotal)}/${c.objectiveTotal}`;
    },
  });
})();
