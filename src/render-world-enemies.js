'use strict';
// Focused renderer for the enemy collection in world space.
const RenderWorldEnemies = (() => {
  const NORMAL_VIEW_PAD = 82;
  const IMPORTANT_VIEW_PAD = 220;
  const BOSS_VIEW_PAD = 520;
  const MASS_LAYER_ENEMY_THRESHOLD = 120;
  const MOBILE_MASS_LAYER_ENEMY_THRESHOLD = 96;
  const MASS_LAYER_SCALE = 0.28;
  const MASS_LAYER_REDRAW_INTERVAL = 32, MOBILE_MASS_LAYER_REDRAW_INTERVAL = 8;
  const SIMPLE_NORMAL_ENEMY_THRESHOLD = 96, MOBILE_SIMPLE_NORMAL_ENEMY_THRESHOLD = 56;
  const SIMPLE_NORMAL_ENEMY_PRESSURE = 0.18;

  function drawEnemies(render, x, frameContext = null) {
    const t = Game.time;
    const ms = frameContext ? frameContext.mobileScale : render.mobileVisualScale();
    const view = frameContext ? frameContext.view : (render._view || render.viewBounds(0));
    const queryPad = BOSS_VIEW_PAD;
    if (Game.enemies && Game.enemies.length >= mobileAwareMassLayerThreshold(render, frameContext)) prepareMassEnemyLayer(render);
    if (shouldUseMassLayer(render, frameContext)) {
      drawEnemiesWithMassLayer(render, x, t, ms, view, frameContext, queryPad);
      return;
    }
    if (typeof Grid !== 'undefined' && Grid.forEachInRect && Grid.map && Grid.map.size) {
      Grid.forEachInRect(view.l - queryPad, view.t - queryPad, view.r + queryPad, view.b + queryPad, e => drawEnemyIfVisible(x, e, t, ms, view));
      return;
    }
    for (const e of Game.enemies) drawEnemyIfVisible(x, e, t, ms, view);
  }

  function isMobileFrame(render, frameContext) {
    if (frameContext && frameContext.game && typeof frameContext.game.isMobileRuntime === 'function') return frameContext.game.isMobileRuntime();
    return render && typeof render.isMobileView === 'function' && render.isMobileView();
  }

  function mobileAwareMassLayerThreshold(render, frameContext) {
    const base = isMobileFrame(render, frameContext) ? MOBILE_MASS_LAYER_ENEMY_THRESHOLD : MASS_LAYER_ENEMY_THRESHOLD;
    const pressure = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.visualPressure() : 0;
    return Math.max(36, Math.round(lerp(base, base * 0.55, pressure)));
  }

  function massLayerRedrawInterval(render, frameContext) {
    const mobile = isMobileFrame(render, frameContext);
    const base = mobile ? MOBILE_MASS_LAYER_REDRAW_INTERVAL : MASS_LAYER_REDRAW_INTERVAL;
    const pressure = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.visualPressure() : 0;
    const scale = Game && Game.userTimeScale ? Game.userTimeScale : 1;
    if (mobile && pressure > 0.72) return 12;
    if (scale >= 2.5) return mobile ? 6 : 14;
    if (scale >= 1.8) return mobile ? 8 : 18;
    return base;
  }

  function shouldUseMassLayer(render, frameContext) {
    return Game.enemies && Game.enemies.length >= mobileAwareMassLayerThreshold(render, frameContext);
  }

  function drawEnemiesWithMassLayer(render, x, t, ms, view, frameContext, queryPad) {
    const layer = prepareMassEnemyLayer(render);
    const detailed = [];
    collectDetailedEnemies(view, queryPad, detailed);
    if (shouldRedrawMassLayer(render, frameContext)) redrawMassEnemyLayer(render, layer, ms, view, frameContext, queryPad);
    drawMassLayerToScreen(render, x, layer, frameContext);
    for (const e of detailed) drawEnemyDetailed(x, e, t, ms);
  }

  function shouldRedrawMassLayer(render, frameContext) {
    if (!render._massEnemyLayerReady) return true;
    const frame = Game.frameSeq || 0;
    return frame % massLayerRedrawInterval(render, frameContext) === 0;
  }

  function collectDetailedEnemies(view, queryPad, detailed) {
    const collect = e => {
      if (!enemyVisible(e, view)) return;
      if (e.boss || isImportantEnemy(e)) detailed.push(e);
    };
    if (typeof Grid !== 'undefined' && Grid.forEachInRect && Grid.map && Grid.map.size) {
      Grid.forEachInRect(view.l - queryPad, view.t - queryPad, view.r + queryPad, view.b + queryPad, collect);
      return;
    }
    for (const e of Game.enemies) collect(e);
  }

  function redrawMassEnemyLayer(render, layer, ms, view, frameContext, queryPad) {
    const lx = layer.getContext('2d');
    lx.setTransform(MASS_LAYER_SCALE, 0, 0, MASS_LAYER_SCALE, 0, 0);
    lx.clearRect(0, 0, render.w, render.h);
    const drawCandidate = e => {
      if (!enemyVisible(e, view) || e.boss || isImportantEnemy(e)) return;
      drawSimpleEnemyOnScreenLayer(lx, e, ms, render, frameContext);
    };
    if (typeof Grid !== 'undefined' && Grid.forEachInRect && Grid.map && Grid.map.size) {
      Grid.forEachInRect(view.l - queryPad, view.t - queryPad, view.r + queryPad, view.b + queryPad, drawCandidate);
    } else {
      for (const e of Game.enemies) drawCandidate(e);
    }
    const shake = frameContext && frameContext.shake ? frameContext.shake : { x: 0, y: 0 };
    render._massEnemyLayerReady = true;
    render._massEnemyLayerCamX = Game.cam.x;
    render._massEnemyLayerCamY = Game.cam.y;
    render._massEnemyLayerShakeX = shake.x || 0;
    render._massEnemyLayerShakeY = shake.y || 0;
    render._massEnemyLayerCameraOffset = frameContext ? frameContext.cameraOffset : render.mobileCameraOffset();
  }

  function drawMassLayerToScreen(render, x, layer, frameContext) {
    const shake = frameContext && frameContext.shake ? frameContext.shake : { x: 0, y: 0 };
    const cameraOffset = frameContext ? frameContext.cameraOffset : render.mobileCameraOffset();
    const dx = (render._massEnemyLayerCamX || Game.cam.x) - Game.cam.x + (shake.x || 0) - (render._massEnemyLayerShakeX || 0);
    const dy = (render._massEnemyLayerCamY || Game.cam.y) - Game.cam.y + cameraOffset - (render._massEnemyLayerCameraOffset || cameraOffset) + (shake.y || 0) - (render._massEnemyLayerShakeY || 0);
    x.save();
    x.setTransform(render.dpr, 0, 0, render.dpr, 0, 0);
    x.drawImage(layer, dx, dy, render.w, render.h);
    x.restore();
  }

  function prepareMassEnemyLayer(render) {
    const width = Math.max(1, Math.ceil(render.w * MASS_LAYER_SCALE));
    const height = Math.max(1, Math.ceil(render.h * MASS_LAYER_SCALE));
    let layer = render._massEnemyLayer;
    if (!layer) {
      layer = document.createElement('canvas');
      render._massEnemyLayer = layer;
    }
    if (layer.width !== width || layer.height !== height) {
      layer.width = width;
      layer.height = height;
      render._massEnemyLayerReady = false;
    }
    return layer;
  }

  function enemyVisible(e, view) {
    const pad = e.boss ? BOSS_VIEW_PAD : (isImportantEnemy(e) ? IMPORTANT_VIEW_PAD : NORMAL_VIEW_PAD);
    return e.x >= view.l - pad && e.x <= view.r + pad && e.y >= view.t - pad && e.y <= view.b + pad;
  }

  function isImportantEnemy(e) {
    return !!(e.elite || e.special || e.vulnerableT > 0 || e.flash > 0);
  }

  function drawEnemyIfVisible(x, e, t, ms, view) {
    if (!enemyVisible(e, view)) return;
    if (!e.boss && !isImportantEnemy(e)) {
      drawNormalEnemyFast(x, e, ms);
      return;
    }
    drawEnemyDetailed(x, e, t, ms);
  }

  function enemyScreenPosition(e, render, frameContext) {
    const shake = frameContext && frameContext.shake ? frameContext.shake : { x: 0, y: 0 };
    const cameraOffset = frameContext ? frameContext.cameraOffset : render.mobileCameraOffset();
    return {
      x: e.x - Game.cam.x + render.w / 2 + shake.x,
      y: e.y - Game.cam.y + render.h / 2 + cameraOffset + shake.y,
    };
  }

  function drawNormalEnemyFast(x, e, ms) {
    const alpha = normalEnemySpawnAlpha(e);
    if (alpha < 1) { x.save(); x.globalAlpha *= alpha; }
    if (shouldUseSimpleNormalEnemy()) {
      RenderWorldEnemySimple.drawEnemyShape(x, e, e.x, e.y, ms);
      if (alpha < 1) x.restore();
      return;
    }
    const sprite = Sprites.shape(e.def.shape, e.def.color, e.r);
    const size = sprite.width * ms;
    if (e.def.shape === 'tri' || e.def.shape === 'diamond') {
      x.save();
      x.translate(e.x, e.y);
      x.rotate(Math.atan2(Game.player.y - e.y, Game.player.x - e.x) + Math.PI / 2);
      x.drawImage(sprite, -size / 2, -size / 2, size, size);
      x.restore();
      if (alpha < 1) x.restore();
      return;
    }
    x.drawImage(sprite, e.x - size / 2, e.y - size / 2, size, size);
    if (alpha < 1) x.restore();
  }

  function normalEnemySpawnAlpha(e) {
    if (!e || e.boss || e.elite || e.special) return 1;
    return clamp((e.age || 0) / 0.32, 0.25, 1);
  }

  function shouldUseSimpleNormalEnemy(render = null, frameContext = null) {
    const count = Game.enemies ? Game.enemies.length : 0;
    const threshold = isMobileFrame(render, frameContext) ? MOBILE_SIMPLE_NORMAL_ENEMY_THRESHOLD : SIMPLE_NORMAL_ENEMY_THRESHOLD;
    const pressure = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.visualPressure() : 0;
    return count >= threshold || pressure >= SIMPLE_NORMAL_ENEMY_PRESSURE;
  }

  function drawSimpleEnemyOnScreenLayer(x, e, ms, render, frameContext) {
    const pos = enemyScreenPosition(e, render, frameContext);
    const alpha = normalEnemySpawnAlpha(e);
    if (alpha < 1) { x.save(); x.globalAlpha *= alpha; }
    RenderWorldEnemySimple.drawEnemyShape(x, e, pos.x, pos.y, ms);
    if (alpha < 1) x.restore();
  }

  function drawEnemyDetailed(x, e, t, ms) {
    const model = RenderWorldEnemyState.buildEnemyRenderModel(e, t, ms);
    Render.drawEnemyRoleTelegraph(x, e, t, ms, model.telegraph);
    if (model.overlays.dashWarning) RenderWorldEnemyOverlays.drawBossDashWarning(x, e, t);
    if (model.overlays.eliteAura) RenderWorldEnemyOverlays.drawEliteAura(x, e, t);
    if (shouldUseSimpleDetailedEnemy(e)) RenderWorldEnemySimple.drawEnemyShape(x, e, e.x, e.y, model.visual.scale, model.visual.rotation);
    else RenderWorldEnemySprites.drawEnemySprite(x, e, model.visual);
    if (model.overlays.vulnerableRing) RenderWorldEnemyOverlays.drawVulnerableRing(x, e, t, model.visual.scale);
    if (model.overlays.healthBar) RenderWorldEnemyOverlays.drawEliteHealthBar(x, e);
  }

  function shouldUseSimpleDetailedEnemy(e) {
    if (!e || !e.boss) return false;
    const pressure = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.visualPressure() : 0;
    return e.r >= 96 || pressure >= 0.16;
  }
  return { drawEnemies };
})();
globalThis.RenderWorldEnemies = RenderWorldEnemies;
