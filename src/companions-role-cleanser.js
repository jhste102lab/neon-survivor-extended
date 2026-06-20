'use strict';
// Cleanser companion enemy bullet removal effect.
function updateCompanionCleanserRoleEffect(game, player, dt, c) {
  const r = companionRoleRank(c, 'cleanser');
  c.cleanseBudget = Math.min(2.6 + r * 0.45, c.cleanseBudget + dt * (2.3 + r * 0.45));
  const node = game.companionNode('cleanser') || player;
  for (let i = game.ebullets.length - 1; i >= 0 && c.cleanseBudget >= 1; i--) {
    const b = game.ebullets[i];
    if (dist2(node.x, node.y, b.x, b.y) < 175 * 175 || dist2(player.x, player.y, b.x, b.y) < 125 * 125) {
      game.ebullets.splice(i, 1);
      c.cleanseBudget -= 1;
      game.spawnBurst(b.x, b.y, '#ffffff', 4, 90, 3, 0.18);
    }
  }
}

