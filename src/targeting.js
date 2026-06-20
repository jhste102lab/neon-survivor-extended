'use strict';
// Enemy target selection helpers used by weapons and the director.
function insertNearestEnemy(list, enemy, distance, limit) {
  if (!enemy || enemy.hp <= 0) return;
  let at = list.length;
  while (at > 0 && distance < list[at - 1].d) at--;
  if (at >= limit) return;
  list.splice(at, 0, { e: enemy, d: distance });
  if (list.length > limit) list.pop();
}

function targetCacheUsable(game, x, y, maxR) {
  const cache = game.frameTargets;
  if (!cache || !game.player) return false;
  if (cache.frame !== game.frameSeq && cache.frame !== game.frameSeq - 1) return false;
  if (maxR > cache.radius) return false;
  return dist2(x, y, game.player.x, game.player.y) < 180 * 180;
}

function insertStrongEnemy(list, enemy, score, limit) {
  if (!enemy || enemy.hp <= 0) return;
  let at = list.length;
  while (at > 0 && score > list[at - 1].score) at--;
  if (at >= limit) return;
  list.splice(at, 0, { e: enemy, score });
  if (list.length > limit) list.pop();
}

function enemyInsideBounds(enemy, bounds) {
  return enemy.x >= bounds.l && enemy.x <= bounds.r && enemy.y >= bounds.t && enemy.y <= bounds.b;
}

function visitEnemyCandidates(game, x, y, maxR, fn) {
  if (targetCacheUsable(game, x, y, maxR)) {
    for (const e of game.frameTargets.near) fn(e);
  } else if (typeof Grid !== 'undefined' && Grid.map && Grid.map.size) {
    Grid.forEachInCircle(x, y, maxR, fn);
  } else {
    for (const e of game.enemies) fn(e);
  }
}

Object.assign(Game, {
  refreshFrameTargetCache() {
    const p = this.player;
    if (!p) return null;
    const radius = 1450;
    const r2 = radius * radius;
    const near = [];
    let strongest = null, strongestScore = -1;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist2(p.x, p.y, e.x, e.y);
      const score = e.hp + (e.boss ? 1e9 : 0) + (e.elite ? 1e5 : 0);
      if (d < 1300 * 1300 && score > strongestScore) { strongestScore = score; strongest = e; }
      if (d <= r2) near.push(e);
    }
    this.frameTargets = { frame: this.frameSeq, x: p.x, y: p.y, radius, near, strongest };
    return this.frameTargets;
  },

  targetViewBounds(pad = 260) {
    if (typeof Render !== 'undefined' && Render && Render.w > 0 && Render.h > 0 && typeof Render.viewBounds === 'function') {
      return Render.viewBounds(pad);
    }
    const p = this.player || { x: 0, y: 0 };
    const cam = this.cam || p;
    const half = typeof GameRuntime !== 'undefined' && GameRuntime.viewportHalf
      ? GameRuntime.viewportHalf(pad)
      : { w: 640 + pad, h: 360 + pad };
    const cx = Number.isFinite(cam.x) ? cam.x : (p.x || 0);
    const cy = Number.isFinite(cam.y) ? cam.y : (p.y || 0);
    return { l: cx - half.w, r: cx + half.w, t: cy - half.h, b: cy + half.h };
  },

  nearestVisibleEnemies(x, y, n, maxR, pad = 260) {
    const limit = Math.max(1, n | 0);
    const best = [];
    const bounds = this.targetViewBounds(pad);
    const mr2 = maxR * maxR;
    visitEnemyCandidates(this, x, y, maxR, e => {
      if (!e || e.hp <= 0 || !enemyInsideBounds(e, bounds)) return;
      const dx = x - e.x, dy = y - e.y;
      const d = dx * dx + dy * dy;
      if (d < mr2) insertNearestEnemy(best, e, d, limit);
    });
    return best.map(o => o.e);
  },

  strongestVisibleEnemies(n = 1, maxR = 1300, pad = 260) {
    const p = this.player;
    if (!p) return [];
    const limit = Math.max(1, n | 0);
    const best = [];
    const bounds = this.targetViewBounds(pad);
    const mr2 = maxR * maxR;
    visitEnemyCandidates(this, p.x, p.y, maxR, e => {
      if (!e || e.hp <= 0 || !enemyInsideBounds(e, bounds)) return;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = dx * dx + dy * dy;
      if (d > mr2) return;
      const score = e.hp + (e.boss ? 1e9 : 0) + (e.elite ? 1e5 : 0) - d * 0.000001;
      insertStrongEnemy(best, e, score, limit);
    });
    return best.map(o => o.e);
  },

  visibleOrNearestEnemies(x, y, n, maxR, pad = 260) {
    const visible = this.nearestVisibleEnemies(x, y, n, maxR, pad);
    return visible.length ? visible : this.nearestEnemies(x, y, n, maxR);
  },

  strongestVisibleOrNearest(maxR = 1300, pad = 260) {
    const p = this.player;
    if (!p) return null;
    return this.strongestVisibleEnemies(1, maxR, pad)[0]
      || this.nearestEnemies(p.x, p.y, 1, maxR)[0]
      || null;
  },

  randomVisibleOrNearestEnemy(maxR = 1200, pad = 260, count = 64) {
    const p = this.player;
    if (!p) return null;
    const candidates = this.visibleOrNearestEnemies(p.x, p.y, count, maxR, pad);
    return candidates.length ? pick(candidates) : null;
  },

  nearestEnemies(x, y, n, maxR) {
    const limit = Math.max(1, n | 0);
    const best = [];
    const mr2 = maxR * maxR;
    const visit = e => {
      const dx = x - e.x, dy = y - e.y;
      const d = dx * dx + dy * dy;
      if (d < mr2) insertNearestEnemy(best, e, d, limit);
    };
    visitEnemyCandidates(this, x, y, maxR, visit);
    return best.map(o => o.e);
  },

  randomEnemy() {
    if (!this.enemies.length) return null;
    const cache = this.frameTargets;
    if (cache && (cache.frame === this.frameSeq || cache.frame === this.frameSeq - 1) && cache.near && cache.near.length && RNG.next() < 0.72) return pick(cache.near);
    return pick(this.enemies);
  },

  strongestEnemy() {
    const cache = this.frameTargets;
    if (cache && (cache.frame === this.frameSeq || cache.frame === this.frameSeq - 1)) return cache.strongest;
    let best = null, bh = -1;
    for (const e of this.enemies) {
      const score = e.hp + (e.boss ? 1e9 : 0) + (e.elite ? 1e5 : 0);
      if (score > bh && dist2(this.player.x, this.player.y, e.x, e.y) < 1100 * 1100) { bh = score; best = e; }
    }
    return best;
  },

  /* ---------- 적 스폰 디렉터 ---------- */
});
