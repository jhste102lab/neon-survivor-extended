'use strict';
// Player bullet update orchestration. Helpers live in player-bullet-* and explosions.js.
Object.assign(Game, {
  ensurePlayerBulletHelpers() {
    const missing = [];
    if (typeof PlayerBulletOutcomes === 'undefined') missing.push('player-bullet-outcomes.js');
    if (typeof PlayerBulletMovement === 'undefined') missing.push('player-bullet-movement.js');
    if (typeof PlayerBulletCollision === 'undefined') missing.push('player-bullet-collision.js');
    if (typeof this.explode !== 'function') missing.push('explosions.js');
    if (missing.length) {
      throw new Error(`Player bullet helper scripts missing: ${missing.join(', ')}. Load them before player-bullets.js.`);
    }
  },

  removeBulletAt(i) {
    const last = this.bullets.pop();
    if (i < this.bullets.length) this.bullets[i] = last;
  },

  updateBullets(dt, st) {
    this.ensurePlayerBulletHelpers();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (PlayerBulletMovement.expiredAfterTick(b, dt)) {
        this.removeBulletAt(i);
        continue;
      }

      if (b.kind === 'mine') {
        if (PlayerBulletMovement.mineTriggered(this, b, dt)) {
          PlayerBulletOutcomes.applyAll(this, [{
            type: 'explode',
            x: b.x,
            y: b.y,
            radius: b.blast || 70,
            damage: b.dmg,
            source: b.source || 'weapon:shockmine',
            child: false,
            color: b.color || '#41f0ff',
          }], st);
          this.removeBulletAt(i);
        }
        continue;
      }

      if (b.kind === 'boom') {
        const movement = PlayerBulletMovement.boomerangReturned(this, b, dt);
        PlayerBulletOutcomes.applyAll(this, movement.outcomes, st);
        if (movement.returned) {
          this.removeBulletAt(i);
          continue;
        }
        const collision = PlayerBulletCollision.hitBoomerangEnemies(this, b);
        PlayerBulletOutcomes.applyAll(this, collision.outcomes, st);
        continue;
      }

      const movement = PlayerBulletMovement.moveStandard(this, b, dt);
      PlayerBulletOutcomes.applyAll(this, movement.outcomes, st);

      const collision = PlayerBulletCollision.hitStandardEnemies(this, b, st);
      PlayerBulletOutcomes.applyAll(this, collision.outcomes, st);
      if (collision.consumed) {
        this.removeBulletAt(i);
      }
    }
  },
});
