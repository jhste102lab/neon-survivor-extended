'use strict';
// Canvas drawing for trailing Neon companions.
Object.assign(Render, {
  drawCompanions(x) {
    const p = Game.player;
    if (!p || p.dead || !p.companions || p.companions.count <= 0) return;
    const c = p.companions;
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (let i = c.nodes.length - 1; i >= 0; i--) {
      const n = c.nodes[i];
      const role = n.role || (c.roles && c.roles[i]) || 'striker';
      const meta = COMPANION_ROLES[role] || COMPANION_ROLES.striker;
      const pulse = 1 + Math.sin(Game.time * 4.2 + n.phase) * 0.08;
      const r = 10 * pulse;
      const aura = Sprites.glowDot(meta.color || '#7dffc1', 11);
      x.globalAlpha = 0.34;
      x.drawImage(aura, n.x - 36, n.y - 36, 72, 72);
      x.globalAlpha = 1;
      const core = Sprites.glowDot(meta.color || '#baffde', 7, '#ffffff');
      x.drawImage(core, n.x - r * 1.7, n.y - r * 1.7, r * 3.4, r * 3.4);
      x.strokeStyle = 'rgba(215,255,236,0.85)';
      x.lineWidth = 1.5;
      x.beginPath(); x.arc(n.x, n.y, 8, 0, TAU); x.stroke();
    }
    x.restore();
  },
});
