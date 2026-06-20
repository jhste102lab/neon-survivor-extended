'use strict';
// Focused renderer for enemy status and warning overlays.
const RenderWorldEnemyOverlays = (() => {
  function drawBossDashWarning(x, e, t) {
    x.save();
    x.strokeStyle = `rgba(255,60,80,${0.4 + Math.sin(t * 25) * 0.3})`;
    x.lineWidth = 3;
    x.beginPath(); x.arc(e.x, e.y, e.r * 1.5, 0, TAU); x.stroke();
    x.restore();
  }

  function drawEliteAura(x, e, t) {
    x.save();
    x.strokeStyle = `rgba(255,210,61,${0.55 + Math.sin(t * 5) * 0.25})`;
    x.lineWidth = 2.5;
    x.beginPath(); x.arc(e.x, e.y, e.r * 1.35, 0, TAU); x.stroke();
    x.restore();
  }

  function drawVulnerableRing(x, e, t, scale) {
    if (!(e.vulnerableT > 0)) return;
    x.save();
    x.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 10) * 0.18})`;
    x.lineWidth = 2;
    x.beginPath(); x.arc(e.x, e.y, e.r * scale + 8, 0, TAU); x.stroke();
    x.restore();
  }

  function drawEliteHealthBar(x, e) {
    if (!(e.elite && e.hp < e.maxHp)) return;
    const bw = e.r * 2;
    x.fillStyle = 'rgba(0,0,0,0.5)';
    x.fillRect(e.x - bw / 2, e.y - e.r - 12, bw, 4);
    x.fillStyle = '#ffd23d';
    x.fillRect(e.x - bw / 2, e.y - e.r - 12, bw * clamp(e.hp / e.maxHp, 0, 1), 4);
  }

  return {
    drawBossDashWarning,
    drawEliteAura,
    drawVulnerableRing,
    drawEliteHealthBar,
  };
})();
globalThis.RenderWorldEnemyOverlays = RenderWorldEnemyOverlays;
