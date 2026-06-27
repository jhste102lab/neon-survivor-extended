'use strict';
// Enemy stat scaling policy for regular and elite enemies.
const EnemyFactoryScaling = Object.freeze({
  enemyScalingContext(game) {
    const t = game.time;
    const st = game.st || (typeof game.stat === 'function' ? game.stat() : null);
    return {
      t,
      endlessT: Math.max(0, t - CFG.winTime),
      pressureT: Math.max(0, t - (CFG.dropTaperStart || 360)),
      threat: game.lateThreat ? game.lateThreat() : 0,
      endless: game.endless,
      playerSpeed: st && st.spd ? st.spd : CFG.player.speed,
    };
  },

  enemyHpMultiplier(context, elite) {
    const endlessMul = context.endless
      ? 1 + context.endlessT / 180 * 0.45 + Math.pow(context.endlessT / 720, 1.25) * 0.35
      : 1;
    const pressureMul = 1 + context.threat * (elite ? 0.30 : 0.42);
    const lateRebalance = context.t >= CFG.winTime ? 1 + Math.min(0.20, context.endlessT / 360 * 0.12 + 0.08) : 1;
    return (1 + context.t / 95 * 0.45) * (elite ? 6.2 : 1) * endlessMul * pressureMul * (elite ? 1 : lateRebalance);
  },

  enemySpeedMultiplier(context, elite, def) {
    const preLoop = Math.min(0.42, context.t / 600 * 0.18 + context.threat * 0.04);
    const pressureRamp = Math.min(0.72, context.pressureT / 480 * 0.42 + context.threat * 0.045);
    const loopKick = context.t >= CFG.winTime ? 0.26 : 0;
    const rebalanceKick = context.t >= CFG.winTime ? Math.min(0.20, 0.08 + context.endlessT / 360 * 0.12) : 0;
    const endlessRamp = Math.min(0.48, context.endlessT / 900 * 0.34 + context.threat * 0.035 + rebalanceKick);
    const raw = (1 + preLoop + pressureRamp + loopKick + endlessRamp) * (elite ? 0.92 : 1);
    const maxSpeed = context.playerSpeed * (elite ? 1.05 : 1.00);
    return Math.min(raw, maxSpeed / Math.max(1, def.spd));
  },

  enemyDamageMultiplier(context) {
    return 1 + Math.min(2.8, context.t / 460 + context.endlessT / 1400 + context.threat * 0.18);
  },

  enemyStats(game, def, elite) {
    const context = EnemyFactoryScaling.enemyScalingContext(game);
    const hp = def.hp * EnemyFactoryScaling.enemyHpMultiplier(context, elite);
    return {
      r: def.r * (elite ? 1.55 : 1),
      hp,
      maxHp: hp,
      spd: def.spd * EnemyFactoryScaling.enemySpeedMultiplier(context, elite, def),
      dmg: def.dmg * EnemyFactoryScaling.enemyDamageMultiplier(context),
      xp: def.xp * (elite ? 8 : 1),
    };
  },
});

