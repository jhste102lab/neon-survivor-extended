'use strict';
// Combat-render facade. Focused renderers own beams, orbit blades, drones, projectiles, and bolts.
function assertRenderCombatHelpers() {
  const missing = [];
  if (typeof RenderCombatBeams === 'undefined') missing.push('render-combat-beams.js');
  if (typeof RenderCombatOrbitBlades === 'undefined') missing.push('render-combat-orbit.js');
  if (typeof RenderCombatDrones === 'undefined') missing.push('render-combat-drones.js');
  if (typeof RenderCombatProjectiles === 'undefined') missing.push('render-combat-projectiles.js');
  if (typeof RenderCombatBolts === 'undefined') missing.push('render-combat-bolts.js');
  if (missing.length) throw new Error(`Render combat helper scripts missing: ${missing.join(', ')}. Load render-combat-* helpers before render-combat.js.`);
}
assertRenderCombatHelpers();

Object.assign(Render, {
  drawFrost() {
    // 냉기 오라의 실제 효과는 유지하되, 플레이어 주변 지속 원형 표시는 숨긴다.
  },
  drawBeams(x, frame = this._frame) {
    RenderCombatBeams.draw(this, x, frame);
  },
  drawBlades(x, frame = this._frame) {
    RenderCombatOrbitBlades.draw(x, frame);
  },
  drawDrones(x, frame = this._frame) {
    RenderCombatDrones.draw(this, x, frame);
  },
  drawBullets(x, frame = this._frame) {
    RenderCombatProjectiles.drawPlayerBullets(this, x, frame);
  },
  drawEnemyBullets(x, frame = this._frame) {
    RenderCombatProjectiles.drawEnemyBullets(this, x, frame);
  },
  drawBolts(x, frame = this._frame) {
    RenderCombatBolts.draw(this, x, frame);
  },
});
