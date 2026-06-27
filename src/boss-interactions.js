'use strict';
// Endless boss rush affixes, player debuffs, and low-cost interaction state.
const BossInteractions = (() => {
  const NORMAL_AFFIXES = Object.freeze(['devour', 'silence', 'distort']);
  const COLORS = Object.freeze({
    devour: '#ff2bd6',
    seal: '#ffd23d',
    silence: '#9f7dff',
    distort: '#41f0ff',
    mega: '#ff4d5e',
  });
  const LABEL_KEYS = Object.freeze({
    devour: 'boss.affix.devour',
    seal: 'boss.affix.seal',
    silence: 'boss.affix.silence',
    distort: 'boss.affix.distort',
  });

  function label(kind) {
    return LABEL_KEYS[kind] ? tr(LABEL_KEYS[kind]) : kind;
  }

  function color(kind) {
    return COLORS[kind] || COLORS.mega;
  }
  function normalAffixForTime(time, winTime = CFG.winTime) {
    const minute = Math.max(0, Math.floor((time - winTime) / 60));
    return NORMAL_AFFIXES[minute % NORMAL_AFFIXES.length];
  }
  function megaAffixesForTier(tier) {
    const index = Math.max(0, Math.floor(tier || 1) - 1) % NORMAL_AFFIXES.length;
    return [NORMAL_AFFIXES[index]];
  }
  function shouldUseMegaSlot(time, winTime = CFG.winTime) {
    if (time < winTime) return false;
    return Math.floor((time - winTime) % 180) < 1;
  }
  function bossStatusName(boss) {
    const affixes = (boss && boss.bossAffixes) || [];
    const suffix = affixes.length ? ` · ${affixes.map(label).join('/')}` : '';
    const tier = boss && (boss.megaTier || boss.bossDef && boss.bossDef.endlessTier);
    return `${boss && boss.bossDef ? boss.bossDef.name : tr('boss.name.unknown')}${tier ? ` ${tr('boss.tier', { tier })}` : ''}${suffix}`;
  }
  return { NORMAL_AFFIXES, label, color, normalAffixForTime, megaAffixesForTier, shouldUseMegaSlot, bossStatusName };
})();
globalThis.BossInteractions = BossInteractions;

const BossInteractionCastHandlers = Object.freeze({
  devour(game, boss) { game.startBossDropAbsorb(boss, (CFG.endlessDevour && CFG.endlessDevour.duration) || 5.8); },
  seal(game, boss) { game.applyDropSeal(boss, 7.2); },
  silence(game, boss) { game.applyWeaponSilence(boss); },
  distort(game, boss) { game.applyControlDistortion(boss, boss.bossKind === 'mega' && game.time >= CFG.winTime + 540 ? 'invert' : 'swirl', boss.bossKind === 'mega' ? 2.7 : 2.2); },
});
const BOSS_RUSH_ENERGY = Object.freeze({
  mega: { gain: 0.18, absorb: 12, color: 'mega', burstN: 18, burstR: 9 },
  normal: { gain: 0.08, absorb: 4, color: 'devour', burstN: 8, burstR: 5 },
});

