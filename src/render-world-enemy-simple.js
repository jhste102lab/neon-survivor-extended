'use strict';
// Budget-friendly enemy silhouettes used when dense late-game rendering is under pressure.
const RenderWorldEnemySimple = (() => {
  function drawEnemyShape(x, e, cx, cy, scale, rotationOverride = null) {
    const r = Math.max(2, e.r * scale);
    const shape = e.def.shape;
    const rotation = Number.isFinite(rotationOverride)
      ? rotationOverride
      : (shape === 'tri' || shape === 'diamond'
        ? Math.atan2(Game.player.y - e.y, Game.player.x - e.x) + Math.PI / 2
        : -Math.PI / 2);
    x.save();
    x.translate(cx, cy);
    x.rotate(rotation);
    x.lineWidth = Math.max(1.25, r * 0.16);
    x.strokeStyle = e.def.color;
    x.fillStyle = Sprites._darken ? Sprites._darken(e.def.color, 0.34) : e.def.color;
    x.beginPath();
    traceEnemyShape(x, shape, r);
    x.closePath();
    x.fill();
    x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.72)';
    x.beginPath();
    x.arc(0, 0, Math.max(1.2, r * 0.2), 0, TAU);
    x.fill();
    x.restore();
  }

  function traceEnemyShape(x, shape, r) {
    if (shape === 'circle') {
      x.arc(0, 0, r, 0, TAU);
      return;
    }
    if (shape === 'star') {
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + i / 10 * TAU;
        const rr = i % 2 ? r * 0.5 : r;
        i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      return;
    }
    const sides = shape === 'tri' ? 3
      : shape === 'diamond' ? 4
      : shape === 'penta' ? 5
      : shape === 'hex' ? 6
      : shape === 'oct' ? 8
      : 6;
    for (let i = 0; i <= sides; i++) {
      const a = -Math.PI / 2 + i / sides * TAU;
      i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  }

  return { drawEnemyShape };
})();
globalThis.RenderWorldEnemySimple = RenderWorldEnemySimple;
