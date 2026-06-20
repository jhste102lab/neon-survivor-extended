'use strict';
// Scout companion pickup magnet effect.
function updateCompanionScoutRoleEffect(game, player, dt, c) {
  const node = game.companionNode('scout') || player;
  const rr = 220 + companionRoleRank(c, 'scout') * 24;
  const r2 = rr * rr;
  for (const g of game.gems) {
    if (!g.mag && dist2(node.x, node.y, g.x, g.y) < r2) { g.mag = true; g.ms = Math.max(g.ms || 0, 320 * (CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale)); }
  }
  for (const d of game.drops) {
    if (dist2(node.x, node.y, d.x, d.y) < r2) {
      const dd = Math.hypot(player.x - d.x, player.y - d.y) || 1;
      const controlScale = CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale;
      d.x += (player.x - d.x) / dd * 185 * controlScale * dt;
      d.y += (player.y - d.y) / dd * 185 * controlScale * dt;
    }
  }
}

