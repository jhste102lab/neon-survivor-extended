'use strict';
// Chicken drop healing effect.
const LootDropChickenEffect = {
  apply(game) {
    const p = game.player, st = game.stat();
    const idleK = game.idleRecoverySuppression ? game.idleRecoverySuppression() : 0;
    const heal = Math.max(4, Math.round(30 * (1 - idleK * 0.86)));
    p.hp = Math.min(st.maxHp, p.hp + heal);
    game.spawnText(p.x, p.y - 26, `+${heal}`, false, '#7dffc1');
    GameRuntime.playSound('pickup');
  },
};
