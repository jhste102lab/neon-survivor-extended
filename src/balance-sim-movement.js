'use strict';
// Headless movement policies for BalanceSim.
function normalizeSimMove(vx, vy) {
  if (!vx && !vy) { vx = Math.cos(Game.time * 0.7); vy = Math.sin(Game.time * 0.7); }
  const len = Math.hypot(vx, vy) || 1;
  return { x: vx / len, y: vy / len };
}

function avoidSimEnemies(p) {
  let vx = 0, vy = 0, nearest = null, nd2 = Infinity;
  for (const e of Game.enemies) {
    const d = dist2(p.x, p.y, e.x, e.y);
    if (d < nd2) { nearest = e; nd2 = d; }
    const radius = e.boss ? 430 : e.elite ? 300 : 230;
    if (d < radius * radius) {
      const dist = Math.sqrt(d) || 1;
      const weight = (radius - dist) / radius * (e.boss ? 2.2 : e.elite ? 1.7 : 1.25);
      vx += (p.x - e.x) / dist * weight;
      vy += (p.y - e.y) / dist * weight;
    }
  }
  if (nearest) {
    const d = Math.sqrt(nd2) || 1;
    const danger = nearest.boss ? 360 : 170;
    if (d < danger) {
      vx += (p.x - nearest.x) / d * (nearest.boss ? 1.4 : 1.1);
      vy += (p.y - nearest.y) / d * (nearest.boss ? 1.4 : 1.1);
    }
  }
  return { vx, vy };
}

function avoidSimEnemyBullets(p) {
  let vx = 0, vy = 0;
  for (const b of Game.ebullets) {
    const d2 = dist2(p.x, p.y, b.x, b.y);
    if (d2 < 210 * 210) {
      const d = Math.sqrt(d2) || 1;
      vx += (p.x - b.x) / d * 1.7;
      vy += (p.y - b.y) / d * 1.7;
    }
  }
  return { vx, vy };
}

function avoidSimHazards(p) {
  let vx = 0, vy = 0;
  for (const h of Game.hazards || []) {
    const d2 = dist2(p.x, p.y, h.x, h.y);
    const radius = (h.r || 50) + 95;
    if (d2 < radius * radius) {
      const d = Math.sqrt(d2) || 1;
      vx += (p.x - h.x) / d * (h.warn > 0 ? 1.0 : 1.8);
      vy += (p.y - h.y) / d * (h.warn > 0 ? 1.0 : 1.8);
    }
  }
  return { vx, vy };
}

function findSimPickupTarget(p) {
  const wantedDrop = Game.drops.find(d => d.kind === 'chest' || d.kind === 'magnet' || (d.kind === 'chicken' && p.hp < Game.stat().maxHp * 0.55));
  if (wantedDrop) return wantedDrop;
  let target = null, td2 = Infinity;
  for (const g of Game.gems) {
    const d = dist2(p.x, p.y, g.x, g.y);
    if (d < td2 && d < 920 * 920) { target = g; td2 = d; }
  }
  return target;
}

function seekSimPickups(p) {
  const target = findSimPickupTarget(p);
  if (!target) return { vx: 0, vy: 0 };
  const d = Math.hypot(target.x - p.x, target.y - p.y) || 1;
  return { vx: (target.x - p.x) / d * 1.05, vy: (target.y - p.y) / d * 1.05 };
}

function makeRandomWalkPolicy(state) {
  return () => {
    state.timer -= 1 / 30;
    if (state.timer <= 0) { state.timer = rand(0.55, 1.15); state.angle = rand(0, TAU); }
    return { x: Math.cos(state.angle), y: Math.sin(state.angle) };
  };
}

function makeKiteCollectPolicy(name) {
  return () => {
    const p = Game.player;
    let { vx, vy } = avoidSimEnemies(p);
    const bullets = avoidSimEnemyBullets(p);
    vx += bullets.vx; vy += bullets.vy;
    const hazards = avoidSimHazards(p);
    vx += hazards.vx; vy += hazards.vy;
    if (name === 'kiteCollect') {
      const pickups = seekSimPickups(p);
      vx += pickups.vx; vy += pickups.vy;
    }
    return normalizeSimMove(vx, vy);
  };
}

Object.assign(BalanceSim, {
  makeMovePolicy(name) {
    if (name === 'idle') return () => ({ x: 0, y: 0 });
    if (name === 'randomWalk') return makeRandomWalkPolicy({ angle: 0, timer: 0 });
    return makeKiteCollectPolicy(name);
  },
});
