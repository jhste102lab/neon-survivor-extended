'use strict';
// Focused renderer for special-enemy role telegraphs.
const RenderWorldEnemyRoleTelegraphs = (() => {
  function drawBulwarkTelegraph(x, e, t) {
    x.strokeStyle = `rgba(85,255,184,${0.14 + Math.sin(t * 4) * 0.04})`;
    x.lineWidth = 2;
    x.beginPath(); x.arc(e.x, e.y, 185, 0, TAU); x.stroke();
    x.fillStyle = 'rgba(85,255,184,0.035)';
    x.beginPath(); x.arc(e.x, e.y, 185, 0, TAU); x.fill();
  }

  function chargerTelegraphAngle(e) {
    return e.chargeDir || Math.atan2(Game.player.y - e.y, Game.player.x - e.x);
  }

  function drawChargerTelegraph(x, e, t, ms) {
    const a = chargerTelegraphAngle(e);
    x.setLineDash([18, 12]);
    x.strokeStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 24) * 0.25})`;
    x.lineWidth = 8 * ms;
    x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(e.x + Math.cos(a) * 520, e.y + Math.sin(a) * 520); x.stroke();
    x.strokeStyle = '#ff4d4d'; x.lineWidth = 3 * ms;
    x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(e.x + Math.cos(a) * 520, e.y + Math.sin(a) * 520); x.stroke();
    x.setLineDash([]);
  }

  function drawWardenTelegraph(x, e, t, ms) {
    x.strokeStyle = 'rgba(65,240,255,0.34)';
    x.lineWidth = 2;
    x.beginPath(); x.arc(e.x, e.y, e.r * ms + 14 + Math.sin(t * 6) * 4, 0, TAU); x.stroke();
  }

  function drawMinerTelegraph(x, e) {
    x.strokeStyle = 'rgba(255,157,61,0.36)';
    x.lineWidth = 2;
    x.setLineDash([5, 6]);
    x.beginPath(); x.arc(e.x, e.y, 52, 0, TAU); x.stroke();
    x.setLineDash([]);
  }

  function drawSpawnerTelegraph(x, e, t, ms) {
    x.strokeStyle = `rgba(212,77,255,${0.35 + Math.sin(t * 7) * 0.18})`;
    x.lineWidth = 3;
    x.beginPath(); x.arc(e.x, e.y, e.r * ms + 18, 0, TAU); x.stroke();
  }

  const RoleTelegraphDrawers = Object.freeze({
    bulwark: (x, e, t, ms) => drawBulwarkTelegraph(x, e, t, ms),
    charger: (x, e, t, ms) => { if (e.chargeState === 1) drawChargerTelegraph(x, e, t, ms); },
    warden: (x, e, t, ms) => drawWardenTelegraph(x, e, t, ms),
    miner: (x, e) => drawMinerTelegraph(x, e),
    spawner: (x, e, t, ms) => drawSpawnerTelegraph(x, e, t, ms),
  });

  function drawKnownRoleTelegraph(x, e, t, ms, telegraph = null) {
    const kind = telegraph && telegraph.kind ? telegraph.kind : e.special;
    const draw = RoleTelegraphDrawers[kind];
    if (draw) draw(x, e, t, ms);
  }


  function drawEnemyRoleTelegraph(x, e, t, ms, telegraph = null) {
    if (!e || (!e.special && !(telegraph && telegraph.kind))) return;
    x.save();
    drawKnownRoleTelegraph(x, e, t, ms, telegraph);
    x.restore();
  }

  return { drawEnemyRoleTelegraph };
})();
globalThis.RenderWorldEnemyRoleTelegraphs = RenderWorldEnemyRoleTelegraphs;
