'use strict';
// Enemy death reward policy: XP gems, item drops, and boss reward aftermath.
(function attachEnemyDeathRewards() {
  function rewardStackCount(e) {
    return Math.max(1, Math.floor(Number(e && e.stackCount) || 1));
  }

  function rewardXpValue(e) {
    const count = rewardStackCount(e);
    const unitXp = Math.max(0, Number(e && e.stackUnitXp) || Number(e && e.xp) || 0);
    return Math.round(unitXp * count);
  }

  function spawnXpGems(game, e) {
    let v = rewardXpValue(e);
    while (v > 0) {
      let tier, tv;
      if (v >= 25) { tier = 2; tv = 25; } else if (v >= 5) { tier = 1; tv = 5; } else { tier = 0; tv = 1; }
      v -= tv;
      game.spawnGem(e.x + rand(-14, 14), e.y + rand(-14, 14), tv, tier);
    }
  }

  function grantBossRewards(game, e) {
    game.spawnDrop('chest', e.x, e.y, CFG.dropLife.bossChest, true);
    if (e.bossDef && e.bossDef.mega) game.spawnDrop('chest', e.x, e.y + 46, CFG.dropLife.bossChest, true);
    game.spawnDrop('chicken', e.x + 40, e.y);
    game.spawnDrop('magnet', e.x - 40, e.y);
    if (game.boss === e) {
      game.boss = game.enemies.find(x => x.boss) || null;
      if (game.boss) GameRuntime.showBossBar(game.boss.bossDef.name);
      else GameRuntime.hideBossBar();
    }
    GameRuntime.banner(tr('banner.bossKill', { name: e.bossDef.name }), 'good');
    game.hitStop(0.4, 0.08);
    game.shake(12, 0.7);
    GameRuntime.playSound('chest');
  }

  function maybeDropOneNormalEnemyReward(game, e) {
    const luck = game.st ? game.st.luck : 1;
    const dropLuck = Math.min(2.2, luck);
    const dropScale = game.itemDropScale ? game.itemDropScale() : 1;
    const dropMul = (e.special ? 1.75 : 1) * dropScale;
    const rates = CFG.itemDropRate || {};
    const roll = RNG.next();
    const chickenT = (rates.chicken || 0.045) * dropLuck * dropMul;
    const magnetT = chickenT + (rates.magnet || 0.024) * dropLuck * dropMul;
    const bombT = magnetT + (rates.bomb || 0.020) * dropLuck * dropMul;
    const specialChestT = bombT + (e.special ? (rates.specialChest || 0.030) * dropLuck * dropScale : 0);
    if (roll < chickenT) game.spawnDrop('chicken', e.x, e.y);
    else if (roll < magnetT) game.spawnDrop('magnet', e.x, e.y);
    else if (roll < bombT) game.spawnDrop('bomb', e.x, e.y);
    else if (roll < specialChestT) game.spawnDrop('chest', e.x, e.y, CFG.dropLife.chest);
  }

  function maybeDropNormalEnemyRewards(game, e) {
    const rolls = Math.min(rewardStackCount(e), 18);
    for (let i = 0; i < rolls; i++) maybeDropOneNormalEnemyReward(game, e);
  }

  Object.assign(Game, {
    grantEnemyDeathRewards(e) {
      spawnXpGems(this, e);

      if (e.boss) {
        grantBossRewards(this, e);
      } else if (e.elite) {
        this.spawnDrop('chest', e.x, e.y);
      } else if (e.type !== 'swarm') {
        maybeDropNormalEnemyRewards(this, e);
      }
    },
  });
})();
