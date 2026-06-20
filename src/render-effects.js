'use strict';
// Canvas drawing for transient explosions, particles, and floating text.
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



  function drawMegaAbsorbGhost(x, ghost) {
    const ageK = clamp((ghost.maxLife - ghost.life) / ghost.maxLife, 0, 1);
    const alpha = clamp(ghost.life / ghost.maxLife, 0, 1) * (0.78 + ageK * 0.22);
    const scale = 1 - ageK * 0.35;
    const sprite = Sprites.shape(ghost.shape || 'circle', ghost.color || '#ff2bd6', ghost.r * scale);
    x.save();
    x.translate(ghost.x, ghost.y);
    x.rotate((ghost.spin || 1) * ageK * TAU * 1.35);
    x.globalAlpha = alpha;
    const size = sprite.width;
    x.drawImage(sprite, -size / 2, -size / 2, size, size);
    x.strokeStyle = `rgba(255,255,255,${0.18 * alpha})`;
    x.lineWidth = 1.5;
    x.beginPath(); x.arc(0, 0, ghost.r * (1.2 + ageK * 0.35), 0, TAU); x.stroke();
    x.restore();
  }

  function particleAlpha(particle) {
    return Math.min(1, particle.life / particle.maxLife * 1.4);
  }

  function particleDrawSize(particle) {
    return particle.size * 3.2 * (particle.life / particle.maxLife) + 2;
  }

  function drawParticle(x, particle) {
    const sprite = Sprites.glowDot(particle.color, 8);
    const size = particleDrawSize(particle);
    x.globalAlpha = particleAlpha(particle);
    x.drawImage(sprite, particle.x - size / 2, particle.y - size / 2, size, size);
  }

  function textAlpha(text) {
    return clamp(text.life / 0.7, 0, 1);
  }

  function textFont(text) {
    return text.crit ? 'bold 17px Arial' : 'bold 13px Arial';
  }

  function fillTextShadow(x, text) {
    x.fillStyle = 'rgba(0,0,0,0.6)';
    x.fillText(text.txt, text.x + 1.5, text.y + 1.5);
  }

  function fillTextFace(x, text) {
    x.fillStyle = text.color;
    x.fillText(text.txt, text.x, text.y);
  }

  function fillCritLabel(x, text) {
    if (!text.crit) return;
    x.font = 'bold 10px Arial';
    x.fillText('CRIT!', text.x, text.y - 14);
  }

  function drawFloatingText(x, text) {
    x.font = textFont(text);
    x.globalAlpha = textAlpha(text);
    fillTextShadow(x, text);
    fillTextFace(x, text);
    fillCritLabel(x, text);
  }

  Object.assign(Render, {
    drawNovas(x) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (const nova of Game.novas) {
        if (!this.worldVisible(nova.x, nova.y, novaVisibilityPad(nova))) continue;
        drawNova(x, nova);
      }
      x.restore();
    },
    drawMegaAbsorbs(x) {
      if (!Game.megaAbsorbs || !Game.megaAbsorbs.length) return;
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (const ghost of Game.megaAbsorbs) {
        if (!this.worldVisible(ghost.x, ghost.y, 180)) continue;
        drawMegaAbsorbGhost(x, ghost);
      }
      x.restore();
    },
    drawParticles(x) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (const particle of Game.particles) {
        if (!this.worldVisible(particle.x, particle.y, 90)) continue;
        drawParticle(x, particle);
      }
      x.restore();
    },
    drawTexts(x) {
      x.save();
      x.textAlign = 'center';
      for (const text of Game.texts) {
        if (!this.worldVisible(text.x, text.y, 70)) continue;
        drawFloatingText(x, text);
      }
      x.restore();
    },
  });
}
