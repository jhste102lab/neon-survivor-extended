'use strict';
// Focused renderer for the parallax starfield background.
const RenderWorldStars = (() => {
  function drawStars(render, x, w, h) {
    const G = Game;
    for (const [pat, par] of [[render.starPat1, 0.25], [render.starPat2, 0.5]]) {
      const ox = (-G.cam.x * par) % 512, oy = (-G.cam.y * par) % 512;
      x.save();
      x.translate(ox, oy);
      x.fillStyle = pat;
      x.fillRect(-512, -512, w + 1024, h + 1024);
      x.restore();
    }
  }

  return { drawStars };
})();
globalThis.RenderWorldStars = RenderWorldStars;
