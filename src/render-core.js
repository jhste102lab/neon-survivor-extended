'use strict';
// Core canvas renderer state, frame orchestration, and camera/view helpers.
/* ================================================================
   렌더러
   ================================================================ */
const Render = {
  cv: null, ctx: null, w: 0, h: 0, dpr: 1,
  starPat1: null, starPat2: null,
  init() {
    RenderCanvasLifecycle.init(this);
  },
  draw() {
    if (Game.test && Game.test.headless) return;
    const x = this.ctx, G = Game, w = this.w, h = this.h;
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // 배경
    x.fillStyle = '#04050c';
    x.fillRect(0, 0, w, h);
    this.drawStars(x, w, h);
    // 흔들림
    let sx = 0, sy = 0;
    if (G.shakeT > 0) {
      const k = G.shakeT / G.shakeDur;
      sx = rand(-1, 1) * G.shakeMag * k; sy = rand(-1, 1) * G.shakeMag * k;
    }
    x.save();
    const frame = RenderCanvasLifecycle.createFrameContext(this, G, { x: sx, y: sy });
    const camOffset = frame.cameraOffset;
    x.translate(w / 2 - G.cam.x + sx, h / 2 + camOffset - G.cam.y + sy);
    this._frame = frame;
    this._view = frame.view;

    const inPlay = G.state !== 'title';
    if (inPlay) {
      this.drawGrid(x, w, h);
      this.drawFrost(x);
      this.drawGems(x);
      this.drawDrops(x);
      if (this.drawHazards) this.drawHazards(x);
      if (this.drawEvents) this.drawEvents(x);
      this.drawNovas(x);
      if (this.drawMegaAbsorbs) this.drawMegaAbsorbs(x);
      this.drawBeams(x);
      this.drawEnemies(x, frame);
      this.drawBlades(x);
      if (this.drawDrones) this.drawDrones(x);
      this.drawBullets(x);
      this.drawBolts(x);
      if (this.drawCompanions) this.drawCompanions(x);
      this.drawPlayer(x);
      this.drawEnemyBullets(x);
    }
    this.drawParticles(x, frame);
    if (inPlay) this.drawTexts(x, frame);
    this._frame = null;
    this._view = null;
    x.restore();
  },
  isMobileView() {
    const coarse = typeof matchMedia === 'undefined' || matchMedia('(pointer: coarse)').matches;
    return coarse && (this.w <= 760 || (this.w <= 920 && this.h <= 520));
  },
  mobileVisualScale() {
    return this.isMobileView() ? CFG.mobile.visualScale : 1;
  },
  mobileCameraOffset() {
    return this.isMobileView() ? Math.max(-120, CFG.mobile.camYOffset) : 0;
  },
  viewBounds(pad = 0, camOffset = this.mobileCameraOffset()) {
    const G = Game;
    return {
      l: G.cam.x - this.w / 2 - pad,
      r: G.cam.x + this.w / 2 + pad,
      t: G.cam.y - this.h / 2 - camOffset - pad,
      b: G.cam.y + this.h / 2 - camOffset + pad,
    };
  },
  worldVisible(x, y, pad = 120, view = null) {
    const b = view || this._view || this.viewBounds(0);
    return x >= b.l - pad && x <= b.r + pad && y >= b.t - pad && y <= b.b + pad;
  },
  segmentVisible(x1, y1, x2, y2, pad = 120, view = null) {
    const b = view || this._view || this.viewBounds(0);
    const l = Math.min(x1, x2), r = Math.max(x1, x2), t = Math.min(y1, y2), bb = Math.max(y1, y2);
    return r >= b.l - pad && l <= b.r + pad && bb >= b.t - pad && t <= b.b + pad;
  },
};
globalThis.Render = Render;
