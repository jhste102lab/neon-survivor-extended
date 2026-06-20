'use strict';
// Upgrade draining and selection policies for BalanceSim.
Object.assign(BalanceSim, {
  drainUpgrades(policyName, applied) {
    let guard = 0;
    while (Game.levelQueue > 0 && !Game.player.dead && guard++ < 80) {
      const choices = UpgradeRules.generateChoices(Game);
      if (!choices.length) break;
      const choice = this.pickUpgrade(choices, policyName);
      const result = Game.applyUpgrade(choice);
      if (!result) break;
      applied.push({ t: Math.round(Game.time), kind: result.kind, id: result.id || 'heal' });
      Game.levelQueue--;
    }
  },

  pickUpgrade(choices, policyName) {
    if (policyName === 'random') return pick(choices);
    const scoreWeapon = {
      missile: 110, lightning: 102, laser: 96, orbital: 94, railgun: 93, lance: 92, nova: 90,
      blackhole: 89, satlaser: 88, boomerang: 84, icespear: 82, phoenix: 81,
      ricochet: 80, shotgun: 79, bolt: 78, toxic: 76, timerift: 75, drone: 74, sonic: 73,
      orbit: 72, chainsaw: 71, shockmine: 70, arrowrain: 69, frost: 68,
    };
    const scorePassive = { power: 105, haste: 100, wisdom: 92, magnet: 86, boots: 78, vitality: 72, regen: 64, luck: 58 };
    const scoreTrans = { tdmg: 105, tcd: 98, tspd: 78, thp: 70 };
    let best = choices[0], bestScore = -Infinity;
    for (const c of choices) {
      let s = 0;
      if (c.kind === 'nw') s = (Game.endless ? 130 : 75) + (scoreWeapon[c.id] || 0) * 0.2;
      else if (c.kind === 'w') s = 85 + (scoreWeapon[c.id] || 0);
      else if (c.kind === 'ow') s = 70 + (scoreWeapon[c.id] || 0);
      else if (c.kind === 'p' || c.kind === 'np') s = (scorePassive[c.id] || 50) + (c.kind === 'np' ? 8 : 0);
      else if (c.kind === 'ev') s = 146 + (scoreWeapon[c.id] || 0) * 0.35;
      else if (c.kind === 'nc') {
        const roleScore = { guardian: 116, scout: 110, marker: 108, cleanser: 112, decoy: 104, striker: 102 };
        if (c.id && c.id.startsWith('echo_')) s = 84 + (roleScore[c.role || c.id.slice(5)] || 96) * 0.08;
        else s = (roleScore[c.id] || 96) - (Game.player.companions.count || 0) * 2;
      }
      else if (c.kind === 't') s = scoreTrans[c.id] || 60;
      else if (c.kind === 'heal') s = Game.player.hp < Game.stat().maxHp * 0.35 ? 95 : 25;
      s += RNG.next() * 0.01;
      if (s > bestScore) { best = c; bestScore = s; }
    }
    return best;
  },
});
