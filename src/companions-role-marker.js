'use strict';
// Marker companion enemy vulnerability effect.
function updateCompanionMarkerRoleEffect(game, dt, c) {
  c.markerT -= dt;
  if (c.markerT <= 0) {
    c.markerT = Math.max(1.55, 2.45 - companionRoleRank(c, 'marker') * 0.22);
    const t = game.strongestVisibleOrNearest ? game.strongestVisibleOrNearest(1200, 260) : game.strongestEnemy();
    if (t) {
      const r = companionRoleRank(c, 'marker');
      t.vulnerableT = Math.max(t.vulnerableT || 0, t.boss ? 1.7 + r * 0.15 : 2.4 + r * 0.22);
      t.vulnerableK = Math.max(t.vulnerableK || 0, t.boss ? 0.07 + r * 0.01 : 0.1 + r * 0.015);
    }
  }
}

