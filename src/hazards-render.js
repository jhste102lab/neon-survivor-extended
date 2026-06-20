'use strict';
// Canvas drawing for active and warning hazard zones.
function hazardPulse(active) {
  return 0.5 + Math.sin(Game.time * (active ? 10 : 16)) * 0.5;
}

function drawHazardBackdrop(x, h, active, pulse) {
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = active ? `rgba(0,0,0,${0.26 + pulse * 0.08})` : 'rgba(0,0,0,0.18)';
  x.beginPath(); x.arc(h.x, h.y, h.r, 0, TAU); x.fill();
}

function drawHazardRing(x, h, active, pulse) {
  x.strokeStyle = active ? h.color : '#ffffff';
  x.lineWidth = active ? 4 : 2.5;
  x.setLineDash(active ? [] : [10, 7]);
  x.globalAlpha = active ? 0.86 : 0.7 + pulse * 0.25;
  x.beginPath(); x.arc(h.x, h.y, h.r * (active ? 1 : 0.85 + pulse * 0.16), 0, TAU); x.stroke();
  x.setLineDash([]);
}

function drawHazardWarnProgress(x, h) {
  if (h.warn <= 0 || h.maxWarn <= 0) return;
  const k = clamp(1 - h.warn / h.maxWarn, 0, 1);
  x.globalAlpha = 0.92;
  x.strokeStyle = h.color;
  x.lineWidth = 5;
  x.beginPath(); x.arc(h.x, h.y, h.r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * k); x.stroke();
  if (h.kind === 'idle-missile') drawIdleMissileWarning(x, h, k);
}

function drawIdleMissileWarning(x, h, progress) {
  const my = h.y - 240 * (1 - progress) - 18;
  x.save();
  x.globalAlpha = 0.95;
  x.strokeStyle = 'rgba(255,177,61,0.42)';
  x.lineWidth = 4;
  x.beginPath(); x.moveTo(h.x, my - 48); x.lineTo(h.x, my - 9); x.stroke();
  x.translate(h.x, my);
  x.fillStyle = '#f4f8ff';
  x.strokeStyle = h.color;
  x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(0, 14); x.lineTo(-6, 0); x.lineTo(-4, -13); x.lineTo(4, -13); x.lineTo(6, 0); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#ff6b3d';
  x.beginPath(); x.moveTo(-5, -5); x.lineTo(-11, -11); x.lineTo(-4, -10); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(5, -5); x.lineTo(11, -11); x.lineTo(4, -10); x.closePath(); x.fill();
  x.restore();
}

function drawActiveHazardFill(x, h, lifeK) {
  if (h.warn > 0) return;
  x.globalAlpha = 0.18 * lifeK;
  x.fillStyle = h.color;
  x.beginPath(); x.arc(h.x, h.y, h.r, 0, TAU); x.fill();
}

function drawHazardLabel(x, h, active) {
  if (!h.label) return;
  x.globalAlpha = active ? 0.65 : 0.85;
  x.fillStyle = active ? '#ffffff' : h.color;
  x.font = 'bold 10px "Orbitron","Jua",sans-serif';
  x.textAlign = 'center';
  x.fillText(h.label, h.x, h.y + 3);
}

function drawHazard(x, h) {
  const active = h.warn <= 0;
  const lifeK = clamp(h.life / h.maxLife, 0, 1);
  const pulse = hazardPulse(active);
  drawHazardBackdrop(x, h, active, pulse);
  drawHazardRing(x, h, active, pulse);
  drawHazardWarnProgress(x, h);
  drawActiveHazardFill(x, h, lifeK);
  drawHazardLabel(x, h, active);
  x.globalAlpha = 1;
}

Object.assign(Render, {
  drawHazards(x) {
    if (!Game.hazards.length) return;
    x.save();
    for (const h of Game.hazards) drawHazard(x, h);
    x.restore();
  },
});
