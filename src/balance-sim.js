'use strict';
// Accelerated local balance simulator facade for seedable, headless browser runs.
const BalanceSim = {
  last: null,

  ensureHelpers(required) {
    const missing = required.filter(name => typeof this[name] !== 'function');
    if (missing.length) {
      throw new Error(`BalanceSim helper scripts missing: ${missing.join(', ')}. Load balance-sim-*.js after balance-sim.js and before main.js.`);
    }
  },

  run(opts = {}) {
    this.ensureHelpers(['makeMovePolicy', 'drainUpgrades', 'pickUpgrade', 'snapshot', 'buildResult']);

    const cfg = {
      seconds: opts.seconds || 1200,
      dt: Math.min(opts.dt || 1 / 30, 0.035),
      seed: opts.seed || 1,
      movement: opts.movement || 'kiteCollect',
      upgrade: opts.upgrade || 'greedyDps',
      endless: opts.endless !== false,
    };
    return this.withSimRuntime(cfg, () => {
      Game.start();
      GameRuntime.stopMusic();
      const started = performance.now();
      const steps = Math.ceil(cfg.seconds / cfg.dt);
      const samples = [];
      const upgrades = [];
      let capTicks = 0, activeTicks = 0, winSeen = false, endlessSeen = false;

      for (let i = 0; i < steps; i++) {
        if (Game.state === 'win') {
          winSeen = true;
          if (!cfg.endless) break;
          Game.goEndless();
          endlessSeen = true;
        }
        this.drainUpgrades(cfg.upgrade, upgrades);
        if (Game.state === 'levelup') Game.state = 'play';
        if (Game.state === 'over') break;
        Game.update(cfg.dt);
        if (Game.endless) endlessSeen = true;
        this.drainUpgrades(cfg.upgrade, upgrades);
        activeTicks++;
        if (Game.enemies.length >= (Game.enemyLimit ? Game.enemyLimit() : CFG.maxEnemies + (Game.endless ? 55 : 0))) capTicks++;
        if (i % Math.max(1, Math.round(30 / cfg.dt)) === 0) samples.push(this.snapshot());
      }

      winSeen = winSeen || Game.state === 'win' || Game.time >= CFG.winTime;
      const result = this.buildResult({ cfg, started, capTicks, activeTicks, winSeen, endlessSeen, upgrades, samples });
      this.last = result;
      return result;
    });
  },

  batch(opts = {}) {
    this.ensureHelpers(['makeMovePolicy', 'drainUpgrades', 'pickUpgrade', 'snapshot', 'buildResult', 'summarizeBatch']);

    const seeds = opts.seeds || [1, 2, 3, 4, 5];
    const runs = seeds.map(seed => this.run({ ...opts, seed }));
    return this.summarizeBatch(opts, seeds, runs);
  },

  withSimRuntime(cfg, fn) {
    const previous = {
      rngSeed: RNG.seed,
      rngSeeded: RNG.seeded,
      manualClock: !!Game.test.manualClock,
      headless: !!Game.test.headless,
      noFx: !!Game.test.noFx,
      muted: typeof AudioFX !== 'undefined' ? !!AudioFX.muted : false,
    };
    const restoreMove = Input.installSimMoveVec(this.makeMovePolicy(cfg.movement));
    try {
      RNG.setSeed(cfg.seed);
      Game.test.manualClock = true;
      Game.test.headless = true;
      Game.test.noFx = true;
      if (typeof AudioFX !== 'undefined') AudioFX.muted = true;
      return fn();
    } finally {
      restoreMove();
      Game.test.manualClock = previous.manualClock;
      Game.test.headless = previous.headless;
      Game.test.noFx = previous.noFx;
      if (typeof AudioFX !== 'undefined') AudioFX.muted = previous.muted;
      RNG.seed = previous.rngSeed;
      RNG.seeded = previous.rngSeeded;
    }
  },

  cleanup() {
    if (Input.simMoveVec) Input.simMoveVec = null;
    Game.test.manualClock = false;
    Game.test.headless = false;
    Game.test.noFx = false;
    RNG.clearSeed();
  },
};
