'use strict';
// Focused renderer for the world-space background grid.
const RenderWorldGrid = (() => {
  function drawGrid(x, w, h) {
    const G = Game, s = 95;
    const x0 = G.cam.x - w / 2, y0 = G.cam.y - h / 2;
    x.strokeStyle = 'rgba(70,110,190,0.09)';
    x.lineWidth = 1;
    x.beginPath();
    for (let gx = Math.floor(x0 / s) * s; gx < x0 + w + s; gx += s) { x.moveTo(gx, y0 - s); x.lineTo(gx, y0 + h + s); }
    for (let gy = Math.floor(y0 / s) * s; gy < y0 + h + s; gy += s) { x.moveTo(x0 - s, gy); x.lineTo(x0 + w + s, gy); }
    x.stroke();
  }

  return { drawGrid };
})();
globalThis.RenderWorldGrid = RenderWorldGrid;
