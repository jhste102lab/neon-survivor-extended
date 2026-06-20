'use strict';
// Companion trail sampling, node lookup, and follow formation.
Object.assign(Game, {
  companionNode(role) {
    const c = companionStateFor(this.player);
    return c.nodes.find(n => n.role === role) || c.nodes[0] || null;
  },

  updateCompanionFormation(dt, c) {
    const p = this.player;
    c.trail.unshift({ x: p.x, y: p.y, mx: p.moveX, my: p.moveY });
    while (c.trail.length > 280) c.trail.pop();
    if (c.count <= 0) return false;

    while (c.nodes.length < c.roles.length) {
      const role = c.roles[c.nodes.length];
      c.nodes.push({ x: p.x, y: p.y, phase: rand(0, TAU), role });
    }
    if (c.nodes.length > c.roles.length) c.nodes.length = c.roles.length;

    for (let i = 0; i < c.nodes.length; i++) {
      const node = c.nodes[i];
      node.role = c.roles[i] || node.role;
      const sample = c.trail[Math.min(c.trail.length - 1, 14 + i * 17)] || c.trail[c.trail.length - 1] || p;
      const a = this.time * 1.25 + i / Math.max(1, c.count) * TAU;
      const spread = 20 + Math.min(38, i * 4);
      const tx = sample.x + Math.cos(a) * spread;
      const ty = sample.y + Math.sin(a) * spread;
      const follow = 1 - Math.pow(0.00002, dt);
      node.x = lerp(node.x, tx, follow);
      node.y = lerp(node.y, ty, follow);
      node.phase += dt * 4;
    }

    return true;
  },
});
