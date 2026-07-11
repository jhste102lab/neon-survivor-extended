'use strict';
// Canvas drawing for the active field event marker.
const EventVfxAssets = (() => {
  let portal = null;
  function portalTwirl() {
    if (portal || typeof Image === 'undefined') return portal;
    portal = new Image(); portal.decoding = 'async'; portal.src = 'assets/vfx/kenney-particle-pack/portal-twirl.png';
    return portal;
  }
  return { portalTwirl };
})();
function eventFillColor(info, state) {
  if (info.role === 'danger') return state === 'offer' ? 'rgba(255,77,94,0.12)' : 'rgba(255,77,94,0.20)';
  if (info.role === 'risk') return state === 'offer' ? 'rgba(255,210,61,0.10)' : 'rgba(255,210,61,0.17)';
  return state === 'offer' ? 'rgba(61,255,142,0.10)' : 'rgba(61,255,142,0.17)';
}

function eventPopupLines(info, ev) {
  return [info.name || '', ev.state === 'offer' ? (info.hint || info.offer || '') : (info.activeHint || info.hint || '')];
}

function drawEventPopup(x, ev, info) {
  const lines = eventPopupLines(info, ev);
  const padX = 10, padY = 7;
  x.save();
  x.font = 'bold 12px "Jua","Arial",sans-serif';
  const w = Math.min(260, Math.max(...lines.map(line => x.measureText(line).width)) + padX * 2);
  const h = 44;
  const y = ev.y - ev.r - 58;
  const r = 10;
  const left = ev.x - w / 2;
  x.globalAlpha = 0.92;
  x.fillStyle = 'rgba(4,8,20,0.82)';
  x.strokeStyle = info.color;
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(left + r, y);
  x.lineTo(left + w - r, y); x.quadraticCurveTo(left + w, y, left + w, y + r);
  x.lineTo(left + w, y + h - r); x.quadraticCurveTo(left + w, y + h, left + w - r, y + h);
  x.lineTo(left + r, y + h); x.quadraticCurveTo(left, y + h, left, y + h - r);
  x.lineTo(left, y + r); x.quadraticCurveTo(left, y, left + r, y);
  x.closePath(); x.fill(); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = info.color;
  x.font = 'bold 12px "Jua","Arial",sans-serif';
  x.fillText(`${info.icon} ${lines[0]}`, ev.x, y + padY + 7);
  x.fillStyle = '#e8fbff';
  x.font = '11px "Jua","Arial",sans-serif';
  x.fillText(lines[1], ev.x, y + padY + 25);
  x.restore();
}

function drawEventCountdown(x, ev) {
  if (ev.state !== 'active' || ev.type !== 'storm') return;
  const text = `남은 시간 ${Math.max(0, Math.ceil(ev.life))}초`;
  const y = ev.y - ev.r - 86;
  x.save();
  x.font = '900 14px "Jua","Arial",sans-serif';
  const w = x.measureText(text).width + 24;
  x.fillStyle = 'rgba(1,5,14,.94)';
  x.strokeStyle = '#9ff3ff';
  x.lineWidth = 2;
  x.beginPath(); x.roundRect(ev.x - w / 2, y - 14, w, 28, 10); x.fill(); x.stroke();
  x.fillStyle = '#ffffff';
  x.shadowColor = '#41f0ff'; x.shadowBlur = 8;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, ev.x, y);
  x.restore();
}

Object.assign(Render, {
  drawEvents(x) {
    const ev = Game.activeEvent;
    if (!ev) return;
    const info = ev.type === 'rift' && typeof DimensionRiftRules !== 'undefined'
      ? { ...FIELD_EVENTS.rift, ...DimensionRiftRules.get(ev.dimension), hint: '균열장 안에서 버티면 소형 보상', activeHint: '버티기 → 약한 보상 2개 중 선택', role: 'benefit' }
      : FIELD_EVENTS[ev.type];
    const pulse = 0.5 + Math.sin(Game.time * 5 + ev.pulse) * 0.5;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = info.color;
    x.fillStyle = eventFillColor(info, ev.state);
    x.lineWidth = ev.state === 'offer' ? 3 : 4;
    x.setLineDash(ev.state === 'offer' ? [12, 8] : []);
    x.beginPath(); x.arc(ev.x, ev.y, ev.r + pulse * 7, 0, TAU); x.fill(); x.stroke();
    if (ev.type === 'rift') {
      const portal = EventVfxAssets.portalTwirl();
      if (portal && portal.complete && portal.naturalWidth) {
        const size = ev.r * 1.9;
        x.save(); x.translate(ev.x, ev.y); x.rotate(-Game.time * .38); x.globalCompositeOperation = 'lighter'; x.globalAlpha = ev.state === 'offer' ? .28 : .18; x.drawImage(portal, -size / 2, -size / 2, size, size); x.restore();
      }
    }
    x.setLineDash([]);
    if (ev.state === 'active' && (ev.type === 'rift' || ev.type === 'supply')) {
      const need = ev.type === 'rift' && typeof DimensionRiftRules !== 'undefined' ? (DimensionRiftRules.get(ev.dimension).holdGoal || 8.5) : 6;
      const k = clamp(ev.hold / need, 0, 1);
      x.strokeStyle = '#ffffff';
      x.lineWidth = 5;
      x.beginPath(); x.arc(ev.x, ev.y, ev.r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * k); x.stroke();
    }
    x.font = 'bold 18px Arial';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff';
    x.fillText(info.icon, ev.x, ev.y);
    drawEventPopup(x, ev, info);
    drawEventCountdown(x, ev);
    x.restore();
  },
});
