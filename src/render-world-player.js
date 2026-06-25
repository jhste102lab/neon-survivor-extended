'use strict';
// Focused renderer for the player avatar in world space.
const RenderWorldPlayer = (() => {
  function drawPlayer(render, x) {
    const p = Game.player;
    if (p.dead) return;
    drawLivePlayer(x, p, Game.time, render.mobileVisualScale());
  }

  function drawLivePlayer(x, p, t, ms) {
    x.save();
    drawPlayerAura(x, p, ms);
    applyPlayerInvulnerabilityAlpha(x, p, t);
    drawPlayerCore(x, p, ms);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    drawPlayerBarrier(x, p, t);
    drawPlayerInvulnerabilityRing(x, p, t, ms);
    drawPlayerOutline(x, p);
    drawPlayerDirection(x, p, ms);
    x.restore();
  }

  function drawPlayerAura(x, p, ms) {
    x.globalCompositeOperation = 'lighter';
    const aura = Sprites.glowDot('#19e3ff', 16 * ms);
    x.globalAlpha = Game.focusMode ? 0.18 : 0.45;
    x.drawImage(aura, p.x - 52 * ms, p.y - 52 * ms, 104 * ms, 104 * ms);
    x.globalAlpha = 1;
  }

  function applyPlayerInvulnerabilityAlpha(x, p, t) {
    if (p.invuln > 0 && Math.sin(t * 45) > 0) x.globalAlpha = 0.35;
  }

  function drawPlayerCore(x, p, ms) {
    const core = Sprites.glowDot('#9ff3ff', 11 * ms, '#ffffff');
    x.drawImage(core, p.x - 27 * ms, p.y - 27 * ms, 54 * ms, 54 * ms);
  }

  function drawPlayerBarrier(x, p, t) {
    if (!(p.barrier > 0)) return;
    x.strokeStyle = `rgba(125,255,193,${0.45 + Math.sin(t * 8) * 0.12})`;
    x.lineWidth = 4;
    x.beginPath(); x.arc(p.x, p.y, CFG.player.radius + 9, 0, TAU); x.stroke();
  }

  function drawPlayerInvulnerabilityRing(x, p, t, ms) {
    if (!(p.invuln > 0)) return;
    const k = clamp(p.invuln / (CFG.player.invuln || 0.72), 0, 1);
    const flash = p.invuln < 0.2 ? (0.55 + Math.sin(t * 48) * 0.32) : 0.86;
    const r = (CFG.player.radius + 15) * ms;
    x.save();
    x.globalAlpha = flash;
    x.strokeStyle = '#9ff3ff';
    x.lineWidth = 3.2 * ms;
    x.beginPath();
    x.arc(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k);
    x.stroke();
    x.globalAlpha = 0.18 * flash;
    x.fillStyle = '#9ff3ff';
    x.beginPath(); x.arc(p.x, p.y, r + 4 * ms, 0, TAU); x.fill();
    x.restore();
  }

  function drawPlayerOutline(x, p) {
    x.strokeStyle = 'rgba(180,250,255,0.95)';
    x.lineWidth = 2.5;
    x.beginPath(); x.arc(p.x, p.y, CFG.player.radius, 0, TAU); x.stroke();
  }

  function drawPlayerDirection(x, p, ms) {
    const ma = Math.atan2(p.moveY, p.moveX);
    x.fillStyle = '#fff';
    x.beginPath();
    x.arc(p.x + Math.cos(ma) * 7, p.y + Math.sin(ma) * 7, 3 * ms, 0, TAU);
    x.fill();
  }

  return { drawPlayer };
})();
globalThis.RenderWorldPlayer = RenderWorldPlayer;
