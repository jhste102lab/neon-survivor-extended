'use strict';
// Player bullet collision resolution and hit effects.
const PLAYER_BULLET_NORMAL_QUERY_R = 48;
const PLAYER_BULLET_BOSS_QUERY_R = 76;

function playerBulletCandidateRadius(game, b) {
  const extra = game.boss && game.boss.hp > 0 ? PLAYER_BULLET_BOSS_QUERY_R : PLAYER_BULLET_NORMAL_QUERY_R;
  return (b.r || 0) + extra;
}

function forEachPlayerBulletCandidate(game, b, visitor) {
  const r = playerBulletCandidateRadius(game, b);
  const r2 = r * r;
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
        if (d2 <= r2 && visitor(e, d2) === true) return true;
      }
    }
    return false;
  }
  for (const e of game.enemies) {
    const dx = b.x - e.x, dy = b.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= r2 && visitor(e, d2) === true) return true;
  }
  return false;
}

const PlayerBulletCollision = {
  hitBoomerangEnemies(game, b) {
    const outcomes = [];
    forEachPlayerBulletCandidate(game, b, (e, d2) => {
      if (e.boomCd > 0 || e.hp <= 0) return false;
      const hitR = b.r + e.r;
      if (d2 > hitR * hitR) return false;
      outcomes.push(...this.boomerangHitOutcomes(game, b, e));
      return false;
    });
    return { consumed: false, outcomes };
  },

  boomerangHitOutcomes(game, b, e) {
    const ka = Math.atan2(e.y - game.player.y, e.x - game.player.x);
    return [
      { type: 'setBoomCooldown', enemy: e, value: 0.35 },
      { type: 'damageEnemy', enemy: e, damage: b.dmg, knockX: Math.cos(ka) * 90 * e.def.knock, knockY: Math.sin(ka) * 90 * e.def.knock, source: b.source || 'weapon:boomerang' },
      { type: 'burst', x: b.x, y: b.y, color: '#ffd23d', count: 3, speed: 90, size: 4, life: 0.2 },
      { type: 'sound', name: 'hit' },
    ];
  },

  hitStandardEnemies(game, b, st) {
    let consumed = false;
    let remainingPierce = b.pierce || 0;
    const outcomes = [];
    forEachPlayerBulletCandidate(game, b, (e, d2) => {
      if (consumed || e.hp <= 0) return consumed;
      const hitR = b.r + e.r;
      if (d2 > hitR * hitR) return false;
      if (this.hitAlreadyRecorded(b, e)) return false;

      const hit = b.kind === 'missile'
        ? this.missileHitResult(b)
        : this.projectileHitResult(game, b, e, st, remainingPierce);
      outcomes.push(...hit.outcomes);
      if (hit.decrementPierce) remainingPierce--;
      consumed = hit.consumed;
      return consumed;
    });
    return { consumed, outcomes };
  },

  hitAlreadyRecorded(b, e) {
    if (!b.hitOnce) return false;
    return !!(b.hitSet && b.hitSet.has(e));
  },

  missileHitResult(b) {
    return {
      consumed: true,
      outcomes: [{ type: 'explode', x: b.x, y: b.y, radius: b.blast, damage: b.dmg, source: b.source || 'weapon:missile', child: !!b.child, color: b.color }],
    };
  },

  projectileHitResult(game, b, e, st, remainingPierce) {
    const outcomes = [];
    if (b.hitOnce) outcomes.push({ type: 'rememberHit', bullet: b, enemy: e });
    if (b.slow) outcomes.push({ type: 'slowEnemy', enemy: e, duration: b.slowT || 0.5, factor: Math.min(0.82, b.slow) });
    if (b.vulnOnHit) {
      outcomes.push({
        type: 'vulnerableEnemy',
        enemy: e,
        duration: b.vulnT || 1.4,
        factor: e.boss ? (b.vulnBossK || 0.04) : b.vulnOnHit,
      });
    }
    outcomes.push(this.damageProjectileTargetOutcome(b, e));
    outcomes.push(...this.projectileHitFeedbackOutcomes(b));
    if (b.healOnHit) outcomes.push(this.healOnHitOutcome(b));
    const consume = this.consumedAfterProjectileHitResult(b, remainingPierce);
    outcomes.push(...consume.outcomes);
    return { consumed: consume.consumed, decrementPierce: consume.decrementPierce, outcomes };
  },

  damageProjectileTargetOutcome(b, e) {
    const kb = (b.kb == null ? 130 : b.kb) * e.def.knock;
    const a = Math.atan2(b.vy || 0, b.vx || 1);
    return { type: 'damageEnemy', enemy: e, damage: b.dmg, knockX: Math.cos(a) * kb, knockY: Math.sin(a) * kb, source: b.source || 'weapon:bolt' };
  },

  projectileHitFeedbackOutcomes(b) {
    return [
      { type: 'sound', name: 'hit' },
      { type: 'burst', x: b.x, y: b.y, color: b.color || '#19e3ff', count: 3, speed: 100, size: 4, life: 0.18 },
    ];
  },

  healOnHitOutcome(b) {
    return { type: 'healPlayer', hp: b.healOnHit };
  },

  consumedAfterProjectileHitResult(b, remainingPierce) {
    if (b.blastOnHit) {
      if (b.blastOnHitNoConsume) {
        return {
          consumed: remainingPierce <= 0,
          decrementPierce: remainingPierce > 0,
          outcomes: [{ type: 'explode', x: b.x, y: b.y, radius: b.blastOnHit, damage: b.dmg * (b.blastMul || 0.55), source: b.source || 'weapon:blast', child: true, color: b.color }],
        };
      }
      return {
        consumed: true,
        decrementPierce: false,
        outcomes: [{ type: 'explode', x: b.x, y: b.y, radius: b.blastOnHit, damage: b.dmg * (b.blastMul || 0.55), source: b.source || 'weapon:blast', child: true, color: b.color }],
      };
    }
    if (remainingPierce > 0) {
      return { consumed: false, decrementPierce: true, outcomes: [{ type: 'decrementPierce', bullet: b, amount: 1 }] };
    }
    return { consumed: true, decrementPierce: false, outcomes: [] };
  },
};
