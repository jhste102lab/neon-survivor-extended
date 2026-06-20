'use strict';
// Player bullet movement and per-kind travel behavior.
function mineTouchesEnemy(game, b, triggerR) {
  const extra = game.boss && game.boss.hp > 0 ? 76 : 48;
  const r = triggerR + extra;
  const r2 = r * r;
  const test = (e, d2) => {
    if (e.hp <= 0) return false;
    const hitR = triggerR + e.r;
    return d2 <= hitR * hitR;
  };
  if (typeof Grid !== 'undefined' && Grid.map && Grid.map.size) {
    const c = Grid.cell;
    const x0 = Math.floor((b.x - r) / c), x1 = Math.floor((b.x + r) / c);
    const y0 = Math.floor((b.y - r) / c), y1 = Math.floor((b.y + r) / c);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const arr = Grid.map.get(Grid.key(cx, cy));
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        const dx = b.x - e.x, dy = b.y - e.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r2 && test(e, d2)) return true;
      }
    }
    return false;
  }
  for (const e of game.enemies) {
    const dx = b.x - e.x, dy = b.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= r2 && test(e, d2)) return true;
  }
  return false;
}

const PlayerBulletMovement = {
  expiredAfterTick(b, dt) {
    b.life -= dt;
    return b.life <= 0;
  },

  mineTriggered(game, b, dt) {
    b.arm = Math.max(0, (b.arm || 0) - dt);
    if (b.arm > 0) return false;

    return mineTouchesEnemy(game, b, b.trigger || 42);
  },

  boomerangReturned(game, b, dt) {
    if (b.phase === 0) {
      this.moveBoomerangOutward(b, dt);
      return { returned: false, outcomes: [] };
    }

    return this.moveBoomerangTowardPlayer(game, b, dt);
  },

  moveBoomerangOutward(b, dt) {
    b.speed = Math.max(140, b.speed - 620 * dt);
    b.x += b.dx * b.speed * dt;
    b.y += b.dy * b.speed * dt;
    b.dist += b.speed * dt;
    if (b.dist >= b.maxDist) b.phase = 1;
  },

  moveBoomerangTowardPlayer(game, b, dt) {
    const px = game.player.x, py = game.player.y;
    const d = Math.hypot(px - b.x, py - b.y) || 1;
    b.speed = Math.min(760, b.speed + 1500 * dt);
    b.x += (px - b.x) / d * b.speed * dt;
    b.y += (py - b.y) / d * b.speed * dt;
    if (d >= 28) return { returned: false, outcomes: [] };

    return { returned: true, outcomes: this.boomerangReturnOutcomes(b) };
  },

  boomerangReturnOutcomes(b) {
    if (!b.evolved) return [];
    return [{ type: 'healPlayer', hp: 2.5, barrier: 3.5, maxBarrier: 42 }];
  },

  moveStandard(game, b, dt) {
    const outcomes = [];
    if (b.kind === 'missile') outcomes.push(...this.guideMissile(game, b, dt));
    if (b.kind === 'disc') outcomes.push(...this.bounceDisc(game, b));
    this.advanceLinear(b, dt);
    if (b.kind === 'disc') outcomes.push(...this.bounceDisc(game, b));
    return { outcomes };
  },

  guideMissile(game, b, dt) {
    if (b.t > 0) b.t -= dt;
    if (!b.target || b.target.hp <= 0) {
      b.target = game.randomVisibleOrNearestEnemy ? game.randomVisibleOrNearestEnemy(1200, 260) : game.randomEnemy();
    }
    if (b.target) this.turnMissileTowardTarget(b, dt);
    const trail = this.missileTrailOutcome(game, b);
    return trail ? [trail] : [];
  },

  turnMissileTowardTarget(b, dt) {
    const ta = Math.atan2(b.target.y - b.y, b.target.x - b.x);
    const ca = Math.atan2(b.vy, b.vx);
    let diff = ta - ca;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    const na = ca + clamp(diff, -b.turn * dt, b.turn * dt);
    const sp = Math.min(520, Math.hypot(b.vx, b.vy) + 480 * dt);
    b.vx = Math.cos(na) * sp;
    b.vy = Math.sin(na) * sp;
  },

  missileTrailOutcome(game, b) {
    const trailChance = game.isMobileRuntime && game.isMobileRuntime()
      ? lerp(0.22, 0.08, clamp((game.time - (CFG.lateRampStart || 420)) / 240, 0, 1))
      : 0.5;
    if (RNG.next() >= trailChance) return null;
    return { type: 'particle', x: b.x, y: b.y, vx: rand(-15, 15), vy: rand(-15, 15), life: 0.3, size: 6, color: '#ff2bd6', alpha: 0.9 };
  },

  advanceLinear(b, dt) {
    b.x += (b.vx || 0) * dt;
    b.y += (b.vy || 0) * dt;
  },

  bounceDisc(game, b) {
    const outcomes = [];
    const view = GameRuntime.viewportHalf ? GameRuntime.viewportHalf() : { w: 960, h: 540 };
    const pad = 90;
    const left = game.cam.x - view.w - pad, right = game.cam.x + view.w + pad;
    const top = game.cam.y - view.h - pad, bottom = game.cam.y + view.h + pad;
    let bounced = false;
    if ((b.x < left && b.vx < 0) || (b.x > right && b.vx > 0)) {
      b.vx *= -1;
      b.x = clamp(b.x, left, right);
      bounced = true;
    }
    if ((b.y < top && b.vy < 0) || (b.y > bottom && b.vy > 0)) {
      b.vy *= -1;
      b.y = clamp(b.y, top, bottom);
      bounced = true;
    }
    if (bounced) outcomes.push(...this.evolvedDiscBounceOutcomes(game, b));
    return outcomes;
  },

  evolvedDiscBounceOutcomes(game, b) {
    if (!b.evolved) return [];
    b.bounces = (b.bounces || 0) + 1;
    b.dmg = Math.min((b.baseDmg || b.dmg) * 1.32, b.dmg * 1.045);
    if (b.splitDone || b.childDisc || b.bounces < 3) return [];
    b.splitDone = true;
    if (game.bullets.filter(x => x && x.childDisc).length >= 4) return [];
    const a = Math.atan2(b.vy || 0, b.vx || 1) + Math.PI / 2;
    return [{ type: 'spawnPlayerBullet', bullet: {
      kind: 'disc', source: 'weapon:ricochet:evolved:split', hitOnce: true, childDisc: true,
      x: b.x, y: b.y, vx: Math.cos(a) * Math.hypot(b.vx || 0, b.vy || 0) * 0.92, vy: Math.sin(a) * Math.hypot(b.vx || 0, b.vy || 0) * 0.92,
      r: Math.max(8, (b.r || 13) * 0.72), dmg: (b.baseDmg || b.dmg) * 0.42, baseDmg: (b.baseDmg || b.dmg) * 0.42,
      pierce: Math.max(3, Math.floor((b.pierce || 8) * 0.45)), life: Math.min(2.4, b.life), kb: 85, color: '#d9fbff',
    } }];
  },
};
