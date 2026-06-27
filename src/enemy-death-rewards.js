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

  function spawnXpGems(game, e, value = rewardXpValue(e)) {
    let v = Math.max(0, Math.round(value));
    while (v > 0) {
      let tier, tv;
      if (v >= 25) { tier = 2; tv = 25; } else if (v >= 5) { tier = 1; tv = 5; } else { tier = 0; tv = 1; }
      v -= tv;
      game.spawnGem(e.x + rand(-14, 14), e.y + rand(-14, 14), tv, tier);
    }
  }

  function grantOrSpawnXp(game, e) {
    const value = rewardXpValue(e);
    const lateDirect = game.lateXpStarted && game.lateXpStarted() && !e.boss && !e.elite;
    if (!lateDirect) {
      spawnXpGems(game, e, value);
      return;
    }
    game.grantLateNormalXp(value, e.type || 'normal');
  }

  function grantBossRewards(game, e) {
    if (game.releaseWeaponSeals) game.releaseWeaponSeals('bossKill');
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


  function lateDropScale(game, kind, e) {
    const cfg = CFG.lateBalance || {};
    if (!game || game.time < (cfg.dropRampStart || CFG.winTime)) return 1;
    const k = clamp((game.time - (cfg.dropRampStart || CFG.winTime)) / Math.max(1, (cfg.dropRampEnd || CFG.winTime + 360) - (cfg.dropRampStart || CFG.winTime)), 0, 1);
    let scale = 1;
    if (kind === 'chicken') {
      scale = lerp(cfg.chickenBaseScale10 || 0.70, cfg.chickenBaseScale16 || 0.48, k);
      const st = game.st || (typeof game.stat === 'function' ? game.stat() : null);
      const maxHp = st && st.maxHp ? st.maxHp : CFG.player.hp;
      const hpRatio = game.player && maxHp ? game.player.hp / maxHp : 1;
      if (hpRatio >= 0.8) scale *= cfg.chickenDropHighHpScale || 0.30;
      else if (hpRatio <= 0.35) scale *= cfg.chickenDropLowHpScale || 1.15;
    } else if (kind === 'magnet') {
      scale = lerp(cfg.magnetBaseScale10 || 0.72, cfg.magnetBaseScale16 || 0.55, k);
    } else if (kind === 'bomb') {
      scale = lerp(cfg.bombBaseScale10 || 0.62, cfg.bombBaseScale16 || 0.42, k);
    }
    if (String(e && e.lastHitSource || '').startsWith('drop:bomb')) scale *= cfg.bombKillDropScale || 0.25;
    return Math.max(0, scale);
  }

  function maybeRecordDropRoll(game, kind, spawned) {
    if (!game.metrics) return;
    const key = spawned ? 'dropsSpawned' : 'dropsDenied';
    game.metrics[key] = game.metrics[key] || {};
    game.metrics[key][kind] = (game.metrics[key][kind] || 0) + 1;
  }

  function maybeDropOneNormalEnemyReward(game, e) {
    const luck = game.st ? game.st.luck : 1;
    const dropLuck = Math.min(2.2, luck);
    const dropScale = game.itemDropScale ? game.itemDropScale() : 1;
    const dropMul = (e.special ? 1.75 : 1) * dropScale;
    const rates = CFG.itemDropRate || {};
    const roll = RNG.next();
    const chickenT = (rates.chicken || 0.045) * dropLuck * dropMul * lateDropScale(game, 'chicken', e);
    const magnetT = chickenT + (rates.magnet || 0.024) * dropLuck * dropMul * lateDropScale(game, 'magnet', e);
    const bombT = magnetT + (rates.bomb || 0.020) * dropLuck * dropMul * lateDropScale(game, 'bomb', e);
    const specialChestT = bombT + (e.special ? (rates.specialChest || 0.030) * dropLuck * dropScale : 0);
    if (roll < chickenT) { maybeRecordDropRoll(game, 'chicken', true); game.spawnDrop('chicken', e.x, e.y); }
    else if (roll < magnetT) { maybeRecordDropRoll(game, 'magnet', true); game.spawnDrop('magnet', e.x, e.y); }
    else if (roll < bombT) { maybeRecordDropRoll(game, 'bomb', true); game.spawnDrop('bomb', e.x, e.y); }
    else if (roll < specialChestT) { maybeRecordDropRoll(game, 'chest', true); game.spawnDrop('chest', e.x, e.y, CFG.dropLife.chest); }
    else if (game.time >= ((CFG.lateBalance && CFG.lateBalance.dropRampStart) || CFG.winTime)) maybeRecordDropRoll(game, 'none', false);
  }

  function maybeDropNormalEnemyRewards(game, e) {
    const rolls = Math.min(rewardStackCount(e), 18);
    for (let i = 0; i < rolls; i++) maybeDropOneNormalEnemyReward(game, e);
  }

  Object.assign(Game, {
    grantEnemyDeathRewards(e) {
      grantOrSpawnXp(this, e);

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
