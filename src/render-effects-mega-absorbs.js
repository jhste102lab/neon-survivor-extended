'use strict';
// Mega absorb ghost rendering.
{
  function drawMegaAbsorbGhost(x, ghost) {
    const ageK = clamp((ghost.maxLife - ghost.life) / ghost.maxLife, 0, 1);
    const alpha = clamp(ghost.life / ghost.maxLife, 0, 1) * (0.78 + ageK * 0.22);
    const scale = 1 - ageK * 0.35;
    const sprite = Sprites.shape(ghost.shape || 'circle', ghost.color || '#ff2bd6', ghost.r * scale);
    x.save();
    x.translate(ghost.x, ghost.y);
    x.rotate((ghost.spin || 1) * ageK * TAU * 1.35);
    x.globalAlpha = alpha;
    const size = sprite.width;
    x.drawImage(sprite, -size / 2, -size / 2, size, size);
    x.strokeStyle = `rgba(255,255,255,${0.18 * alpha})`;
    x.lineWidth = 1.5;
    x.beginPath(); x.arc(0, 0, ghost.r * (1.2 + ageK * 0.35), 0, TAU); x.stroke();
    x.restore();
  }

const RenderEffectMegaAbsorbs = {
  draw(render, x, frame = null) {
    if (!Game.megaAbsorbs || !Game.megaAbsorbs.length) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => render.worldVisible(px, py, pad);
    for (const ghost of Game.megaAbsorbs) {
      if (!visible(ghost.x, ghost.y, 180)) continue;
      drawMegaAbsorbGhost(x, ghost);
    }
    x.restore();
  },
};
globalThis.RenderEffectMegaAbsorbs = RenderEffectMegaAbsorbs;
}
