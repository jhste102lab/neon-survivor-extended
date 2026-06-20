'use strict';
// Decoy companion enemy slow and knockback aura effect.
function updateCompanionDecoyRoleEffect(game, c) {
  const node = game.companionNode('decoy');
  if (node) {
    const rr = 155 + companionRoleRank(c, 'decoy') * 16;
    Grid.forEachInCircle(node.x, node.y, rr, e => {
      if (e.boss) return;
      e.slowT = Math.max(e.slowT || 0, 0.22);
      e.slowK = Math.max(e.slowK || 0, 0.28 + companionRoleRank(c, 'decoy') * 0.025);
      const a = Math.atan2(e.y - node.y, e.x - node.x);
      const controlScale = CFG.controlEffectScale == null ? 1 : CFG.controlEffectScale;
      e.kx += Math.cos(a) * 8 * controlScale;
      e.ky += Math.sin(a) * 8 * controlScale;
    });
  }
}