Object.assign(Game, {
  ensureBossInteractionState() {
    if (!this.bossDebuffs) {
      this.bossDebuffs = {
        controlT: 0, controlMode: '', controlAngle: 0,
        dropSealT: 0,
        weaponSilenceT: 0, weaponSilenceId: '',
        weaponSeals: [],
      };
    }
    if (!Array.isArray(this.bossDebuffs.weaponSeals)) this.bossDebuffs.weaponSeals = [];
    if (!this.bossLinks) this.bossLinks = [];
  },

  resetBossInteractionState() {
    this.bossDebuffs = { controlT: 0, controlMode: '', controlAngle: 0, dropSealT: 0, weaponSilenceT: 0, weaponSilenceId: '', weaponSeals: [] };
    this.bossLinks = [];
  },

  prepareBossAfterSpawn(boss, opts = {}) {
    if (!boss) return null;
    this.ensureBossInteractionState();
    const affixes = Array.isArray(opts.affixes) ? opts.affixes.filter(Boolean) : [];
    boss.bossKind = opts.kind || boss.bossKind || (boss.bossDef && boss.bossDef.mega ? 'mega' : 'scheduled');
    boss.bossAffixes = affixes;
    boss.bossAbilityIndex = 0;
    boss.bossAbilityT = opts.initialAbilityT == null ? (boss.bossKind === 'mega' ? 4.2 : 3.2) : opts.initialAbilityT;
    boss.bossCast = null;
    boss.dropAbsorbT = 0;
    boss.devourHealThisCast = 0;
    boss.devourBombDamageThisCast = 0;
    boss.devourHealWindow = [];
    boss.absorbCount = boss.absorbCount || 0;
    if (boss.bossAffixes.length) {
      boss.bossDef.name = BossInteractions.bossStatusName(boss);
      GameRuntime.showBossBar(boss.bossDef.name);
    }
    return boss;
  },

  bossRushNormalDue(t = this.time) {
    if (t < CFG.winTime + 60) return false;
    const next = this.dir.nextEndlessBossT || (CFG.winTime + 60);
    return t >= next;
  },

  advanceBossRushNormalSchedule(t = this.time) {
    const base = CFG.winTime + 60;
    let next = this.dir.nextEndlessBossT || base;
    while (next <= t) next += 60;
    this.dir.nextEndlessBossT = next;
  },

  feedBossRushEnergy(kind = 'normal') {
    const boss = this.boss || this.enemies.find(e => e.boss);
    if (!boss) return false;
    const energy = BOSS_RUSH_ENERGY[kind] || BOSS_RUSH_ENERGY.normal;
    const maxHpGain = boss.maxHp * energy.gain;
    boss.maxHp += maxHpGain;
    boss.absorbCount = (boss.absorbCount || 0) + energy.absorb;
    const color = BossInteractions.color(energy.color);
    this.spawnBossLink(this.player.x, this.player.y, boss.x, boss.y, color, 0.55, tr('boss.empowered'));
    this.spawnText(boss.x, boss.y - boss.r - 28, tr('boss.empowered'), true, color);
    this.spawnBurst(boss.x, boss.y, color, energy.burstN, 170, energy.burstR, 0.45);
    GameRuntime.updateBossBar(boss);
    return true;
  },

  updateBossInteractions(dt, st) {
    this.ensureBossInteractionState();
    this.updateBossDebuffs(dt);
    this.updateBossLinks(dt);
    for (const boss of this.enemies) {
      if (!boss || !boss.boss) continue;
      this.updateBossCast(boss, dt);
      this.updateBossDropAbsorb(boss, dt);
    }
  },

  updateBossDebuffs(dt) {
    const d = this.bossDebuffs;
    d.controlT = Math.max(0, d.controlT - dt);
    d.dropSealT = Math.max(0, d.dropSealT - dt);
    d.weaponSilenceT = Math.max(0, d.weaponSilenceT - dt);
    this.updateWeaponSeals(dt);
    if (d.controlT <= 0) d.controlMode = '';
    if (d.weaponSilenceT <= 0) d.weaponSilenceId = '';
  },

  updateWeaponSeals(dt) {
    const d = this.bossDebuffs;
    const seals = this.bossDebuffs.weaponSeals || [];
    const cfg = CFG.weaponSeals || {};
    let changed = false;
    for (let i = seals.length - 1; i >= 0; i--) {
      const seal = seals[i];
      seal.t = Math.max(0, (seal.t || 0) - dt);
      seal.elapsed = (seal.elapsed || 0) + dt;
      if (seal.t <= 0) {
        seals[i] = seals[seals.length - 1];
        seals.pop();
        changed = true;
      }
    }
    const gradualStart = cfg.gradualStart || 45;
    const gradualEvery = cfg.gradualEvery || 15;
    const gradualDue = seals.length
      && seals.some(seal => (seal.elapsed || 0) >= gradualStart)
      && (d.lastWeaponSealGradualReleaseT == null || (this.time || 0) - d.lastWeaponSealGradualReleaseT >= gradualEvery);
    if (gradualDue) {
      const oldest = seals.reduce((best, seal) => !best || (seal.elapsed || 0) > (best.elapsed || 0) ? seal : best, null);
      const idx = seals.indexOf(oldest);
      if (idx >= 0) {
        seals[idx] = seals[seals.length - 1];
        seals.pop();
        d.lastWeaponSealGradualReleaseT = this.time || 0;
        changed = true;
      }
    }
    if (changed) {
      this.bossDebuffs.weaponSeals = seals;
      this.slotsDirty = true;
      if (changed && typeof GameRuntime !== 'undefined') GameRuntime.banner(tr('boss.silence.release'), 'good');
    }
  },

  updateBossLinks(dt) {
    const links = this.bossLinks || [];
    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i];
      link.life -= dt;
      if (link.life <= 0) { links[i] = links[links.length - 1]; links.pop(); }
    }
  },

  updateBossCast(boss, dt) {
    const affixes = boss.bossAffixes || [];
    if (!affixes.length) return;
    if (boss.bossCast) {
      boss.bossCast.t -= dt;
      if (boss.bossCast.t <= 0) this.resolveBossCast(boss);
      return;
    }
    boss.bossAbilityT -= dt;
    if (boss.bossAbilityT > 0) return;
    const kind = affixes[boss.bossAbilityIndex++ % affixes.length];
    const telegraph = (CFG.endlessDevour && CFG.endlessDevour.telegraph) || 3;
    boss.bossCast = { kind, t: telegraph, max: telegraph, color: BossInteractions.color(kind) };
    boss.bossAbilityT = 10 + Math.min(6, affixes.length * 1.4);
    if (kind === 'devour') this.markBossDevourTargets(boss, telegraph);
    this.spawnText(boss.x, boss.y - boss.r - 24, tr('boss.casting', { name: BossInteractions.label(kind) }), true, BossInteractions.color(kind));
  },

  resolveBossCast(boss) {
    const cast = boss.bossCast;
    boss.bossCast = null;
    if (!cast) return;
    const handler = BossInteractionCastHandlers[cast.kind];
    if (handler) handler(this, boss);
  },

  startBossDropAbsorb(boss, duration) {
    this.clearExpiredBossDevourTargets(boss, true);
    boss.dropAbsorbT = Math.max(boss.dropAbsorbT || 0, duration);
    boss.devourHealThisCast = 0;
    boss.devourBombDamageThisCast = 0;
    boss.devourHealWindow = Array.isArray(boss.devourHealWindow) ? boss.devourHealWindow.filter(item => this.time - item.t < 60) : [];
    this.spawnText(boss.x, boss.y - boss.r - 24, tr('boss.devour.start'), true, BossInteractions.color('devour'));
    GameRuntime.banner(tr('boss.devour.banner'), 'warn');
  },

  applyDropSeal(boss, duration) {
    this.bossDebuffs.dropSealT = Math.max(this.bossDebuffs.dropSealT, duration);
    this.spawnText(this.player.x, this.player.y - 60, tr('boss.seal.start'), true, BossInteractions.color('seal'));
    this.spawnBossLink(boss.x, boss.y, this.player.x, this.player.y, BossInteractions.color('seal'), 0.8, tr('boss.seal.short'));
    GameRuntime.banner(tr('boss.seal.banner'), 'warn');
  },

  applyWeaponSilence(boss) {
    const count = this.weaponSealCountForBoss(boss);
    const duration = boss && boss.bossKind === 'mega' ? ((CFG.weaponSeals && CFG.weaponSeals.megaDuration) || 90) : ((CFG.weaponSeals && CFG.weaponSeals.normalDuration) || 70);
    const sealed = this.applyWeaponSeals(count, duration, boss && boss.bossKind === 'mega' ? 'mega' : 'normal');
    if (!sealed.length) return;
    const names = sealed.map(id => WEAPONS[id] && WEAPONS[id].name ? WEAPONS[id].name : id).join(', ');
    this.spawnText(this.player.x, this.player.y - 72, tr('boss.silence.multiStart', { count: sealed.length }), true, BossInteractions.color('silence'));
    this.spawnBossLink(boss.x, boss.y, this.player.x, this.player.y, BossInteractions.color('silence'), 0.9, tr('boss.silence.short'));
    GameRuntime.banner(tr('boss.silence.multiBanner', { count: sealed.length, names }), 'warn');
  },

  applyControlDistortion(boss, mode, duration) {
    this.bossDebuffs.controlMode = mode;
    this.bossDebuffs.controlT = Math.max(this.bossDebuffs.controlT, duration);
    this.bossDebuffs.controlAngle = mode === 'invert' ? Math.PI : (RNG.next() < 0.5 ? 0.85 : -0.85);
    this.spawnText(this.player.x, this.player.y - 82, tr(mode === 'invert' ? 'boss.distort.invert' : 'boss.distort.start'), true, BossInteractions.color('distort'));
    this.spawnBossLink(boss.x, boss.y, this.player.x, this.player.y, BossInteractions.color('distort'), 0.9, tr('boss.distort.short'));
    GameRuntime.banner(tr(mode === 'invert' ? 'boss.distort.invertBanner' : 'boss.distort.banner'), 'warn');
  },

  transformControlVector(mv) {
    this.ensureBossInteractionState();
    const d = this.bossDebuffs;
    if (!(d.controlT > 0) || !(mv.x || mv.y)) return mv;
    const a = d.controlMode === 'invert' ? Math.PI : d.controlAngle * clamp(d.controlT / 2.7, 0.35, 1);
    const ca = Math.cos(a), sa = Math.sin(a);
    return { x: mv.x * ca - mv.y * sa, y: mv.x * sa + mv.y * ca };
  },

  isWeaponSilenced(weapon) {
    this.ensureBossInteractionState();
    if (!weapon || !weapon.id) return false;
    const sealed = (this.bossDebuffs.weaponSeals || []).some(seal => seal && seal.id === weapon.id && seal.t > 0);
    return !!(sealed || (this.bossDebuffs.weaponSilenceT > 0 && this.bossDebuffs.weaponSilenceId === weapon.id));
  },

  updateBossDropAbsorb(boss, dt) {
    if (!(boss.dropAbsorbT > 0)) return;
    boss.dropAbsorbT = Math.max(0, boss.dropAbsorbT - dt);
    this.pullDropsToBoss(boss, dt);
    this.pullGemsToBoss(boss, dt);
    if (boss.dropAbsorbT <= 0) this.clearExpiredBossDevourTargets(boss, true);
  },

  spawnBossLink(x1, y1, x2, y2, color, life = 0.4, label = '') {
    if (this.test.noFx) return;
    this.ensureBossInteractionState();
    const links = this.bossLinks;
    const cap = this.isMobileRuntime && this.isMobileRuntime() ? 28 : 48;
    const link = links.length >= cap ? links[0] : {};
    link.x1 = x1; link.y1 = y1; link.x2 = x2; link.y2 = y2;
    link.color = color; link.life = life; link.maxLife = life; link.label = label;
    if (links.length >= cap) links[0] = links[links.length - 1];
    links[links.length >= cap ? links.length - 1 : links.length] = link;
  },
});
