'use strict';
// Canvas drawing for weapon, projectile, and combat telegraph visuals.
{
  const DEFAULT_BEAM_LENGTH = 1900;
  const BOLT_SEGMENT_COUNT = 7;
  const BULLET_VISIBILITY_PAD = Object.freeze({ boom: 180, mine: 160, disc: 170 });
  const STREAK_BULLET_STYLE = Object.freeze({
    ice: Object.freeze({ tailLength: 64, glowWidth: 13, glowColor: 'rgba(174,234,255,0.52)' }),
    lance: Object.freeze({ tailLength: 58, glowWidth: 12, glowColor: 'rgba(65,240,255,0.46)' }),
  });

  function beamAlpha(beam) {
    return clamp(beam.life / (beam.maxLife || 0.32), 0, 1);
  }

  function beamLength(beam) {
    return beam.len || DEFAULT_BEAM_LENGTH;
  }

  function beamOuterColor(beam, alpha) {
    if (beam.color === '#ffffff') return `rgba(255,255,255,${alpha * 0.42})`;
    if (beam.color === '#c39bff') return `rgba(195,155,255,${alpha * 0.55})`;
    return `rgba(163,107,255,${alpha * 0.55})`;
  }

  function fillBeamOuterLayer(x, beam, alpha, length) {
    x.fillStyle = beamOuterColor(beam, alpha);
    x.fillRect(0, -beam.w / 2, length, beam.w);
  }

  function fillBeamCoreLayer(x, beam, alpha, length) {
    x.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
    x.fillRect(0, -beam.w / 6, length, beam.w / 3);
  }

  function drawBeam(x, beam) {
    const alpha = beamAlpha(beam);
    const length = beamLength(beam);
    x.save();
    x.translate(beam.x, beam.y);
    x.rotate(beam.a);
    fillBeamOuterLayer(x, beam, alpha, length);
    fillBeamCoreLayer(x, beam, alpha, length);
    x.restore();
  }

  function findOrbitWeapon() {
    return Game.player.weapons.find(w => w.id === 'orbit');
  }

  function shouldDrawOrbitBlades(weapon) {
    return Boolean(weapon) && !Game.player.dead;
  }

  function drawOrbitBladeSprite(x, sprite, position) {
    x.save();
    x.translate(position.x, position.y);
    x.rotate(Game.blades.angle * 4);
    x.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    x.restore();
  }

  function drawOrbitBlades(x, weapon) {
    const stats = weaponStats('orbit', weapon.lv);
    const player = Game.player;
    const evolved = Game.weaponEvolved && Game.weaponEvolved('orbit');
    const sprite = Sprites.shape('star', evolved ? '#7dffc1' : '#3dff8e', 13);
    x.save();
    for (const blade of WeaponAuraOrbitGeometry.bladePositions(player, stats, evolved, Game.blades.angle)) {
      drawOrbitBladeSprite(x, sprite, blade);
    }
    x.restore();
  }

  function findDroneWeapon() {
    return Game.player.weapons.find(w => w.id === 'drone');
  }

  function shouldDrawDrones(weapon) {
    return Boolean(weapon) && !Game.player.dead;
  }

  function droneAim(position, target) {
    return target ? Math.atan2(target.y - position.y, target.x - position.x) : position.angle + Math.PI / 2;
  }

  function drawDroneRotorArms(x, mobileScale) {
    const arm = x.createLinearGradient(-13 * mobileScale, -10 * mobileScale, 13 * mobileScale, 10 * mobileScale);
    arm.addColorStop(0, '#45505d');
    arm.addColorStop(0.5, '#b7c3cf');
    arm.addColorStop(1, '#303944');
    x.fillStyle = arm;
    x.strokeStyle = '#111821';
    x.lineWidth = 1.2 * mobileScale;
    const pads = [[-14, -10], [-14, 6], [4, -10], [4, 6]];
    for (const [px, py] of pads) {
      x.fillRect(px * mobileScale, py * mobileScale, 9 * mobileScale, 4 * mobileScale);
      x.strokeRect(px * mobileScale, py * mobileScale, 9 * mobileScale, 4 * mobileScale);
    }
  }

  function drawDroneBody(x, mobileScale) {
    const body = x.createLinearGradient(-11 * mobileScale, -8 * mobileScale, 11 * mobileScale, 8 * mobileScale);
    body.addColorStop(0, '#1d2630');
    body.addColorStop(0.35, '#758290');
    body.addColorStop(0.72, '#d7dde4');
    body.addColorStop(1, '#303a46');
    x.fillStyle = body;
    x.beginPath();
    x.moveTo(11 * mobileScale, 0);
    x.lineTo(5 * mobileScale, -8 * mobileScale);
    x.lineTo(-9 * mobileScale, -7 * mobileScale);
    x.lineTo(-13 * mobileScale, 0);
    x.lineTo(-9 * mobileScale, 7 * mobileScale);
    x.lineTo(5 * mobileScale, 8 * mobileScale);
    x.closePath();
    x.fill();
    x.stroke();
  }

  function dronePalette(index) {
    const colors = ['#7dffc1', '#19e3ff', '#ff2bd6', '#ffd23d', '#a36bff'];
    return colors[index % colors.length];
  }

  function drawMiniNeonDrone(x, position, mobileScale, index) {
    const pulse = 0.5 + Math.sin(Game.time * 10 + index * 1.7) * 0.5;
    const color = dronePalette(index);
    const s = mobileScale * (0.62 + pulse * 0.05);
    const aura = Sprites.glowDot(color, 12 * s, '#ffffff');
    const core = Sprites.glowDot(color, 7 * s, '#ffffff');
    x.save();
    x.translate(position.x, position.y);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.42 + pulse * 0.18;
    x.drawImage(aura, -24 * s, -24 * s, 48 * s, 48 * s);
    x.globalAlpha = 0.92;
    x.drawImage(core, -13 * s, -13 * s, 26 * s, 26 * s);
    x.globalAlpha = 1;
    x.strokeStyle = `rgba(255,255,255,${0.62 + pulse * 0.2})`;
    x.lineWidth = 1.4 * mobileScale;
    x.beginPath(); x.arc(0, 0, 7.4 * s, 0, TAU); x.stroke();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(Math.cos(position.angle) * 4.2 * s, Math.sin(position.angle) * 4.2 * s, 1.8 * s, 0, TAU); x.fill();
    x.restore();
  }

  function drawDroneSquad(x, weapon, mobileScale) {
    const stats = weaponStats('drone', weapon.lv);
    const player = Game.player;
    const count = WeaponDroneGeometry.count(stats);
    x.save();
    x.globalCompositeOperation = 'source-over';
    for (let index = 0; index < count; index++) {
      const position = WeaponDroneGeometry.mount(player, Game.time, count, index);
      if (!Render.worldVisible(position.x, position.y, 90)) continue;
      drawMiniNeonDrone(x, position, mobileScale, index);
    }
    x.restore();
  }

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

  function boltAlpha(bolt) {
    return clamp(bolt.life / 0.22, 0, 1);
  }

  function traceBoltPath(x, bolt) {
    x.beginPath();
    x.moveTo(bolt.x1, bolt.y1);
    for (let segmentIndex = 1; segmentIndex < BOLT_SEGMENT_COUNT; segmentIndex++) {
      const t = segmentIndex / BOLT_SEGMENT_COUNT;
      const mx = lerp(bolt.x1, bolt.x2, t) + rand(-16, 16) * (1 - t * 0.6);
      const my = lerp(bolt.y1, bolt.y2, t) + rand(-10, 10);
      x.lineTo(mx, my);
    }
    x.lineTo(bolt.x2, bolt.y2);
  }

  function boltGlowColor(bolt, alpha) {
    return bolt.color ? `${bolt.color}${Math.round(alpha * 128).toString(16).padStart(2, '0')}` : `rgba(255,210,61,${alpha * 0.5})`;
  }

  function strokeBoltGlow(x, bolt, alpha) {
    x.strokeStyle = boltGlowColor(bolt, alpha);
    x.lineWidth = 7;
    x.stroke();
  }

  function strokeBoltCore(x, alpha) {
    x.strokeStyle = `rgba(255,255,255,${alpha})`;
    x.lineWidth = 2.2;
    x.stroke();
  }

  function drawBolt(x, bolt) {
    const alpha = boltAlpha(bolt);
    traceBoltPath(x, bolt);
    strokeBoltGlow(x, bolt, alpha);
    strokeBoltCore(x, alpha);
  }

  Object.assign(Render, {
    drawFrost(x) {
      // 냉기 오라의 실제 효과는 유지하되, 플레이어 주변 지속 원형 표시는 숨긴다.
      return;
    },
    drawBeams(x) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (const beam of Game.beams) {
        const len = beamLength(beam);
        const x2 = beam.x + Math.cos(beam.a) * len;
        const y2 = beam.y + Math.sin(beam.a) * len;
        if (!this.segmentVisible(beam.x, beam.y, x2, y2, beam.w + 110)) continue;
        drawBeam(x, beam);
      }
      x.restore();
    },
    drawBlades(x) {
      const weapon = findOrbitWeapon();
      if (!shouldDrawOrbitBlades(weapon)) return;
      drawOrbitBlades(x, weapon);
    },
    drawDrones(x) {
      const weapon = findDroneWeapon();
      if (!shouldDrawDrones(weapon)) return;
      drawDroneSquad(x, weapon, this.mobileVisualScale());
    },
    drawBullets(x) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      const mobileScale = this.mobileVisualScale();
      for (const bullet of Game.bullets) {
        if (!this.worldVisible(bullet.x, bullet.y, bulletVisibilityPad(bullet))) continue;
        drawPlayerBullet(x, bullet, mobileScale);
      }
      x.restore();
    },
    drawEnemyBullets(x) {
      if (!Game.ebullets.length) return;
      x.save();
      x.globalCompositeOperation = 'source-over';
      const mobileScale = this.mobileVisualScale();
      for (const bullet of Game.ebullets) {
        if (!this.worldVisible(bullet.x, bullet.y, 100)) continue;
        drawEnemyBullet(x, bullet, mobileScale);
      }
      x.restore();
    },
    drawBolts(x) {
      if (!Game.bolts.length) return;
      x.save();
      x.globalCompositeOperation = 'lighter';
      for (const bolt of Game.bolts) {
        if (!this.segmentVisible(bolt.x1, bolt.y1, bolt.x2, bolt.y2, 160)) continue;
        drawBolt(x, bolt);
      }
      x.restore();
    },
  });
}
