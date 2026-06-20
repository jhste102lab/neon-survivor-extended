'use strict';
// Combo HUD animation, color ramp, and reset rendering.
const COMBO_STYLE_RAMP = Object.freeze([
  { min: 1, color: '#b8bec8', label: '#8f98a6', glow: 'rgba(184,190,200,.28)' },
  { min: 5, color: '#19e3ff', label: '#9ff3ff', glow: 'rgba(25,227,255,.45)' },
  { min: 12, color: '#3dff8e', label: '#baffd7', glow: 'rgba(61,255,142,.5)' },
  { min: 24, color: '#ffd23d', label: '#ffe9a8', glow: 'rgba(255,210,61,.58)' },
  { min: 40, color: '#ff7a2b', label: '#ffd0a8', glow: 'rgba(255,122,43,.62)' },
  { min: 70, color: '#ff2bd6', label: '#ffb6ec', glow: 'rgba(255,43,214,.68)' },
  { min: 110, color: '#ff4d5e', label: '#ffc5cb', glow: 'rgba(255,77,94,.72)' },
]);

function comboStyleFor(n) {
  let style = COMBO_STYLE_RAMP[0];
  for (const row of COMBO_STYLE_RAMP) if (n >= row.min) style = row;
  return style;
}

const UIHudCombo = {
  resetComboHud() {
    if (Game.test && Game.test.headless) return;
    const el = $('combo');
    if (!el) return;
    $('comboNum').textContent = 'x0';
    el.style.opacity = 0;
    el.classList.remove('pop');
  },

  applyComboStyle(el, n) {
    const style = comboStyleFor(n);
    el.style.color = style.color;
    el.style.textShadow = `0 0 14px ${style.color}, 0 0 42px ${style.glow}`;
    const label = el.querySelector('.lbl');
    if (label) label.style.color = style.label;
  },

  combo(n) {
    const el = $('combo');
    $('comboNum').textContent = 'x' + n;
    this.applyComboStyle(el, n);
    el.style.opacity = 1;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  },
};
