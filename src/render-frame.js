'use strict';
// Per-frame render orchestration and layer ordering.
const RenderFrame = {
  draw(render) {
    if (Game.test && Game.test.headless) return;
    const x = render.ctx, G = Game, w = render.w, h = render.h;
    x.setTransform(render.dpr, 0, 0, render.dpr, 0, 0);
    x.fillStyle = '#04050c';
    x.fillRect(0, 0, w, h);
    render.drawStars(x, w, h);

    const shake = this.frameShake(G);
    x.save();
    const frame = RenderCanvasLifecycle.createFrameContext(render, G, shake);
    x.translate(w / 2 - G.cam.x + shake.x, h / 2 + frame.cameraOffset - G.cam.y + shake.y);
    render._frame = frame;
    render._view = frame.view;
    try {
      this.drawWorldLayers(render, x, frame);
    } finally {
      render._frame = null;
      render._view = null;
      x.restore();
    }
  },

  frameShake(game) {
    if (game.shakeT <= 0) return { x: 0, y: 0 };
    const k = game.shakeT / game.shakeDur;
    return { x: rand(-1, 1) * game.shakeMag * k, y: rand(-1, 1) * game.shakeMag * k };
  },

  drawWorldLayers(render, x, frame) {
    const inPlay = frame.game.state !== 'title';
    if (inPlay) this.drawPlayLayers(render, x, frame);
    render.drawParticles(x, frame);
    if (inPlay) render.drawTexts(x, frame);
  },

  drawPlayLayers(render, x, frame) {
    render.drawGrid(x, frame.width, frame.height, frame);
    render.drawFrost(x, frame);
    render.drawGems(x, frame);
    render.drawDrops(x, frame);
    if (render.drawHazards) render.drawHazards(x, frame);
    if (render.drawEvents) render.drawEvents(x, frame);
    render.drawNovas(x, frame);
    if (render.drawMegaAbsorbs) render.drawMegaAbsorbs(x, frame);
    render.drawBeams(x, frame);
    render.drawEnemies(x, frame);
    render.drawBlades(x, frame);
    if (render.drawDrones) render.drawDrones(x, frame);
    render.drawBullets(x, frame);
    render.drawBolts(x, frame);
    if (render.drawCompanions) render.drawCompanions(x, frame);
    render.drawPlayer(x, frame);
    render.drawEnemyBullets(x, frame);
  },
};
globalThis.RenderFrame = RenderFrame;
