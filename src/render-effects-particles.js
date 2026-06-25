'use strict';
// Particle rendering.
{
  function particleAlpha(particle) {
    const clarity = Game.clarityK ? Game.clarityK() : 0;
    return Math.min(1, particle.life / particle.maxLife * 1.4) * (1 - clarity * 0.58);
  }

  function particleDrawSize(particle) {
    return particle.size * 3.2 * (particle.life / particle.maxLife) + 2;
  }

  function drawParticle(x, particle) {
    const sprite = Sprites.glowDot(particle.color, 8);
    const size = particleDrawSize(particle);
    x.globalAlpha = particleAlpha(particle);
    x.drawImage(sprite, particle.x - size / 2, particle.y - size / 2, size, size);
  }

const RenderEffectParticles = {
  draw(render, x, frame = null) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => render.worldVisible(px, py, pad);
    const stride = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.particleStride() : 1;
    let index = 0;
    for (const particle of Game.particles) {
      if (stride > 1 && (index++ % stride) !== 0) continue;
      if (!visible(particle.x, particle.y, 90)) continue;
      drawParticle(x, particle);
    }
    x.restore();
  },
};
globalThis.RenderEffectParticles = RenderEffectParticles;
}
