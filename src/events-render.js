'use strict';
// Canvas drawing for the active field event marker.
Object.assign(Render, {
  drawEvents(x) {
    const ev = Game.activeEvent;
    if (!ev) return;
    const info = FIELD_EVENTS[ev.type];
    const pulse = 0.5 + Math.sin(Game.time * 5 + ev.pulse) * 0.5;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = info.color;
    x.fillStyle = `rgba(0,0,0,${ev.state === 'offer' ? 0.34 : 0.2})`;
    x.lineWidth = ev.state === 'offer' ? 3 : 4;
    x.setLineDash(ev.state === 'offer' ? [12, 8] : []);
    x.beginPath(); x.arc(ev.x, ev.y, ev.r + pulse * 7, 0, TAU); x.fill(); x.stroke();
    x.setLineDash([]);
    if (ev.state === 'active' && (ev.type === 'rift' || ev.type === 'supply')) {
      const need = ev.type === 'rift' ? 8.5 : 6;
      const k = clamp(ev.hold / need, 0, 1);
      x.strokeStyle = '#ffffff';
      x.lineWidth = 5;
      x.beginPath(); x.arc(ev.x, ev.y, ev.r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * k); x.stroke();
    }
    x.font = 'bold 18px Arial';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff';
    x.fillText(info.icon, ev.x, ev.y);
    x.restore();
  },
});
