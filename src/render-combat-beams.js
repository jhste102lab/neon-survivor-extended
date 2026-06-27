'use strict';
// Beam rendering.
{
  const DEFAULT_BEAM_LENGTH = 1900;
  function beamAlpha(beam) {
    return clamp(beam.life / (beam.maxLife || 0.32), 0, 1);
  }

  function beamLength(beam) {
    return beam.len || DEFAULT_BEAM_LENGTH;
  }

  function beamOuterColor(beam, alpha) {
    if (beam.color === '#ffffff') return `rgba(255,255,255,${alpha * 0.42})`;
    if (beam.color === '#c39bff') return `rgba(195,155,255,${alpha * 0.55})`;
    return `rgba(163,107,255,${alpha * 0.55})`;
  }

  function fillBeamOuterLayer(x, beam, alpha, length) {
    x.fillStyle = beamOuterColor(beam, alpha);
    x.fillRect(0, -beam.w / 2, length, beam.w);
  }

  function fillBeamCoreLayer(x, beam, alpha, length) {
    x.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
    x.fillRect(0, -beam.w / 6, length, beam.w / 3);
  }

  function drawBeam(x, beam) {
    const alpha = beamAlpha(beam);
    const length = beamLength(beam);
    x.save();
    x.translate(beam.x, beam.y);
    x.rotate(beam.a);
    fillBeamOuterLayer(x, beam, alpha, length);
    fillBeamCoreLayer(x, beam, alpha, length);
    x.restore();
  }

const RenderCombatBeams = {
  draw(render, x, frame = null) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 1 - ((Game.clarityK ? Game.clarityK() : 0) * 0.46);
    const segmentVisible = frame && frame.segmentVisible ? frame.segmentVisible : (x1, y1, x2, y2, pad) => render.segmentVisible(x1, y1, x2, y2, pad);
    for (const beam of Game.beams) {
      if (beam.visualHidden) continue;
      if (Game.weaponEffectHiddenForSource && Game.weaponEffectHiddenForSource(beam.source)) continue;
      const len = beamLength(beam);
      const x2 = beam.x + Math.cos(beam.a) * len;
      const y2 = beam.y + Math.sin(beam.a) * len;
      if (!segmentVisible(beam.x, beam.y, x2, y2, beam.w + 110)) continue;
      drawBeam(x, beam);
    }
    x.restore();
  },
};
globalThis.RenderCombatBeams = RenderCombatBeams;
}
