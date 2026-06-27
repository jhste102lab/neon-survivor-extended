'use strict';
// Crash-safe run snapshot persistence. Stores gameplay state, not leaderboard proof/session secrets.
const RunSnapshot = {
  key: 'ns_run_snapshot_v1',
  schema: 1,
  minSaveIntervalMs: 8000,
  lastSaveMs: 0,
  pending: false,
  lastError: '',
  gameplayArrays: Object.freeze(['enemies', 'bullets', 'ebullets', 'gems', 'drops', 'hazards', 'novas']),
  visualArrays: Object.freeze(['particles', 'texts', 'beams', 'bolts', 'megaAbsorbs']),

  noteFailure(action, error) {
    this.lastError = error && error.message ? error.message : `${action} failed`;
    if (typeof console !== 'undefined' && console.warn) console.warn(`Run snapshot ${action} failed; continuing without saved run.`);
  },

  clone(value) {
    return JSON.parse(JSON.stringify(value, (key, inner) => {
      if (key === 'hitSet') return undefined;
      if (key === 'runProof') return undefined;
      if (inner instanceof Set) return undefined;
      return inner;
    }));
  },

  canSave(game = Game) {
    return !!(game && game.player && !game.player.dead && ['play', 'pause', 'levelup'].includes(game.state));
  },

  build(game = Game) {
    if (!this.canSave(game)) return null;
    return {
      schema: this.schema,
      savedAt: Date.now(),
      state: game.state === 'levelup' ? 'pause' : game.state,
      rng: { seeded: !!RNG.seeded, seed: RNG.seed >>> 0 },
      run: this.clone({
        time: game.time,
        timeScale: 1,
        userTimeScale: game.userTimeScale || 1,
        hitStopT: 0,
        kills: game.kills,
        combo: game.combo,
        comboT: game.comboT,
        maxCombo: game.maxCombo,
        levelQueue: game.levelQueue,
        deathT: -1,
        novaSeq: game.novaSeq,
        dir: game.dir,
        cam: game.cam,
        blades: game.blades,
        frameSeq: game.frameSeq,
        endless: game.endless,
        focusMode: !!game.focusMode,
        hiddenWeaponEffects: game.hiddenWeaponEffects || {},
        fieldTestInvincible: !!game.fieldTestInvincible,
        fieldTestTouched: !!game.fieldTestTouched,
        fieldTestRun: !!(game.fieldTestTouched || game.fieldTestRun || game.fieldTestInvincible),
        activeEvent: game.activeEvent,
        bossDebuffs: game.bossDebuffs,
        nextEventT: game.nextEventT,
        lastBossSpawnT: game.lastBossSpawnT,
        idleT: game.idleT,
        lastIdleWarnT: game.lastIdleWarnT,
        unlockNotified: game.unlockNotified,
        metrics: game.metrics,
        player: game.player,
        enemies: game.enemies,
        bullets: game.bullets,
        ebullets: game.ebullets,
        gems: game.gems,
        drops: game.drops,
        hazards: game.hazards,
        novas: game.novas,
      }),
    };
  },

  save(game = Game, opts = {}) {
    const now = Date.now();
    if (!opts.force && now - this.lastSaveMs < this.minSaveIntervalMs) return false;
    const payload = this.build(game);
    if (!payload) return false;
    let saved = false;
    try {
      localStorage.setItem(this.key, JSON.stringify(payload));
      this.lastSaveMs = now;
      this.lastError = '';
      saved = true;
    } catch (e) {
      this.noteFailure('save', e);
    }
    return saved;
  },

  schedule(game = Game) {
    const now = Date.now();
    if (this.pending || now - this.lastSaveMs < this.minSaveIntervalMs) return false;
    if (!this.canSave(game)) return false;
    this.pending = true;
    this.lastSaveMs = now;
    const run = () => {
      this.pending = false;
      this.save(game, { force: true });
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 0);
    return true;
  },

  loadRaw() {
    let payload = null;
    try {
      const raw = localStorage.getItem(this.key);
      payload = raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.noteFailure('load', e);
    }
    return payload;
  },

  available() {
    return !!this.validate(this.loadRaw());
  },

  validate(payload) {
    if (!payload || payload.schema !== this.schema || !payload.run) return null;
    const run = payload.run;
    if (!run.player || run.player.dead || !(run.player.hp > 0)) return null;
    if (!Number.isFinite(run.time) || run.time < 1) return null;
    for (const key of this.gameplayArrays) {
      if (!Array.isArray(run[key])) return null;
    }
    return payload;
  },

  clear() {
    try { localStorage.removeItem(this.key); }
    catch (e) { this.noteFailure('clear', e); }
  },

  restore(game = Game) {
    const payload = this.validate(this.loadRaw());
    if (!payload) return false;
    const run = payload.run;
    game.reset();

    game.time = run.time; game.timeScale = 1; game.userTimeScale = run.userTimeScale || 1; game.hitStopT = 0;
    game.kills = run.kills || 0; game.combo = run.combo || 0; game.comboT = run.comboT || 0; game.maxCombo = run.maxCombo || 0;
    game.levelQueue = run.levelQueue || 0; game.deathT = -1; game.novaSeq = run.novaSeq || 0;
    game.dir = run.dir || game.dir; game.cam = run.cam || game.cam; game.blades = run.blades || game.blades;
    game.frameSeq = run.frameSeq || 0; game.endless = !!run.endless; game.focusMode = !!run.focusMode; game.activeEvent = run.activeEvent || null;
    game.bossDebuffs = run.bossDebuffs || game.bossDebuffs;
    game.nextEventT = run.nextEventT || game.nextEventT; game.lastBossSpawnT = run.lastBossSpawnT || -999;
    game.idleT = run.idleT || 0; game.lastIdleWarnT = run.lastIdleWarnT || -999; game.unlockNotified = !!run.unlockNotified;
    game.metrics = run.metrics || game.metrics; game.player = run.player;
    game.hiddenWeaponEffects = run.hiddenWeaponEffects && typeof run.hiddenWeaponEffects === 'object' ? run.hiddenWeaponEffects : {};
    game.fieldTestInvincible = !!run.fieldTestInvincible && game.isFieldTestAllowed();
    game.fieldTestTouched = !!(run.fieldTestTouched || run.fieldTestRun || run.fieldTestInvincible);
    game.fieldTestRun = !!(game.fieldTestTouched || game.fieldTestInvincible);

    for (const key of this.gameplayArrays) {
      game[key].length = 0;
      game[key].push(...run[key]);
    }
    for (const key of this.visualArrays) game[key].length = 0;
    game.boss = game.enemies.find(e => e && e.boss && e.hp > 0) || null;
    game.runId = GameRuntime.runId();
    game.runProof = '';
    game.state = payload.state === 'play' ? 'play' : 'pause';
    game.slotsDirty = true;
    game.lastWeaponSlotCap = maxWeaponSlotsFor(game);
    if (payload.rng && payload.rng.seeded) RNG.setSeed(payload.rng.seed);
    if (typeof Grid !== 'undefined' && Grid.map) Grid.rebuild(game.enemies);
    if (typeof UI !== 'undefined' && UI.syncSpeedControls) UI.syncSpeedControls(game.userTimeScale || 1);
    return true;
  },
};
globalThis.RunSnapshot = RunSnapshot;
