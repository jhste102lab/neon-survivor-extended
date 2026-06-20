'use strict';
// Pure director spawn and boss scheduling policies. Side-effect modules apply the returned decisions.
const DirectorSpawnPolicy = {
  normalContext(input) {
    const time = Number(input.time || 0);
    const winTime = Number(input.winTime || 0);
    const dropTaperStart = Number(input.dropTaperStart || 360);
    return {
      time,
      endless: !!input.endless,
      endlessT: Math.max(0, time - winTime),
      pressureT: Math.max(0, time - dropTaperStart),
      threat: Number(input.threat || 0),
      eventMul: Number(input.eventMul || 1),
      mobileMul: Number(input.mobileMul || 1),
      winTime,
    };
  },

  normalSpawnDelay(context) {
    const pressureDelay = Math.min(0.34, context.pressureT * 0.00034);
    const baseDelay = context.endless
      ? Math.max(0.11, 0.28 - context.endlessT * 0.00016)
      : Math.max(0.18, 1.05 - context.time * 0.00125 - pressureDelay);
    const pressureMul = 1 + Math.min(0.72, context.pressureT / 420 * 0.36);
    const loopPressure = context.time >= context.winTime ? 1.35 + Math.min(0.75, context.endlessT / 900) : 1;
    return baseDelay / (context.eventMul * pressureMul * loopPressure * (1 + Math.min(0.55, context.threat * 0.055)) * context.mobileMul);
  },

  normalBatchSize(context) {
    const baseBatch = context.endless
      ? 1 + Math.floor(context.winTime / 35) + Math.floor(context.endlessT / 95)
      : 1 + Math.floor(context.time / 36) + Math.floor(context.pressureT / 150);
    const pressureBatch = 1 + Math.min(0.46, context.pressureT / 600 * 0.32);
    const loopBatch = context.time >= context.winTime ? 1.28 + Math.min(0.55, context.endlessT / 1000) : 1;
    return Math.ceil(baseBatch * pressureBatch * loopBatch * Math.min(1.26, context.eventMul) * context.mobileMul);
  },

  swarmBurstPlan(input) {
    const time = Number(input.time || 0);
    if (time <= 70) return { spawn: false, resetDelay: 0, count: 0 };
    const loopMul = time >= input.winTime ? 1.45 + Math.min(0.5, (time - input.winTime) / 1000) : 1;
    const count = Math.min(Math.ceil(input.rollCount * loopMul), Math.max(0, input.room || 0));
    return { spawn: count > 0, resetDelay: input.resetDelay, count, type: 'swarm' };
  },

  eliteDelay(input) {
    const late = Math.max(0, input.time - input.winTime);
    return input.endless
      ? Math.max(input.time > input.winTime + 240 ? 18 : 24, 34 - late / 90)
      : Math.max(24, 50 / (1 + input.threat * 0.12));
  },

  scheduledBossIndex(input) {
    const bossTimes = input.bossTimes || [180, 360, 540];
    if (input.bossIdx >= bossTimes.length || input.time < bossTimes[input.bossIdx] || input.hasBoss) return -1;
    return input.bossIdx;
  },

  shouldSpawnMegaBoss(input) {
    const spawned = Math.max(0, input.spawned || 0);
    const nextMegaT = input.winTime * (spawned + 1);
    return !input.playerDead && input.time >= nextMegaT ? spawned + 1 : 0;
  },

  shouldSpawnEndlessBoss(input) {
    const bossTimes = input.bossTimes || [180, 360, 540];
    if (!input.endless || input.bossIdx < bossTimes.length) return false;
    if (input.activeEvent) return false;
    return input.activeBossCount < input.bossCap;
  },

  endlessBossDelay(input) {
    const endlessT = Math.max(0, input.time - input.winTime);
    return Math.max(72, 88 - endlessT / 120);
  },

  endlessBossTier(input) {
    return Math.max(1, 1 + Math.floor(Math.max(0, input.time - input.winTime) / 300));
  },

  endlessBossPatternPatch(baseDef, tier, pickFn = pick) {
    const patch = { endlessTier: tier };
    const picks = ['ring'];
    if (tier >= 2) picks.push('summon');
    if (tier >= 3) picks.push('trap');
    if (tier >= 4) picks.push('lane');
    if (tier >= 5) picks.push('denseRing');

    const count = Math.min(picks.length, 1 + Math.floor((tier - 1) / 2));
    for (let i = 0; i < count; i++) {
      const selected = pickFn(picks);
      picks.splice(picks.indexOf(selected), 1);
      this.applyEndlessBossPatternPatch(patch, baseDef, selected, tier, pickFn);
    }
    return patch;
  },

  applyEndlessBossPatternPatch(patch, baseDef, pattern, tier, pickFn = pick) {
    if (pattern === 'ring') {
      patch.ring = true;
      patch.ringN = Math.max(patch.ringN || 0, (baseDef.ringN || 8) + Math.min(8, tier));
      patch.ringCd = Math.min(patch.ringCd || 99, Math.max(3.4, (baseDef.ringCd || 5.7) - tier * 0.16));
      patch.ringGap = Math.max(patch.ringGap || 0, tier >= 3 ? 2 : 1);
    } else if (pattern === 'denseRing') {
      patch.ring = true;
      patch.ringN = Math.max(patch.ringN || 0, (baseDef.ringN || 10) + Math.min(12, tier + 4));
      patch.ringCd = Math.min(patch.ringCd || 99, Math.max(3.0, (baseDef.ringCd || 5.4) - tier * 0.18));
      patch.ringGap = Math.max(patch.ringGap || 0, 2);
    } else if (pattern === 'summon') {
      patch.summon = baseDef.summon || pickFn(['runner', 'swarm', 'mite']);
      patch.summonN = Math.max(patch.summonN || 0, (baseDef.summonN || 2) + Math.min(6, Math.floor(tier / 2)));
      patch.summonCd = Math.min(patch.summonCd || 99, Math.max(5.0, (baseDef.summonCd || 8.5) - tier * 0.13));
    } else if (pattern === 'trap') {
      patch.trap = true;
      patch.trapCd = Math.min(patch.trapCd || 99, Math.max(5.2, 8.2 - tier * 0.18));
    } else if (pattern === 'lane') {
      patch.laneTrap = true;
      patch.laneCd = Math.min(patch.laneCd || 99, Math.max(5.8, 9.4 - tier * 0.18));
    }
  },
};
globalThis.DirectorSpawnPolicy = DirectorSpawnPolicy;
