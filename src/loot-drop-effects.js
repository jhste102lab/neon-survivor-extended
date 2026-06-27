'use strict';
// Drop effect registry, outcome planning, and side-effect application.
const LootDropEffects = {
  effects: {
    chicken: LootDropChickenEffect,
    magnet: LootDropMagnetEffect,
    bomb: LootDropBombEffect,
    chest: LootDropChestEffect,
  },

  plan(game, kind, opts = {}) {
    const effect = this.effects[kind];
    if (!effect || typeof effect.plan !== 'function') return [];
    return effect.plan(game, opts);
  },

  apply(game, kind, opts = {}) {
    this.applyOutcomes(game, this.plan(game, kind, opts));
  },

  applyOutcomes(game, outcomes = []) {
    for (const outcome of outcomes) this.applyOutcome(game, outcome);
  },

  applyOutcome(game, outcome) {
    if (!outcome || !outcome.type) return;
    if (outcome.type === 'damageVisibleEnemies') {
      this.damageVisibleEnemies(game, outcome.damage, outcome.source);
    } else if (outcome.type === 'healPlayer') {
      const before = game.player.hp;
      game.player.hp = Math.min(game.stat().maxHp, game.player.hp + outcome.amount);
      if (game.metrics) {
        const actual = Math.max(0, game.player.hp - before);
        game.metrics.healingBySource = game.metrics.healingBySource || {};
        const source = outcome.source || 'heal';
        game.metrics.healingBySource[source] = (game.metrics.healingBySource[source] || 0) + actual;
        game.metrics.healingTotal = (game.metrics.healingTotal || 0) + actual;
      }
    } else if (outcome.type === 'spawnText') {
      game.spawnText(outcome.x, outcome.y, outcome.text, !!outcome.crit, outcome.color);
    } else if (outcome.type === 'magnetizeGems') {
      this.magnetizeGems(game, outcome);
    } else if (outcome.type === 'openChest') {
      game.openChest();
    } else if (outcome.type === 'sound') {
      GameRuntime.playSound(outcome.name, ...(outcome.args || []));
    } else if (outcome.type === 'flash') {
      GameRuntime.flashEffect(outcome.id, outcome.duration);
    } else if (outcome.type === 'shake') {
      game.shake(outcome.amount, outcome.duration);
    }
  },

  magnetizeGems(game, outcome) {
    const gems = game.gems || [];
    const late = game.time >= CFG.winTime;
    const motionLimit = Math.max(1, Math.round(late ? Math.min(30, outcome.motionLimit || 30) : (outcome.motionLimit || gems.length || 1)));
    if (late && typeof game.settleAllLateGems === 'function' && gems.length > motionLimit) {
      // Keep a small visible pull for reward feel, then bank distant XP immediately to clear projectile visibility.
    }
    if (gems.length <= motionLimit) {
      for (const gem of gems) { gem.mag = true; gem.ms = outcome.speed; }
      return;
    }

    const p = game.player || { x: 0, y: 0 };
    const ranked = gems.map((gem, index) => ({ gem, index, d2: dist2(gem.x, gem.y, p.x, p.y) }))
      .sort((a, b) => a.d2 - b.d2);
    const keep = new Set(ranked.slice(0, motionLimit).map(item => item.gem));
    const motionGems = [];
    let xp = 0;
    for (const gem of gems) {
      if (game.canRemoteCollectPickup && !game.canRemoteCollectPickup(gem)) continue;
      if (keep.has(gem)) {
        gem.mag = true;
        gem.ms = outcome.speed;
        motionGems.push(gem);
      } else {
        xp += gem.v || 0;
      }
    }
    gems.length = 0;
    gems.push(...motionGems);
    if (xp > 0) {
      if (game.time >= CFG.winTime && typeof game.grantLateNormalXp === 'function') xp = Math.max(1, Math.round(xp * game.lateXpScale()));
      if (typeof game.addXp === 'function') game.addXp(xp);
      if (typeof game.spawnText === 'function') game.spawnText(p.x, p.y - 44, `+${Math.round(xp)} XP`, false, '#41f0ff');
      if (typeof game.spawnBurst === 'function') game.spawnBurst(p.x, p.y, '#41f0ff', Math.min(12, Math.max(4, Math.round(motionLimit / 10))), 120, 3, 0.22);
    }
  },

  damageVisibleEnemies(game, damage, source) {
    const view = GameRuntime.viewportHalf(100);
    const W = view.w, H = view.h;
    if (game.metrics) game.metrics.bombsUsed = (game.metrics.bombsUsed || 0) + 1;
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];
      if (Math.abs(e.x - game.cam.x) < W && Math.abs(e.y - game.cam.y) < H) {
        let dealt = damage;
        if (e && e.boss && game.time >= CFG.winTime) {
          const cfg = CFG.lateBalance || {};
          const scaled = Math.round(damage * (cfg.bombBossDamageScale || 0.35));
          const cap = e.bossDef && e.bossDef.mega ? 900 : 650;
          const floor = Math.min(cap, Math.round((e.maxHp || 1) * 0.006));
          dealt = Math.max(scaled, floor);
          markBossVulnerable(e, 1.2, 0.18);
        }
        game.damageEnemy(e, dealt, 0, 0, source);
      }
    }
  },
};
