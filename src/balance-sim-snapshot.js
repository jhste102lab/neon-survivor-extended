'use strict';
// Snapshot, result, and batch summary helpers for BalanceSim.
Object.assign(BalanceSim, {
  buildResult({ cfg, started, capTicks, activeTicks, winSeen, endlessSeen, upgrades, samples }) {
    return {
      cfg,
      survived: !Game.player.dead,
      state: Game.state,
      time: Game.time,
      winSeen,
      endlessSeen,
      level: Game.player.level,
      kills: Game.kills,
      hp: Math.round(Game.player.hp),
      maxHp: Game.stat().maxHp,
      enemies: Game.enemies.length,
      bullets: Game.bullets.length,
      enemyBullets: Game.ebullets.length,
      gems: Game.gems.length,
      capShare: capTicks / Math.max(1, activeTicks),
      weapons: Game.player.weapons.map(w => `${w.id}:${w.lv}`),
      passives: { ...Game.player.passives },
      transcend: { ...Game.player.transcend },
      companions: { ...Game.player.companions, trail: undefined, nodes: undefined },
      evolved: Object.keys(Game.player.evolved || {}),
      metrics: JSON.parse(JSON.stringify(Game.metrics || {})),
      upgrades,
      samples,
      runtimeMs: Math.round(performance.now() - started),
    };
  },

  summarizeBatch(opts, seeds, runs) {
    const avg = key => runs.reduce((sum, r) => sum + r[key], 0) / runs.length;
    const avgMetric = (fn) => runs.reduce((sum, r) => sum + fn(r), 0) / runs.length;
    return {
      opts: { ...opts, seeds },
      runs,
      summary: {
        count: runs.length,
        clearRate10: runs.filter(r => r.winSeen || r.time >= CFG.winTime).length / runs.length,
        aliveRateEnd: runs.filter(r => r.survived).length / runs.length,
        avgTime: avg('time'),
        avgKills: avg('kills'),
        avgLevel: avg('level'),
        avgCapShare: avg('capShare'),
        avgBossKills: avgMetric(r => (r.metrics && r.metrics.bossesKilled) || 0),
        avgEvo: avgMetric(r => (r.evolved || []).length),
        avgRoles: avgMetric(r => (r.companions && r.companions.roles ? r.companions.roles.length : 0)),
        avgRuntimeMs: avg('runtimeMs'),
      },
    };
  },

  snapshot() {
    const st = Game.stat();
    return {
      t: Math.round(Game.time),
      state: Game.state,
      hp: Math.round(Game.player.hp),
      maxHp: st.maxHp,
      level: Game.player.level,
      kills: Game.kills,
      enemies: Game.enemies.length,
      gems: Game.gems.length,
      ebullets: Game.ebullets.length,
      weapons: Game.player.weapons.map(w => `${w.id}:${w.lv}`),
      companions: Game.player.companions ? { count: Game.player.companions.count, roles: [...(Game.player.companions.roles || [])] } : null,
      evolved: Object.keys(Game.player.evolved || {}),
      hazards: Game.hazards ? Game.hazards.length : 0,
    };
  },
});
