'use strict';
// Core renderer facade, canvas state, and camera/view helpers.
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
    RenderFrame.draw(this);
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
