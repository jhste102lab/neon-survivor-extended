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
    const count = Math.min(NORMAL_AFFIXES.length, Math.max(1, Math.floor(tier || 1)));
    return NORMAL_AFFIXES.slice(0, count);
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
  devour(game, boss) { game.startBossDropAbsorb(boss, 5.8); },
  seal(game, boss) { game.applyDropSeal(boss, 7.2); },
  silence(game, boss) { game.applyWeaponSilence(boss, boss.bossKind === 'mega' ? 5.2 : 4.4); },
  distort(game, boss) { game.applyControlDistortion(boss, boss.bossKind === 'mega' && game.time >= CFG.winTime + 540 ? 'invert' : 'swirl', boss.bossKind === 'mega' ? 2.7 : 2.2); },
});
const BOSS_DROP_HEAL = Object.freeze({ chest: 760, chicken: 420, bomb: 260 });
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
      };
    }
    if (!this.bossLinks) this.bossLinks = [];
  },

  resetBossInteractionState() {
    this.bossDebuffs = { controlT: 0, controlMode: '', controlAngle: 0, dropSealT: 0, weaponSilenceT: 0, weaponSilenceId: '' };
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
    boss.dropAbsorbT = boss.bossAffixes.includes('devour') ? 2.8 : 0;
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
    const hpGain = boss.maxHp * energy.gain;
    boss.maxHp += hpGain;
    boss.hp += hpGain;
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
    if (d.controlT <= 0) d.controlMode = '';
    if (d.weaponSilenceT <= 0) d.weaponSilenceId = '';
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
    boss.bossCast = { kind, t: 1.05, max: 1.05, color: BossInteractions.color(kind) };
    boss.bossAbilityT = 10 + Math.min(6, affixes.length * 1.4);
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
    boss.dropAbsorbT = Math.max(boss.dropAbsorbT || 0, duration);
    this.spawnText(boss.x, boss.y - boss.r - 24, tr('boss.devour.start'), true, BossInteractions.color('devour'));
    GameRuntime.banner(tr('boss.devour.banner'), 'warn');
  },

  applyDropSeal(boss, duration) {
    this.bossDebuffs.dropSealT = Math.max(this.bossDebuffs.dropSealT, duration);
    this.spawnText(this.player.x, this.player.y - 60, tr('boss.seal.start'), true, BossInteractions.color('seal'));
    this.spawnBossLink(boss.x, boss.y, this.player.x, this.player.y, BossInteractions.color('seal'), 0.8, tr('boss.seal.short'));
    GameRuntime.banner(tr('boss.seal.banner'), 'warn');
  },

  applyWeaponSilence(boss, duration) {
    const choices = (this.player.weapons || []).filter(w => w && w.id && w.id !== 'bolt');
    const fallback = (this.player.weapons || []).filter(w => w && w.id);
    const target = choices.length ? pick(choices) : pick(fallback);
    if (!target) return;
    this.bossDebuffs.weaponSilenceId = target.id;
    this.bossDebuffs.weaponSilenceT = Math.max(this.bossDebuffs.weaponSilenceT, duration);
    const name = WEAPONS[target.id] && WEAPONS[target.id].name ? WEAPONS[target.id].name : target.id;
    this.spawnText(this.player.x, this.player.y - 72, tr('boss.silence.start', { name }), true, BossInteractions.color('silence'));
    this.spawnBossLink(boss.x, boss.y, this.player.x, this.player.y, BossInteractions.color('silence'), 0.9, tr('boss.silence.short'));
    GameRuntime.banner(tr('boss.silence.banner', { name }), 'warn');
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
    return !!(weapon && this.bossDebuffs.weaponSilenceT > 0 && this.bossDebuffs.weaponSilenceId === weapon.id);
  },

  updateBossDropAbsorb(boss, dt) {
    if (!(boss.dropAbsorbT > 0)) return;
    boss.dropAbsorbT = Math.max(0, boss.dropAbsorbT - dt);
    this.pullDropsToBoss(boss, dt);
    this.pullGemsToBoss(boss, dt);
  },

  pullDropsToBoss(boss, dt) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (dist2(d.x, d.y, boss.x, boss.y) > 620 * 620) continue;
      this.pullPickupToBoss(d, boss, dt, 250, 'drop');
      if (dist2(d.x, d.y, boss.x, boss.y) < Math.max(34, boss.r * 0.55) ** 2) {
        const heal = this.bossDropHealValue(d);
        LootOutcomes.removeAt(this.drops, i);
        this.healBossFromAbsorb(boss, heal, d.x, d.y, tr('boss.heal', { value: Math.round(heal) }));
      }
    }
  },

  pullGemsToBoss(boss, dt) {
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (dist2(g.x, g.y, boss.x, boss.y) > 520 * 520) continue;
      this.pullPickupToBoss(g, boss, dt, 210, 'gem');
      if (dist2(g.x, g.y, boss.x, boss.y) < Math.max(30, boss.r * 0.5) ** 2) {
        const heal = Math.min(220, 32 + (g.v || 1) * 12);
        LootOutcomes.removeAt(this.gems, i);
        this.healBossFromAbsorb(boss, heal, g.x, g.y, tr('boss.heal', { value: Math.round(heal) }));
      }
    }
  },

  pullPickupToBoss(item, boss, dt, speed, type) {
    const dx = boss.x - item.x, dy = boss.y - item.y;
    const d = Math.hypot(dx, dy) || 1;
    item.x += dx / d * speed * dt;
    item.y += dy / d * speed * dt;
    item.bossPull = true;
    item.bossPullT = 0.35;
    item.bossPullFxT = (item.bossPullFxT || 0) - dt;
    if (item.bossPullFxT <= 0) {
      item.bossPullFxT = 0.22;
      this.spawnBossLink(item.x, item.y, boss.x, boss.y, type === 'gem' ? '#3dff8e' : BossInteractions.color('devour'), 0.28, '');
    }
  },

  bossDropHealValue(drop) {
    const stack = Math.max(1, Number(drop.stack || 1));
    return (BOSS_DROP_HEAL[drop.kind] || 220) * stack;
  },

  healBossFromAbsorb(boss, heal, x, y, text) {
    boss.hp = Math.min(boss.maxHp, boss.hp + heal);
    boss.absorbCount = (boss.absorbCount || 0) + 1;
    this.spawnText(x, y - 16, text, false, '#7dffc1');
    this.spawnBossLink(x, y, boss.x, boss.y, '#7dffc1', 0.32, '');
    if (this.boss === boss) GameRuntime.updateBossBar(boss);
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
