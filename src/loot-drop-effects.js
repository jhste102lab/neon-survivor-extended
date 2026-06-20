'use strict';
// Drop effect registry, outcome planning, and side-effect application.
const LootDropEffects = {
  effects: {
    chicken: LootDropChickenEffect,
    magnet: LootDropMagnetEffect,
    bomb: LootDropBombEffect,
    chest: LootDropChestEffect,
  },

  plan(game, kind) {
    const effect = this.effects[kind];
    if (!effect || typeof effect.plan !== 'function') return [];
    return effect.plan(game);
  },

  apply(game, kind) {
    this.applyOutcomes(game, this.plan(game, kind));
  },

  applyOutcomes(game, outcomes = []) {
    for (const outcome of outcomes) this.applyOutcome(game, outcome);
  },

  applyOutcome(game, outcome) {
    if (!outcome || !outcome.type) return;
    if (outcome.type === 'damageVisibleEnemies') {
      this.damageVisibleEnemies(game, outcome.damage, outcome.source);
    } else if (outcome.type === 'healPlayer') {
      game.player.hp = Math.min(game.stat().maxHp, game.player.hp + outcome.amount);
    } else if (outcome.type === 'spawnText') {
      game.spawnText(outcome.x, outcome.y, outcome.text, !!outcome.crit, outcome.color);
    } else if (outcome.type === 'magnetizeGems') {
      for (const gem of game.gems) { gem.mag = true; gem.ms = outcome.speed; }
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

  damageVisibleEnemies(game, damage, source) {
    const view = GameRuntime.viewportHalf(100);
    const W = view.w, H = view.h;
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];
      if (Math.abs(e.x - game.cam.x) < W && Math.abs(e.y - game.cam.y) < H) {
        game.damageEnemy(e, damage, 0, 0, source);
      }
    }
  },
};
