'use strict';
// Floating combat text rendering.
{
  function textAlpha(text) {
    const clarity = Game.clarityK ? Game.clarityK() : 0;
    const important = text.crit || text.color;
    return clamp(text.life / 0.7, 0, 1) * (important ? 1 : 1 - clarity * 0.35);
  }

  function textFont(text) {
    return text.crit ? 'bold 17px Arial' : 'bold 13px Arial';
  }

  function fillTextShadow(x, text) {
    x.fillStyle = 'rgba(0,0,0,0.6)';
    x.fillText(text.txt, text.x + 1.5, text.y + 1.5);
  }

  function fillTextFace(x, text) {
    x.fillStyle = text.color;
    x.fillText(text.txt, text.x, text.y);
  }

  function fillCritLabel(x, text) {
    if (!text.crit) return;
    x.font = 'bold 10px Arial';
    x.fillText('CRIT!', text.x, text.y - 14);
  }

  function drawFloatingText(x, text) {
    x.font = textFont(text);
    x.globalAlpha = textAlpha(text);
    fillTextShadow(x, text);
    fillTextFace(x, text);
    fillCritLabel(x, text);
  }

const RenderEffectFloatingTexts = {
  draw(render, x, frame = null) {
    x.save();
    x.textAlign = 'center';
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => render.worldVisible(px, py, pad);
    for (const text of Game.texts) {
      if (!visible(text.x, text.y, 70)) continue;
      drawFloatingText(x, text);
    }
    x.restore();
  },
};
globalThis.RenderEffectFloatingTexts = RenderEffectFloatingTexts;
}
