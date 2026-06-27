'use strict';
// Player and enemy projectile rendering.
{
  const BULLET_VISIBILITY_PAD = Object.freeze({ boom: 180, mine: 160, disc: 170 });
  const STREAK_BULLET_STYLE = Object.freeze({
    ice: Object.freeze({ tailLength: 64, glowWidth: 13, glowColor: 'rgba(174,234,255,0.52)' }),
    lance: Object.freeze({ tailLength: 58, glowWidth: 12, glowColor: 'rgba(65,240,255,0.46)' }),
  });
  function bulletVisibilityPad(bullet) {
    return BULLET_VISIBILITY_PAD[bullet.kind] || 120;
  }

  function bulletDirection(bullet) {
    const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
    return { x: bullet.vx / speed, y: bullet.vy / speed };
  }

  function drawBoomBullet(x, bullet, mobileScale) {
    const sprite = Sprites.shape('star', bullet.evolved ? '#ffdf7d' : '#ffd23d', 15 * mobileScale);
    x.save();
    x.translate(bullet.x, bullet.y);
    x.rotate(Game.time * 14);
    x.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    x.restore();
  }

  function drawStreakBulletGlow(x, bullet, direction, length, mobileScale, style) {
    x.strokeStyle = style.glowColor;
    x.lineWidth = style.glowWidth * mobileScale;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(bullet.x - direction.x * length, bullet.y - direction.y * length);
    x.lineTo(bullet.x + direction.x * 18 * mobileScale, bullet.y + direction.y * 18 * mobileScale);
    x.stroke();
  }

  function drawStreakBulletCore(x, bullet, direction, length, mobileScale) {
    x.strokeStyle = 'rgba(255,255,255,0.92)';
    x.lineWidth = 3.2 * mobileScale;
    x.beginPath();
    x.moveTo(bullet.x - direction.x * length * 0.55, bullet.y - direction.y * length * 0.55);
    x.lineTo(bullet.x + direction.x * 21 * mobileScale, bullet.y + direction.y * 21 * mobileScale);
    x.stroke();
  }

  function drawStreakBullet(x, bullet, mobileScale) {
    const style = STREAK_BULLET_STYLE[bullet.kind];
    const direction = bulletDirection(bullet);
    const length = style.tailLength * mobileScale;
    drawStreakBulletGlow(x, bullet, direction, length, mobileScale, style);
    drawStreakBulletCore(x, bullet, direction, length, mobileScale);
  }

  function drawDroneBulletTracer(x, bullet, direction, mobileScale) {
    const tail = 30 * mobileScale;
    x.strokeStyle = 'rgba(125,255,193,0.30)';
    x.lineWidth = 4.5 * mobileScale;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(bullet.x - direction.x * tail, bullet.y - direction.y * tail);
    x.lineTo(bullet.x - direction.x * 5 * mobileScale, bullet.y - direction.y * 5 * mobileScale);
    x.stroke();
  }

  function droneBulletBodyGradient(x, mobileScale) {
    const body = x.createLinearGradient(-10 * mobileScale, -4 * mobileScale, 10 * mobileScale, 4 * mobileScale);
    body.addColorStop(0, '#5a3514');
    body.addColorStop(0.28, '#b7742d');
    body.addColorStop(0.62, '#f0c56f');
    body.addColorStop(1, '#fff1b8');
    return body;
  }

  function fillDroneBulletCasing(x, mobileScale) {
    x.fillStyle = droneBulletBodyGradient(x, mobileScale);
    x.strokeStyle = '#211407';
    x.lineWidth = 1 * mobileScale;
    x.beginPath();
    x.moveTo(12 * mobileScale, 0);
    x.lineTo(4 * mobileScale, -4 * mobileScale);
    x.lineTo(-10 * mobileScale, -3.2 * mobileScale);
    x.lineTo(-12 * mobileScale, 0);
    x.lineTo(-10 * mobileScale, 3.2 * mobileScale);
    x.lineTo(4 * mobileScale, 4 * mobileScale);
    x.closePath();
    x.fill();
    x.stroke();
  }

  function fillDroneBulletNose(x, mobileScale) {
    x.fillStyle = '#eef2f7';
    x.beginPath();
    x.moveTo(13 * mobileScale, 0);
    x.lineTo(5 * mobileScale, -2.6 * mobileScale);
    x.lineTo(5 * mobileScale, 2.6 * mobileScale);
    x.closePath();
    x.fill();
  }

  function strokeDroneBulletHighlight(x, mobileScale) {
    x.strokeStyle = 'rgba(255,255,255,0.5)';
    x.lineWidth = 0.8 * mobileScale;
    x.beginPath();
    x.moveTo(-7 * mobileScale, -1.6 * mobileScale);
    x.lineTo(2 * mobileScale, -2.1 * mobileScale);
    x.stroke();
  }

  function drawDroneBulletBody(x, bullet, mobileScale) {
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.translate(bullet.x, bullet.y);
    x.rotate(Math.atan2(bullet.vy, bullet.vx));
    fillDroneBulletCasing(x, mobileScale);
    fillDroneBulletNose(x, mobileScale);
    strokeDroneBulletHighlight(x, mobileScale);
    x.restore();
  }

  function drawDroneBullet(x, bullet, mobileScale) {
    const direction = bulletDirection(bullet);
    drawDroneBulletTracer(x, bullet, direction, mobileScale);
    drawDroneBulletBody(x, bullet, mobileScale);
  }

  function drawMissileGlow(x, bullet, mobileScale) {
    const sprite = Sprites.glowDot(bullet.color || '#ff2bd6', 8 * mobileScale);
    x.drawImage(sprite, bullet.x - 20 * mobileScale, bullet.y - 20 * mobileScale, 40 * mobileScale, 40 * mobileScale);
  }

  function drawMissileBody(x, bullet) {
    x.save();
    x.translate(bullet.x, bullet.y);
    x.rotate(Math.atan2(bullet.vy, bullet.vx));
    x.fillStyle = '#fff';
    x.beginPath();
    x.moveTo(9, 0);
    x.lineTo(-6, -4.5);
    x.lineTo(-6, 4.5);
    x.closePath();
    x.fill();
    x.restore();
  }

  function drawMissileBullet(x, bullet, mobileScale) {
    drawMissileGlow(x, bullet, mobileScale);
    drawMissileBody(x, bullet);
  }

  function minePulse(bullet) {
    return 0.5 + Math.sin(Game.time * 10 + bullet.x * 0.01) * 0.5;
  }

  function drawMineGlow(x, bullet, mobileScale, pulse) {
    const sprite = Sprites.glowDot(bullet.color || '#41f0ff', (6 + pulse * 2) * mobileScale);
    x.drawImage(sprite, bullet.x - 16 * mobileScale, bullet.y - 16 * mobileScale, 32 * mobileScale, 32 * mobileScale);
  }

  function drawMineBody(x, bullet, mobileScale) {
    x.save();
    x.translate(bullet.x, bullet.y);
    x.rotate(Math.PI / 4);
    x.fillStyle = bullet.arm > 0 ? 'rgba(255,255,255,0.75)' : '#eaffff';
    x.fillRect(-5 * mobileScale, -5 * mobileScale, 10 * mobileScale, 10 * mobileScale);
    x.restore();
  }

  function drawMineBullet(x, bullet, mobileScale) {
    const pulse = minePulse(bullet);
    drawMineGlow(x, bullet, mobileScale, pulse);
    drawMineBody(x, bullet, mobileScale);
  }

  function drawDiscRing(x, radius, mobileScale) {
    x.strokeStyle = 'rgba(159,243,255,0.78)';
    x.lineWidth = 3 * mobileScale;
    x.beginPath();
    x.arc(0, 0, radius, 0, TAU);
    x.stroke();
  }

  function drawDiscCross(x, radius) {
    x.strokeStyle = 'rgba(255,255,255,0.9)';
    x.beginPath();
    x.moveTo(-radius, 0);
    x.lineTo(radius, 0);
    x.moveTo(0, -radius);
    x.lineTo(0, radius);
    x.stroke();
  }

  function drawDiscBullet(x, bullet, mobileScale) {
    const radius = (bullet.r || 13) * mobileScale;
    x.save();
    x.translate(bullet.x, bullet.y);
    x.rotate(Game.time * 10);
    drawDiscRing(x, radius, mobileScale);
    drawDiscCross(x, radius);
    x.restore();
  }

  function drawSawBullet(x, bullet, mobileScale) {
    const sprite = Sprites.shape('star', bullet.color || '#d9f4ff', (bullet.r || 18) * mobileScale);
    x.save();
    x.translate(bullet.x, bullet.y);
    x.rotate(Game.time * 18);
    x.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    x.restore();
  }

  function drawFeatherTrail(x, bullet, direction, tailLength, mobileScale) {
    x.strokeStyle = 'rgba(255,122,43,0.58)';
    x.lineWidth = 8 * mobileScale;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(bullet.x - direction.x * tailLength, bullet.y - direction.y * tailLength);
    x.lineTo(bullet.x + direction.x * 8 * mobileScale, bullet.y + direction.y * 8 * mobileScale);
    x.stroke();
  }

  function drawFeatherCore(x, bullet, mobileScale) {
    x.fillStyle = '#fff4d0';
    x.beginPath();
    x.arc(bullet.x, bullet.y, 3.2 * mobileScale, 0, TAU);
    x.fill();
  }

  function drawFeatherBullet(x, bullet, mobileScale) {
    const direction = bulletDirection(bullet);
    const tailLength = 22 * mobileScale;
    drawFeatherTrail(x, bullet, direction, tailLength, mobileScale);
    drawFeatherCore(x, bullet, mobileScale);
  }

  function drawDefaultBullet(x, bullet, mobileScale) {
    const sprite = Sprites.glowDot(bullet.color || '#19e3ff', bullet.r * mobileScale);
    const size = bullet.r * 5 * mobileScale;
    x.drawImage(sprite, bullet.x - size / 2, bullet.y - size / 2, size, size);
  }

  const PLAYER_BULLET_RENDERERS = Object.freeze({
    boom: drawBoomBullet,
    disc: drawDiscBullet,
    drone: drawDroneBullet,
    feather: drawFeatherBullet,
    ice: drawStreakBullet,
    lance: drawStreakBullet,
    mine: drawMineBullet,
    missile: drawMissileBullet,
    saw: drawSawBullet,
  });

  function drawPlayerBullet(x, bullet, mobileScale) {
    const drawByKind = PLAYER_BULLET_RENDERERS[bullet.kind] || drawDefaultBullet;
    drawByKind(x, bullet, mobileScale);
  }

  function enemyBulletMetrics(bullet, mobileScale) {
    const direction = bulletDirection(bullet);
    const age = bullet.age || 0;
    const pulse = 0.5 + Math.sin(Game.time * 18 + age * 9) * 0.5;
    const fadeIn = clamp(age / 0.16, 0.25, 1);
    const hue = (Game.time * 150 + age * 210 + (bullet.kind === 'ring' ? 42 : 0)) % 360;
    return {
      age,
      coreRadius: Math.max(3.2, bullet.r * 0.78) * mobileScale,
      direction,
      fadeIn,
      glowRadius: (bullet.r + 9 + pulse * 3) * mobileScale,
      hue,
      pulse,
      tailLength: (24 + pulse * 4) * mobileScale,
    };
  }

  function enemyBulletPalette(metrics) {
    return {
      glow: `hsla(${Math.round((metrics.hue + 68) % 360)},100%,54%,0)`,
      hot: `hsla(${Math.round(metrics.hue)},100%,66%,${0.95 * metrics.fadeIn})`,
      mid: `hsla(${Math.round((metrics.hue + 34) % 360)},100%,58%,${0.78 * metrics.fadeIn})`,
    };
  }

  function drawEnemyBulletTail(x, bullet, metrics, palette, mobileScale) {
    // 외곽선 대신 색상 변화가 큰 그라데이션 점+꼬리로만 식별성을 준다.
    const direction = metrics.direction;
    const tail = x.createLinearGradient(
      bullet.x - direction.x * metrics.tailLength,
      bullet.y - direction.y * metrics.tailLength,
      bullet.x,
      bullet.y,
    );
    tail.addColorStop(0, 'rgba(255,255,255,0)');
    tail.addColorStop(0.45, palette.mid);
    tail.addColorStop(1, palette.hot);
    x.strokeStyle = tail;
    x.lineWidth = Math.max(2.8, bullet.r * 0.55) * mobileScale;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(bullet.x - direction.x * metrics.tailLength, bullet.y - direction.y * metrics.tailLength);
    x.lineTo(bullet.x - direction.x * (bullet.r * 0.3) * mobileScale, bullet.y - direction.y * (bullet.r * 0.3) * mobileScale);
    x.stroke();
  }

  function drawEnemyBulletHalo(x, bullet, metrics, palette) {
    const halo = x.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, metrics.glowRadius);
    halo.addColorStop(0, `rgba(255,255,255,${0.92 * metrics.fadeIn})`);
    halo.addColorStop(0.22, palette.hot);
    halo.addColorStop(0.62, palette.mid);
    halo.addColorStop(1, palette.glow);
    x.fillStyle = halo;
    x.beginPath();
    x.arc(bullet.x, bullet.y, metrics.glowRadius, 0, TAU);
    x.fill();
  }

  function drawEnemyBulletCore(x, bullet, metrics, palette) {
    const direction = metrics.direction;
    const core = x.createRadialGradient(
      bullet.x - direction.x * metrics.coreRadius * 0.35,
      bullet.y - direction.y * metrics.coreRadius * 0.35,
      0,
      bullet.x,
      bullet.y,
      metrics.coreRadius * 1.35,
    );
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.42, palette.hot);
    core.addColorStop(1, palette.mid);
    x.fillStyle = core;
    x.beginPath();
    x.arc(bullet.x, bullet.y, metrics.coreRadius, 0, TAU);
    x.fill();
  }

  function drawEnemyBullet(x, bullet, mobileScale) {
    const metrics = enemyBulletMetrics(bullet, mobileScale);
    const palette = enemyBulletPalette(metrics);
    drawEnemyBulletTail(x, bullet, metrics, palette, mobileScale);
    drawEnemyBulletHalo(x, bullet, metrics, palette);
    drawEnemyBulletCore(x, bullet, metrics, palette);
  }

  function shouldSimplifyEnemyBullets() {
    const pressure = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.visualPressure() : 0;
    return Game.ebullets.length >= 36 || pressure >= 0.16;
  }

  function drawSimpleEnemyBullet(x, bullet, mobileScale) {
    const direction = bulletDirection(bullet);
    const r = Math.max(3, bullet.r * mobileScale);
    x.strokeStyle = 'rgba(255,77,94,0.46)';
    x.lineWidth = Math.max(2, r * 0.58);
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(bullet.x - direction.x * 18 * mobileScale, bullet.y - direction.y * 18 * mobileScale);
    x.lineTo(bullet.x, bullet.y);
    x.stroke();
    x.fillStyle = '#ff4d5e';
    x.beginPath();
    x.arc(bullet.x, bullet.y, r, 0, TAU);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.beginPath();
    x.arc(bullet.x - direction.x * r * 0.3, bullet.y - direction.y * r * 0.3, Math.max(1.4, r * 0.36), 0, TAU);
    x.fill();
  }

