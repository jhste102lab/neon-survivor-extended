'use strict';
// Transient-effect render facade. Focused helpers own nova, ghost, particle, and text visuals.
function assertRenderEffectHelpers() {
  const missing = [];
  if (typeof RenderEffectNovas === 'undefined') missing.push('render-effects-novas.js');
  if (typeof RenderEffectMegaAbsorbs === 'undefined') missing.push('render-effects-mega-absorbs.js');
  if (typeof RenderEffectBossInteractions === 'undefined') missing.push('render-effects-boss-interactions.js');
  if (typeof RenderEffectParticles === 'undefined') missing.push('render-effects-particles.js');
  if (typeof RenderEffectFloatingTexts === 'undefined') missing.push('render-effects-floating-texts.js');
  if (missing.length) throw new Error(`Render effect helper scripts missing: ${missing.join(', ')}. Load render-effects-* helpers before render-effects.js.`);
}
assertRenderEffectHelpers();

Object.assign(Render, {
  drawNovas(x, frame = this._frame) {
    RenderEffectNovas.draw(this, x, frame);
  },
  drawMegaAbsorbs(x, frame = this._frame) {
    RenderEffectMegaAbsorbs.draw(this, x, frame);
  },
  drawBossInteractions(x, frame = this._frame) {
    RenderEffectBossInteractions.draw(this, x, frame);
  },
  drawParticles(x, frame = this._frame) {
    RenderEffectParticles.draw(this, x, frame);
  },
  drawTexts(x, frame = this._frame) {
    RenderEffectFloatingTexts.draw(this, x, frame);
  },
});
