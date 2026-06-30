'use strict';
// 후반 자석 중력장 시각화.
Object.assign(Render, {
  drawGravityFields(x) {
    if (!Game.gravityFields || !Game.gravityFields.length) return;
    x.save();
    for (const f of Game.gravityFields) {
      const lifeK = clamp((f.life || 0) / Math.max(0.1, f.maxLife || 1), 0, 1);
      const pulse = 0.5 + Math.sin((Game.time || 0) * 8 + (f.pulse || 0)) * 0.5;
      x.globalAlpha = 0.12 + lifeK * 0.16;
      const grad = x.createRadialGradient(f.x, f.y, 8, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(65,240,255,.22)');
      grad.addColorStop(0.65, 'rgba(166,107,255,.12)');
      grad.addColorStop(1, 'rgba(65,240,255,0)');
      x.fillStyle = grad;
      x.beginPath(); x.arc(f.x, f.y, f.r, 0, TAU); x.fill();
      x.globalAlpha = 0.34 * lifeK;
      x.strokeStyle = '#41f0ff';
      x.lineWidth = 2;
      x.setLineDash([10, 8]);
      x.beginPath(); x.arc(f.x, f.y, f.r * (0.94 + pulse * 0.04), 0, TAU); x.stroke();
      x.setLineDash([]);
    }
    x.restore();
  },
});
