'use strict';
// Canvas lifecycle and per-frame render context construction for Render.
const RenderCanvasLifecycle = {
  init(render) {
    render.cv = $('c');
    render.ctx = render.cv.getContext('2d', { alpha: false, desynchronized: true }) || render.cv.getContext('2d');
    const onResize = () => this.resize(render);
    addEventListener('resize', onResize);
    onResize();
    const px = render.ctx;
    render.starPat1 = px.createPattern(Sprites.starTile(90, 0.55), 'repeat');
    render.starPat2 = px.createPattern(Sprites.starTile(40, 0.9), 'repeat');
    if (typeof Sprites.prewarmEnemyShapes === 'function') {
      Sprites.prewarmEnemyShapes(
        typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES : null,
        typeof BOSSES !== 'undefined' ? BOSSES : null,
      );
    }
  },

  resize(render) {
    render.w = innerWidth;
    render.h = innerHeight;
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    const mobile = coarse && (render.w <= 760 || (render.w <= 920 && render.h <= 520));
    render.dpr = Math.min(mobile ? (CFG.mobile.dprCap || 1.25) : 1.5, devicePixelRatio || 1);
    render.cv.width = Math.round(render.w * render.dpr);
    render.cv.height = Math.round(render.h * render.dpr);
    render.cv.style.width = render.w + 'px';
    render.cv.style.height = render.h + 'px';
  },

  createFrameContext(render, game, shake = { x: 0, y: 0 }) {
    const cameraOffset = render.mobileCameraOffset();
    const view = render.viewBounds(0, cameraOffset);
    return {
      game,
      width: render.w,
      height: render.h,
      dpr: render.dpr,
      cameraOffset,
      mobileScale: render.mobileVisualScale(),
      shake,
      view,
      worldVisible: (x, y, pad = 120) => render.worldVisible(x, y, pad, view),
      segmentVisible: (x1, y1, x2, y2, pad = 120) => render.segmentVisible(x1, y1, x2, y2, pad, view),
    };
  },
};
