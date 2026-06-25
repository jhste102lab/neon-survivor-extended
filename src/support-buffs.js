'use strict';
// Movement-friendly support passives. The cards only explain the benefit; runtime tuning keeps late idle builds from becoming fully hands-free.
function supportPassiveLevel(game, id) {
  return game && game.player && game.player.passives ? (game.player.passives[id] || 0) : 0;
}

function supportMotionFactor(game) {
  const p = game.player || {};
  const idleK = game.idleRecoverySuppression ? game.idleRecoverySuppression() : 0;
  const recent = (p.moving || p.moveRecentT > 0) ? 1 : 0.28;
  return clamp(recent * (1 - idleK * 0.84), 0.12, 1);
}

function supportEnemiesNear(x, y, radius, limit, scoreFn = null) {
  const out = [];
  Grid.forEachInCircleD2(x, y, radius, (e, d2) => {
    if (e.hp <= 0) return;
    out.push({ e, d2, score: scoreFn ? scoreFn(e, d2) : d2 });
  });
  out.sort((a, b) => a.score - b.score);
  return out.slice(0, limit).map(v => v.e);
}

function supportChainTarget(prev, range, hitSet) {
  let best = null, bd = range * range;
  Grid.forEachInCircleD2(prev.x, prev.y, range, (e, d2) => {
    if (e.hp <= 0 || hitSet.has(e)) return;
    if (d2 < bd) { bd = d2; best = e; }
  });
  return best;
}

const SupportBuffRuntime = {
  state(game) {
    game.supportBuffState = game.supportBuffState || { pulseT: 0.9, prismT: 0.35, anchorT: 2.4, relayT: 1.1 };
    return game.supportBuffState;
  },

  update(game, dt, st) {
    if (!game.player || game.player.dead) return;
    const levels = {
      pulse: supportPassiveLevel(game, 'pulse'),
      aegis: supportPassiveLevel(game, 'aegis'),
      prism: supportPassiveLevel(game, 'prism'),
      anchor: supportPassiveLevel(game, 'anchor'),
      relay: supportPassiveLevel(game, 'relay'),
    };
    if (!levels.pulse && !levels.aegis && !levels.prism && !levels.anchor && !levels.relay) return;
    const motion = supportMotionFactor(game);
    const state = this.state(game);
    this.updateAegis(game, dt, levels.aegis, motion);
    this.updatePulse(game, dt, st, levels.pulse, motion, state);
    this.updatePrism(game, dt, levels.prism, motion, state);
    this.updateAnchor(game, dt, st, levels.anchor, motion, state);
    this.updateRelay(game, dt, st, levels.relay, motion, state);
  },

  updateAegis(game, dt, lv, motion) {
    if (!lv) return;
    const p = game.player;
    const maxBarrier = 14 + lv * 5;
    const gain = (0.36 + lv * 0.16) * dt * motion;
    if (gain > 0.001) p.barrier = Math.min(maxBarrier, (p.barrier || 0) + gain);
  },

  updatePulse(game, dt, st, lv, motion, state) {
    if (!lv) return;
    state.pulseT -= dt;
    if (state.pulseT > 0) return;
    state.pulseT = Math.max(1.72, 3.0 - lv * 0.18);
    const p = game.player;
    const radius = 78 + lv * 9;
    game.novas.push({
      x: p.x, y: p.y, r: 8, maxR: radius,
      dmg: (5.8 + lv * 2.6) * st.dmg * motion, kb: 54 + lv * 7,
      id: ++game.novaSeq, source: 'passive:pulse', color: '#3dff8e', slow: 0.12 + lv * 0.01, slowT: 0.55,
    });
  },

  updatePrism(game, dt, lv, motion, state) {
    if (!lv) return;
    state.prismT -= dt;
    if (state.prismT > 0) return;
    state.prismT = 0.52;
    const p = game.player;
    const radius = 165 + lv * 18;
    const targets = supportEnemiesNear(p.x, p.y, radius, 6 + lv * 2, (e, d2) => d2 - (e.boss ? radius * radius * 0.18 : 0));
    for (const e of targets) {
      e.vulnerableT = Math.max(e.vulnerableT || 0, 0.65 + lv * 0.06);
      e.vulnerableK = Math.max(e.vulnerableK || 0, (e.boss ? 0.012 + lv * 0.004 : 0.035 + lv * 0.009) * motion);
    }
    if (targets.length && (game.frameSeq || 0) % 2 === 0) {
      const t = targets[0];
      game.bolts.push({ x1: p.x, y1: p.y, x2: t.x, y2: t.y, life: 0.14, color: '#8fd6ff' });
    }
  },

  updateAnchor(game, dt, st, lv, motion, state) {
    if (!lv) return;
    state.anchorT -= dt;
    if (state.anchorT > 0) return;
    state.anchorT = Math.max(3.9, 6.1 - lv * 0.34);
    const p = game.player;
    const target = game.strongestVisibleOrNearest ? game.strongestVisibleOrNearest(850, 240) : supportEnemiesNear(p.x, p.y, 850, 1)[0];
    if (!target) return;
    const radius = 72 + lv * 7;
    game.novas.push({
      field: true, visual: 'blackhole', x: target.x, y: target.y, r: radius, maxR: radius,
      life: 1.55 + lv * 0.13, maxLife: 1.55 + lv * 0.13,
      tick: 0, tickEvery: 0.42,
      dmg: (2.5 + lv * 1.25) * st.dmg * motion, pull: 22 + lv * 4.2, slow: 0.12 + lv * 0.012,
      vulnerableK: 0.012 + lv * 0.004, vulnerableBossK: 0.006 + lv * 0.002, vulnerableT: 0.55,
      id: ++game.novaSeq, source: 'passive:anchor', color: '#a36bff',
    });
  },

  updateRelay(game, dt, st, lv, motion, state) {
    if (!lv) return;
    state.relayT -= dt;
    if (state.relayT > 0) return;
    state.relayT = Math.max(1.05, 1.72 - lv * 0.09);
    if (game.bolts.length > 72) return;
    const p = game.player;
    let t = supportEnemiesNear(p.x, p.y, 430 + lv * 18, 1)[0];
    if (!t) return;
    const hitSet = new Set();
    let prev = { x: p.x, y: p.y };
    const chain = 1 + Math.floor((lv + 1) / 2);
    const damage = (7.5 + lv * 3.1) * st.dmg * motion;
    for (let i = 0; i <= chain && t; i++) {
      hitSet.add(t);
      game.bolts.push({ x1: prev.x, y1: prev.y, x2: t.x, y2: t.y, life: 0.18, color: '#ffd23d' });
      game.damageEnemy(t, damage * (i ? 0.76 : 1), 0, 0, 'passive:relay');
      prev = t;
      t = supportChainTarget(prev, 145 + lv * 10, hitSet);
    }
  },
};

Object.assign(Game, {
  updateSupportBuffs(dt, st) {
    SupportBuffRuntime.update(this, dt, st);
  },
});