const RenderCombatProjectiles = {
  drawPlayerBullets(render, x, frame = null) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 1 - ((Game.clarityK ? Game.clarityK() : 0) * 0.52);
    const mobileScale = frame ? frame.mobileScale : render.mobileVisualScale();
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => render.worldVisible(px, py, pad);
    for (const bullet of Game.bullets) {
      if (bullet.visualHidden) continue;
      if (Game.weaponEffectHiddenForSource && Game.weaponEffectHiddenForSource(bullet.source)) continue;
      if (!visible(bullet.x, bullet.y, bulletVisibilityPad(bullet))) continue;
      drawPlayerBullet(x, bullet, mobileScale);
    }
    x.restore();
  },

  drawEnemyBullets(render, x, frame = null) {
    if (!Game.ebullets.length) return;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const mobileScale = frame ? frame.mobileScale : render.mobileVisualScale();
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => render.worldVisible(px, py, pad);
    const simplified = shouldSimplifyEnemyBullets();
    for (const bullet of Game.ebullets) {
      if (!visible(bullet.x, bullet.y, 100)) continue;
      if (simplified) drawSimpleEnemyBullet(x, bullet, mobileScale);
      else drawEnemyBullet(x, bullet, mobileScale);
    }
    x.restore();
  },
};
globalThis.RenderCombatProjectiles = RenderCombatProjectiles;
}
