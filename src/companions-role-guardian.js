'use strict';
// Guardian companion barrier recharge effect.
function updateCompanionGuardianRoleEffect(game, player, dt, c) {
  const r = companionRoleRank(c, 'guardian');
  c.guardianT -= dt;
  if (c.guardianT <= 0) {
    c.guardianT = Math.max(3.9, 5.4 - r * 0.35);
    const idleK = game.idleRecoverySuppression ? game.idleRecoverySuppression() : 0;
    const maxBarrier = (22 + r * 5 + Math.min(15, game.evolutionCount ? game.evolutionCount() * 2 : 0)) * (1 - idleK * 0.55);
    const amount = (7 + r * 2) * (1 - idleK * 0.82);
    if (amount > 0.5) player.barrier = Math.min(maxBarrier, (player.barrier || 0) + amount);
  }
}

