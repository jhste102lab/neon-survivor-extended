'use strict';
// Canvas rendering for dimension portals, rooms, and progress markers.
function dimensionTextLine(ctx, text, x, y, color = '#eaffff', size = 15, align = 'center') {
  ctx.font = `900 ${size}px ${getComputedStyle(document.body).fontFamily || 'system-ui'}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

const DimensionPortalAssetCache = (() => {
  const cache = new Map();
  function get(src) {
    if (!src || typeof Image === 'undefined') return null;
    if (!cache.has(src)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      cache.set(src, img);
    }
    return cache.get(src);
  }
  return { get };
})();

function drawDimensionPortalIcon(ctx, portal, fallback, x, y, size) {
  const img = DimensionPortalAssetCache.get(portal && portal.asset);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.shadowColor = portal.color || '#41f0ff';
    ctx.shadowBlur = 16;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
    return;
  }
  dimensionTextLine(ctx, fallback || '◆', x, y, '#ffffff', Math.max(18, Math.round(size * 0.52)));
}

function drawDimensionPortalShape(ctx, portal, t, active = false) {
  const color = portal.color || '#41f0ff';
  const r = portal.r || 72;
  const pulse = 0.5 + Math.sin(t * 3 + (portal.phase || 0)) * 0.5;
  ctx.save();
  ctx.translate(portal.x, portal.y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 5 : 3;
  ctx.globalAlpha = 0.35 + pulse * 0.22;
  ctx.beginPath(); ctx.arc(0, 0, r + pulse * 10, 0, TAU); ctx.stroke();
  ctx.globalAlpha = active ? 0.32 : 0.20;
  const g = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 1.08);
  g.addColorStop(0, color);
  g.addColorStop(0.55, 'rgba(25,227,255,.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.rotate(t * 0.45 + (portal.phase || 0));
  ctx.globalAlpha = 0.62;
  ctx.setLineDash([18, 14]);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawDimensionCharge(ctx, portal) {
  const charge = clamp((portal.charge || 0) / (portal.hold || 5), 0, 1);
  if (charge <= 0) return;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.95;
  ctx.beginPath(); ctx.arc(portal.x, portal.y, (portal.r || 72) + 18, -Math.PI / 2, -Math.PI / 2 + TAU * charge); ctx.stroke();
  dimensionTextLine(ctx, `${Math.ceil(Math.max(0, (portal.hold || 5) - (portal.charge || 0)))}초`, portal.x, portal.y + (portal.r || 72) + 42, '#ffffff', 16);
  ctx.restore();
}

function drawDimensionEntryPortal(ctx, dim, t) {
  const portal = dim && dim.entryPortal;
  if (!portal || !portal.open) return;
  drawDimensionPortalShape(ctx, portal, t, true);
  dimensionTextLine(ctx, '차원 허브', portal.x, portal.y - 8, '#eaffff', 18);
  dimensionTextLine(ctx, '5초 머물러 진입', portal.x, portal.y + 18, '#9ff3ff', 12);
  drawDimensionCharge(ctx, portal);
}

function drawDimensionHub(ctx, dim, t) {
  if (!dim || dim.mode !== 'hub') return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let r = 180; r <= 620; r += 110) {
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = r % 220 === 0 ? '#ff2bd6' : '#41f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r + Math.sin(t + r) * 4, 0, TAU); ctx.stroke();
  }
  ctx.restore();
  dimensionTextLine(ctx, '차원 선택 허브', 0, -28, '#ffffff', 24);
  dimensionTextLine(ctx, '포탈 안에 5초 머물러 진입 · 아래 귀환 포탈로 외부 전장 복귀', 0, 8, '#9fd9ff', 13);
  for (const portal of dim.hubPortals || []) {
    const completed = !!(dim.completed && dim.completed[portal.id]);
    drawDimensionPortalShape(ctx, portal, t, portal.active && !completed);
    drawDimensionPortalIcon(ctx, portal, portal.icon || '◆', portal.x, portal.y - 25, 46);
    dimensionTextLine(ctx, portal.name, portal.x, portal.y + 6, completed ? '#8fa3c8' : '#eaffff', 13);
    dimensionTextLine(ctx, completed ? '정복 완료' : `위험도 ${'★'.repeat(portal.danger || 1)}`, portal.x, portal.y + 28, completed ? '#7dffc1' : '#ffd23d', 11);
    if (portal.active && !completed) drawDimensionCharge(ctx, portal);
  }
  const exit = dim.exitPortal;
  if (exit) {
    drawDimensionPortalShape(ctx, exit, t, exit.active);
    dimensionTextLine(ctx, '외부 전장', exit.x, exit.y + 4, '#eaffff', 15);
    if (exit.active) drawDimensionCharge(ctx, exit);
  }
}

function drawDimensionRoomBackdrop(ctx, dim, t) {
  if (!dim || dim.mode !== 'dimension') return;
  const def = dim.activeDef || {};
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = def.color || '#41f0ff';
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU + t * 0.05;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 120, Math.sin(a) * 120);
    ctx.lineTo(Math.cos(a) * 980, Math.sin(a) * 980);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = def.accent || '#ff2bd6';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 760 + Math.sin(t) * 12, 0, TAU); ctx.stroke();
  ctx.restore();
}

Object.assign(Render, {
  drawDimensionLayer(ctx) {
    const dim = Game.dimension;
    if (!dim) return;
    const t = (dim.localTime || Game.time || 0);
    drawDimensionRoomBackdrop(ctx, dim, t);
    drawDimensionEntryPortal(ctx, dim, t);
    drawDimensionHub(ctx, dim, t);
  },
});
