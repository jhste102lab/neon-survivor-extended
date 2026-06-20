'use strict';
// Bolt rendering.
{
  const BOLT_SEGMENT_COUNT = 7;
  function boltAlpha(bolt) {
    return clamp(bolt.life / 0.22, 0, 1);
  }

  function traceBoltPath(x, bolt) {
    x.beginPath();
    x.moveTo(bolt.x1, bolt.y1);
    for (let segmentIndex = 1; segmentIndex < BOLT_SEGMENT_COUNT; segmentIndex++) {
      const t = segmentIndex / BOLT_SEGMENT_COUNT;
      const mx = lerp(bolt.x1, bolt.x2, t) + rand(-16, 16) * (1 - t * 0.6);
      const my = lerp(bolt.y1, bolt.y2, t) + rand(-10, 10);
      x.lineTo(mx, my);
    }
    x.lineTo(bolt.x2, bolt.y2);
  }

  function boltGlowColor(bolt, alpha) {
    return bolt.color ? `${bolt.color}${Math.round(alpha * 128).toString(16).padStart(2, '0')}` : `rgba(255,210,61,${alpha * 0.5})`;
  }

  function strokeBoltGlow(x, bolt, alpha) {
    x.strokeStyle = boltGlowColor(bolt, alpha);
    x.lineWidth = 7;
    x.stroke();
  }

  function strokeBoltCore(x, alpha) {
    x.strokeStyle = `rgba(255,255,255,${alpha})`;
    x.lineWidth = 2.2;
    x.stroke();
  }

  function drawBolt(x, bolt) {
    const alpha = boltAlpha(bolt);
    traceBoltPath(x, bolt);
    strokeBoltGlow(x, bolt, alpha);
    strokeBoltCore(x, alpha);
  }

const RenderCombatBolts = {
  draw(render, x, frame = null) {
    if (!Game.bolts.length) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    const segmentVisible = frame && frame.segmentVisible ? frame.segmentVisible : (x1, y1, x2, y2, pad) => render.segmentVisible(x1, y1, x2, y2, pad);
    for (const bolt of Game.bolts) {
      if (!segmentVisible(bolt.x1, bolt.y1, bolt.x2, bolt.y2, 160)) continue;
      drawBolt(x, bolt);
    }
    x.restore();
  },
};
globalThis.RenderCombatBolts = RenderCombatBolts;
}
