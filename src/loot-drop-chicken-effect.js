'use strict';
// Chicken drop healing effect plan.
const LootDropChickenEffect = {
  plan(game, opts = {}) {
    const p = game.player;
    const st = game.st || (typeof game.stat === 'function' ? game.stat() : null);
    const maxHp = st && st.maxHp ? st.maxHp : CFG.player.hp;
    const missing = Math.max(0, maxHp - p.hp);
    const idleK = game.idleRecoverySuppression ? game.idleRecoverySuppression() : 0;
    const stack = Math.max(1, Math.min(CFG.maxDropStack || 3, Math.round(Number(opts.stack) || 1)));
    const stackMul = Math.pow(1.3, stack - 1);
    let heal = Math.max(4, Math.round(30 * stackMul * (1 - idleK * 0.86)));
    if (game.time >= CFG.winTime) {
      const cfg = CFG.lateBalance || {};
      heal = Math.max(4, Math.round((maxHp * (cfg.chickenHealMaxHp || 0.10) + missing * (cfg.chickenHealMissingHp || 0.12)) * stackMul * (1 - idleK * 0.86)));
      const now = game.time || 0;
      const elapsed = now - (game.lastChickenHealT || -999);
      const chain = elapsed <= (cfg.chickenRepeatWindow || 8) ? (game.chickenHealChain || 0) + 1 : 1;
      game.chickenHealChain = chain;
      game.lastChickenHealT = now;
      if (chain === 2) heal = Math.max(3, Math.round(heal * (cfg.chickenRepeatScale2 || 0.70)));
      else if (chain >= 3) heal = Math.max(2, Math.round(heal * (cfg.chickenRepeatScale3 || 0.50)));
    }
    return [
      { type: 'healPlayer', amount: heal, source: 'drop:chicken' },
      { type: 'spawnText', x: p.x, y: p.y - 26, text: `+${heal}`, color: '#7dffc1' },
      { type: 'sound', name: 'pickup' },
    ];
  },
};
