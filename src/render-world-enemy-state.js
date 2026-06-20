'use strict';
// Focused enemy-rendering visual state calculations.
const RenderWorldEnemyState = (() => {
  function createEnemyVisualState(e, ms) {
    return {
      sprite: Sprites.shape(e.def.shape, e.def.color, e.r),
      scale: initialEnemyScale(e, ms),
      rotation: 0,
    };
  }

  function initialEnemyScale(e, ms) {
    if (e.boss) return Math.max(1, ms * 0.96);
    return ms;
  }

  function applyBossMotion(visual, t, ms) {
    visual.scale = Math.max(1, ms * 0.96) * (1 + Math.sin(t * 4) * 0.04);
    visual.rotation = t * 0.6;
  }

  function applyBossDashPulse(visual, t) {
    visual.scale *= 1 + Math.sin(t * 30) * 0.1;
  }

  function applyPointedEnemyFacing(visual, e) {
    if (e.def.shape === 'tri' || e.def.shape === 'diamond') {
      visual.rotation = Math.atan2(Game.player.y - e.y, Game.player.x - e.x) + Math.PI / 2;
    }
  }

  function applyElitePulse(visual, e, t) {
    visual.scale *= 1 + Math.sin(t * 6 + e.wobble) * 0.06;
  }


  function buildEnemyRenderModel(e, t, ms) {
    const visual = createEnemyVisualState(e, ms);
    let dashWarning = false;
    if (e.boss) {
      applyBossMotion(visual, t, ms);
      if (e.dashState === 1) {
        applyBossDashPulse(visual, t);
        dashWarning = true;
      }
    } else {
      applyPointedEnemyFacing(visual, e);
    }
    const eliteAura = !!e.elite;
    if (eliteAura) applyElitePulse(visual, e, t);
    return {
      visual,
      telegraph: e.special ? { kind: e.special } : null,
      overlays: { dashWarning, eliteAura, vulnerableRing: true, healthBar: true },
    };
  }

  return {
    createEnemyVisualState,
    applyBossMotion,
    applyBossDashPulse,
    applyPointedEnemyFacing,
    applyElitePulse,
    buildEnemyRenderModel,
  };
})();
globalThis.RenderWorldEnemyState = RenderWorldEnemyState;
