'use strict';
// Loot entity policies and outcome application separated from entity iteration.
const LootOutcomes = {
  stackableDrop(kind) {
    return kind === 'chicken' || kind === 'magnet' || kind === 'bomb';
  },

  dropStack(drop) {
    return Math.max(1, Math.min(CFG.maxDropStack || 3, Math.round(Number(drop && drop.stack) || 1)));
  },

  mergeGemValue(gem, value) {
    gem.v += value;
    if (gem.v >= 25) gem.tier = 2;
    else if (gem.v >= 5) gem.tier = Math.max(gem.tier, 1);
  },

  removeAt(items, index) {
    items[index] = items[items.length - 1];
    items.pop();
  },

  trimDropIndex(drops, player, incomingBoss = false) {
    let remove = -1;
    let bestScore = -Infinity;
    const p = player || { x: 0, y: 0 };
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.boss && !incomingBoss) continue;
      const common = d.kind === 'chicken' || d.kind === 'magnet' || d.kind === 'bomb';
      const distScore = dist2(p.x, p.y, d.x, d.y) * 0.00001;
      const ageScore = d.maxLife ? (1 - d.life / d.maxLife) : 0;
      const score = (common ? 4 : 0) + ageScore + distScore - (d.boss ? 20 : 0);
      if (score > bestScore) { bestScore = score; remove = i; }
    }
    return remove < 0 ? 0 : remove;
  },

  gemCollectOutcome(gem, player, combo) {
    return {
      type: 'collectGem',
      xp: gem.v,
      sound: { name: 'gem', args: [combo] },
      burst: { x: player.x, y: player.y, color: ['#3dff8e', '#19a8ff', '#d44dff'][gem.tier], count: 2, speed: 80, size: 3, life: 0.2 },
    };
  },

  dropOutcome(kind, drop = null) {
    return { type: 'collectDrop', kind, stack: this.dropStack(drop) };
  },

  applyAll(game, outcomes = []) {
    for (const outcome of outcomes) this.apply(game, outcome);
  },

  apply(game, outcome) {
    if (!outcome || !outcome.type) return;
    if (outcome.type === 'collectGem') {
      game.addXp(outcome.xp);
      if (outcome.sound) GameRuntime.playSound(outcome.sound.name, ...(outcome.sound.args || []));
      if (outcome.burst) game.spawnBurst(outcome.burst.x, outcome.burst.y, outcome.burst.color, outcome.burst.count, outcome.burst.speed, outcome.burst.size, outcome.burst.life);
    } else if (outcome.type === 'collectDrop') {
      if (game.metrics) {
        game.metrics.dropsCollected = game.metrics.dropsCollected || {};
        game.metrics.dropsCollected[outcome.kind] = (game.metrics.dropsCollected[outcome.kind] || 0) + (outcome.stack || 1);
      }
      LootDropEffects.apply(game, outcome.kind, { stack: outcome.stack || 1 });
    } else if (outcome.type === 'dropExpired') {
      game.metrics.dropsExpired = (game.metrics.dropsExpired || 0) + 1;
    } else if (outcome.type === 'dropTrimmed') {
      game.metrics.dropsTrimmed = (game.metrics.dropsTrimmed || 0) + 1;
    }
  },
};
