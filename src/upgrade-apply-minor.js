'use strict';
// Minor field-event rewards and risk-reward dimension payouts.
const MinorRewardApplicator = {
  apply(game, choice) {
    const id = choice && choice.id;
    if (id === 'minor_heal') return this.heal(game, 24);
    if (id === 'minor_barrier') return this.barrier(game, 26);
    if (id === 'minor_xp') return this.xp(game, Math.max(10, Math.round((game.player.xpNeed || 12) * 0.32)));
    if (id === 'minor_power') return this.buff(game, { id: 'minor_power', label: '차원 화력', t: 42, max: 42, dmgMul: 1.25, color: '#ff7a2b' });
    if (id === 'minor_speed') return this.buff(game, { id: 'minor_speed', label: '차원 가속', t: 42, max: 42, spdMul: 1.25, color: '#41f0ff' });
    if (id === 'casino_gamble') return this.casinoGamble(game);
    return UpgradeApplyResults.reject(choice, 'unknown minor reward');
  },

  heal(game, amount) {
    UpgradeApplyHealth.restore(game, amount);
    return UpgradeApplyResults.done();
  },

  barrier(game, amount) {
    const p = game.player;
    p.barrierMax = Math.max(p.barrierMax || 0, 58);
    p.barrier = Math.min(58, (p.barrier || 0) + amount);
    return UpgradeApplyResults.done();
  },

  xp(game, amount) {
    game.addXp(amount);
    return UpgradeApplyResults.done();
  },

  buff(game, buff) {
    if (!game.applyTemporaryBuff) return UpgradeApplyResults.reject({ kind: 'minor', id: buff.id }, 'temporary buff runtime missing');
    game.applyTemporaryBuff(buff);
    return UpgradeApplyResults.done();
  },

  casinoGamble(game) {
    const p = game.player;
    const cost = Math.max(1, Math.floor(p.hp * 0.5));
    p.hp = Math.max(1, p.hp - cost);
    const pickId = pick(['casino_power', 'casino_speed', 'casino_regen', 'casino_barrier', 'casino_crit']);
    const buffs = {
      casino_power: { id: 'casino_power', label: '도박장 화력 2배', t: 60, max: 60, dmgMul: 2, color: '#ff7a2b' },
      casino_speed: { id: 'casino_speed', label: '도박장 속도 2배', t: 60, max: 60, spdMul: 2, color: '#41f0ff' },
      casino_regen: { id: 'casino_regen', label: '도박장 재생 2배', t: 60, max: 60, regenMul: 2, regenFlat: 1.2, color: '#7dffc1' },
      casino_barrier: { id: 'casino_barrier', label: '도박장 보호막 내구도 2배', t: 60, max: 60, barrierMul: 2, color: '#9ff3ff' },
      casino_crit: { id: 'casino_crit', label: '도박장 치명타율 1.5배', t: 60, max: 60, critMul: 1.5, color: '#ffd23d' },
    };
    game.applyTemporaryBuff(buffs[pickId]);
    if (typeof game.spawnText === 'function') game.spawnText(p.x, p.y - 62, `HP -${cost} · ${buffs[pickId].label}`, true, buffs[pickId].color);
    return UpgradeApplyResults.done();
  },
};
