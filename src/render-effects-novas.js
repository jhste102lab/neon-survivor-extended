'use strict';
// Nova, telegraph, and field/explosion rendering.
{
  function alphaByte(value) {
    return Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, '0');
  }

  function colorWithAlpha(color, fallbackRgb, alpha) {
    return color.startsWith('#') ? `${color}${alphaByte(alpha)}` : `rgba(${fallbackRgb},${alpha})`;
  }

  function novaVisibilityPad(nova) {
    return nova.maxR + 80;
  }

  function telegraphArm(nova) {
    const maxDelay = nova.telegraphMax || nova.delay || 0.3;
    return clamp(1 - nova.delay / maxDelay, 0, 1);
  }

  function orbitalTelegraphMetrics(nova) {
    const arm = telegraphArm(nova);
    const pulse = 0.5 + Math.sin(Game.time * 22) * 0.5;
    return {
      arm,
      missileX: nova.x + Math.sin(Game.time * 9 + nova.id) * 7 * (1 - arm),
      missileY: nova.y - 360 * (1 - arm) - 20,
      pulse,
      radius: nova.maxR * (0.42 + arm * 0.20 + pulse * 0.02),
    };
  }

  function fillOrbitalTargetArea(x, nova, metrics) {
    x.fillStyle = `rgba(255,107,61,${0.055 + metrics.arm * 0.075})`;
    x.beginPath();
    x.arc(nova.x, nova.y, metrics.radius, 0, TAU);
    x.fill();
  }

  function strokeOrbitalTargetRing(x, nova, metrics) {
    x.strokeStyle = `rgba(255,210,61,${0.62 + metrics.pulse * 0.26})`;
    x.lineWidth = 2.4 + metrics.arm * 2.2;
    x.setLineDash([10, 7]);
    x.beginPath();
    x.arc(nova.x, nova.y, metrics.radius, 0, TAU);
    x.stroke();
    x.setLineDash([]);
  }

  function strokeOrbitalCrosshair(x, nova, metrics) {
    const radius = metrics.radius;
    x.strokeStyle = `rgba(255,255,255,${0.55 + metrics.arm * 0.25})`;
    x.lineWidth = 1.7;
    x.beginPath();
    x.moveTo(nova.x - radius * 0.86, nova.y);
    x.lineTo(nova.x + radius * 0.86, nova.y);
    x.moveTo(nova.x, nova.y - radius * 0.86);
    x.lineTo(nova.x, nova.y + radius * 0.86);
    x.stroke();
  }

  function strokeOrbitalMissileTrail(x, metrics) {
    x.strokeStyle = `rgba(255,177,61,${0.18 + metrics.arm * 0.24})`;
    x.lineWidth = 4 + metrics.pulse * 2;
    x.beginPath();
    x.moveTo(metrics.missileX, metrics.missileY - 72);
    x.lineTo(metrics.missileX, metrics.missileY - 10);
    x.stroke();
  }

  function fillOrbitalMissileBody(x) {
    x.fillStyle = '#f4f8ff';
    x.strokeStyle = '#ffb13d';
    x.lineWidth = 1.8;
    x.beginPath();
    x.moveTo(0, 17);
    x.lineTo(-7, 1);
    x.lineTo(-5, -16);
    x.lineTo(5, -16);
    x.lineTo(7, 1);
    x.closePath();
    x.fill();
    x.stroke();
  }

  function fillOrbitalMissileFins(x) {
    x.fillStyle = '#ff6b3d';
    x.beginPath();
    x.moveTo(-7, -5);
    x.lineTo(-14, -13);
    x.lineTo(-5, -12);
    x.closePath();
    x.fill();
    x.beginPath();
    x.moveTo(7, -5);
    x.lineTo(14, -13);
    x.lineTo(5, -12);
    x.closePath();
    x.fill();
  }

  function fillOrbitalMissileFlame(x, metrics) {
    x.fillStyle = `rgba(255,210,61,${0.78 + metrics.pulse * 0.18})`;
    x.beginPath();
    x.moveTo(-4, -17);
    x.lineTo(0, -30 - metrics.pulse * 7);
    x.lineTo(4, -17);
    x.closePath();
    x.fill();
  }

  function drawOrbitalMissile(x, metrics) {
    x.save();
    x.translate(metrics.missileX, metrics.missileY);
    fillOrbitalMissileBody(x);
    fillOrbitalMissileFins(x);
    fillOrbitalMissileFlame(x, metrics);
    x.restore();
  }

  function fillOrbitalLabel(x, nova, metrics) {
    x.font = 'bold 11px "Orbitron","Jua",sans-serif';
    x.textAlign = 'center';
    x.fillStyle = `rgba(255,230,150,${0.72 + metrics.pulse * 0.22})`;
    x.fillText('MISSILE', nova.x, nova.y - metrics.radius - 9);
  }

  function drawOrbitalTelegraph(x, nova) {
    const metrics = orbitalTelegraphMetrics(nova);
    x.save();
    fillOrbitalTargetArea(x, nova, metrics);
    strokeOrbitalTargetRing(x, nova, metrics);
    strokeOrbitalCrosshair(x, nova, metrics);
    strokeOrbitalMissileTrail(x, metrics);
    drawOrbitalMissile(x, metrics);
    fillOrbitalLabel(x, nova, metrics);
    x.restore();
  }

  function skyFallTelegraphMetrics(nova) {
    const arm = telegraphArm(nova);
    return {
      arm,
      markerY: nova.y - 210 * (1 - arm) - 20,
      pulse: 0.5 + Math.sin(Game.time * 20 + nova.id) * 0.5,
      radius: nova.maxR * (0.38 + arm * 0.16),
    };
  }

  function strokeSkyFallTargetRing(x, nova, metrics) {
    x.strokeStyle = `rgba(125,255,193,${0.42 + metrics.pulse * 0.22})`;
    x.lineWidth = 2 + metrics.arm * 1.8;
    x.setLineDash([6, 6]);
    x.beginPath();
    x.arc(nova.x, nova.y, metrics.radius, 0, TAU);
    x.stroke();
    x.setLineDash([]);
  }

  function strokeSkyFallCrosshair(x, nova, metrics) {
    const radius = metrics.radius;
    x.strokeStyle = `rgba(255,255,255,${0.38 + metrics.arm * 0.28})`;
    x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(nova.x - radius * 0.75, nova.y);
    x.lineTo(nova.x + radius * 0.75, nova.y);
    x.moveTo(nova.x, nova.y - radius * 0.75);
    x.lineTo(nova.x, nova.y + radius * 0.75);
    x.stroke();
  }

  function fillSkyFallMarker(x, nova, metrics) {
    x.fillStyle = `rgba(125,255,193,${0.55 + metrics.arm * 0.3})`;
    x.beginPath();
    x.moveTo(nova.x, metrics.markerY + 16);
    x.lineTo(nova.x - 6, metrics.markerY - 8);
    x.lineTo(nova.x + 6, metrics.markerY - 8);
    x.closePath();
    x.fill();
  }

  function drawSkyFallTelegraph(x, nova) {
    const metrics = skyFallTelegraphMetrics(nova);
    strokeSkyFallTargetRing(x, nova, metrics);
    strokeSkyFallCrosshair(x, nova, metrics);
    fillSkyFallMarker(x, nova, metrics);
  }

  const DelayedNovaTelegraphs = Object.freeze({
    orbital: drawOrbitalTelegraph,
    skyfall: drawSkyFallTelegraph,
  });

  function delayedNovaVisualType(nova) {
    if (nova.telegraph) return nova.telegraph;
    if (nova.missile) return 'orbital';
    if (nova.skyFall) return 'skyfall';
    return '';
  }

  function drawDelayedNova(x, nova) {
    const draw = DelayedNovaTelegraphs[delayedNovaVisualType(nova)];
    if (draw) draw(x, nova);
  }

  function fieldNovaMetrics(nova) {
    return {
      color: nova.color || '#7b5cff',
      intensity: clamp((nova.life || 0) / (nova.maxLife || nova.life || 1), 0, 1),
      pulse: 0.5 + Math.sin(Game.time * (nova.visual === 'blackhole' ? 12 : 9) + nova.id) * 0.5,
      radius: nova.r || nova.maxR || 80,
    };
  }

  function fillFieldNovaArea(x, nova, metrics) {
    const alpha = (0.06 + metrics.pulse * 0.035) * metrics.intensity;
    x.fillStyle = colorWithAlpha(metrics.color, '125,92,255', alpha);
    x.beginPath();
    x.arc(nova.x, nova.y, metrics.radius, 0, TAU);
    x.fill();
  }

  function strokeFieldNovaRing(x, nova, metrics) {
    const alpha = (0.34 + metrics.pulse * 0.24) * metrics.intensity;
    x.strokeStyle = colorWithAlpha(metrics.color, '125,92,255', alpha);
    x.lineWidth = 2.2 + metrics.pulse * 2.4;
    x.setLineDash(nova.visual === 'timerift' ? [10, 8] : []);
    x.beginPath();
    x.arc(nova.x, nova.y, metrics.radius * (0.82 + metrics.pulse * 0.05), 0, TAU);
    x.stroke();
    x.setLineDash([]);
  }

  function strokeBlackholeOrbits(x, nova, metrics) {
    x.strokeStyle = `rgba(255,255,255,${0.18 * metrics.intensity})`;
    x.lineWidth = 1.4;
    for (let orbitIndex = 0; orbitIndex < 3; orbitIndex++) {
      x.beginPath();
      x.ellipse(
        nova.x,
        nova.y,
        metrics.radius * (0.28 + orbitIndex * 0.15),
        metrics.radius * (0.08 + orbitIndex * 0.045),
        Game.time * 1.4 + orbitIndex,
        0,
        TAU,
      );
      x.stroke();
    }
  }

  function drawFieldNova(x, nova) {
    const metrics = fieldNovaMetrics(nova);
    fillFieldNovaArea(x, nova, metrics);
    strokeFieldNovaRing(x, nova, metrics);
    if (nova.visual === 'blackhole') strokeBlackholeOrbits(x, nova, metrics);
  }

  function explosionNovaMetrics(nova) {
    return {
      alpha: clamp(1 - nova.r / nova.maxR, 0, 1),
      color: nova.color || '#ff8230',
    };
  }

  function strokeExplosionOuterRing(x, nova, metrics) {
    x.strokeStyle = colorWithAlpha(metrics.color, '255,130,40', metrics.alpha * 0.85);
    x.lineWidth = 10 + nova.r * 0.05;
    x.beginPath();
    x.arc(nova.x, nova.y, nova.r, 0, TAU);
    x.stroke();
  }

  function strokeExplosionCoreRing(x, nova, metrics) {
    x.strokeStyle = `rgba(255,245,210,${metrics.alpha * 0.9})`;
    x.lineWidth = 3;
    x.beginPath();
    x.arc(nova.x, nova.y, nova.r, 0, TAU);
    x.stroke();
  }

  function drawExplosionNova(x, nova) {
    const metrics = explosionNovaMetrics(nova);
    strokeExplosionOuterRing(x, nova, metrics);
    strokeExplosionCoreRing(x, nova, metrics);
  }

  function drawNova(x, nova) {
    if (nova.delay > 0) {
      drawDelayedNova(x, nova);
      return;
    }
    if (nova.field) {
      drawFieldNova(x, nova);
      return;
    }
    drawExplosionNova(x, nova);
  }

const RenderEffectNovas = {
  draw(render, x, frame = null) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 1 - ((Game.clarityK ? Game.clarityK() : 0) * 0.34);
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => render.worldVisible(px, py, pad);
    for (const nova of Game.novas) {
      if (nova.visualHidden) continue;
      if (Game.weaponEffectHiddenForSource && Game.weaponEffectHiddenForSource(nova.source)) continue;
      if (!visible(nova.x, nova.y, novaVisibilityPad(nova))) continue;
      drawNova(x, nova);
    }
    x.restore();
  },
  visualType: delayedNovaVisualType,
};
globalThis.RenderEffectNovas = RenderEffectNovas;
}
