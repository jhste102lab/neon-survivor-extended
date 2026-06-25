'use strict';
// Public world-rendering API; focused helpers own the actual drawing work.
function assertRenderWorldHelpers() {
  const missing = [];
  if (typeof RenderWorldStars === 'undefined') missing.push('render-world-stars.js');
  if (typeof RenderWorldGrid === 'undefined') missing.push('render-world-grid.js');
  if (typeof RenderWorldEnemyRoleTelegraphs === 'undefined') missing.push('render-world-enemy-role-telegraph.js');
  if (typeof RenderWorldEnemySimple === 'undefined') missing.push('render-world-enemy-simple.js');
  if (typeof RenderWorldEnemies === 'undefined') missing.push('render-world-enemies.js');
  if (typeof RenderWorldPlayer === 'undefined') missing.push('render-world-player.js');
  if (missing.length) throw new Error(`Render world helper scripts missing: ${missing.join(', ')}. Load render-world-* helpers before render-world.js.`);
}
assertRenderWorldHelpers();

Object.assign(Render, {
  drawStars(x, w, h) {
    globalThis.RenderWorldStars.drawStars(this, x, w, h);
  },
  drawGrid(x, w, h) {
    globalThis.RenderWorldGrid.drawGrid(x, w, h);
  },
  drawEnemyRoleTelegraph(x, e, t, ms) {
    globalThis.RenderWorldEnemyRoleTelegraphs.drawEnemyRoleTelegraph(x, e, t, ms);
  },
  drawEnemies(x, frameContext = this._frame) {
    globalThis.RenderWorldEnemies.drawEnemies(this, x, frameContext);
  },
  drawPlayer(x) {
    globalThis.RenderWorldPlayer.drawPlayer(this, x);
  },
});
