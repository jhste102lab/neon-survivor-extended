'use strict';
// Shared DOM overlay controls, level-tier metadata, and the global UI state object.
/* ================================================================
   UI core
   ================================================================ */
function showOverlay(id) {
  if (Game.test && Game.test.headless) return;
  for (const o of ['titleOv', 'lvOv', 'pauseOv', 'bestiaryOv', 'overOv', 'winOv'])
    $(o).classList.toggle('hide', o !== id);
}

const LEVEL_TIER_PALETTE = [
  { color: '#19e3ff', soft: '#9ff3ff', bg: 'rgba(25,227,255,.10)', glow: 'rgba(25,227,255,.35)' },
  { color: '#3dff8e', soft: '#baffd7', bg: 'rgba(61,255,142,.10)', glow: 'rgba(61,255,142,.35)' },
  { color: '#ffd23d', soft: '#ffe9a8', bg: 'rgba(255,210,61,.12)', glow: 'rgba(255,210,61,.38)' },
  { color: '#ff7a2b', soft: '#ffd0a8', bg: 'rgba(255,122,43,.12)', glow: 'rgba(255,122,43,.36)' },
  { color: '#ff2bd6', soft: '#ffb6ec', bg: 'rgba(255,43,214,.12)', glow: 'rgba(255,43,214,.38)' },
  { color: '#a36bff', soft: '#d8c4ff', bg: 'rgba(163,107,255,.12)', glow: 'rgba(163,107,255,.38)' },
  { color: '#7dffc1', soft: '#d2ffe9', bg: 'rgba(125,255,193,.12)', glow: 'rgba(125,255,193,.36)' },
  { color: '#ff4d5e', soft: '#ffc5cb', bg: 'rgba(255,77,94,.12)', glow: 'rgba(255,77,94,.36)' },
];

function levelTierInfo(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  const tier = lv - 1;
  const p = LEVEL_TIER_PALETTE[tier % LEVEL_TIER_PALETTE.length];
  return { tier, ...p };
}

const UI = {
  killDirty: true,
  choices: [],
  levelTier: -1,
};
