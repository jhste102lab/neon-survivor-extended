'use strict';
// Enemy bullet movement and player contact damage.
function enemyBulletBypassesInvulnerability(b) {
  return String(b && b.source || '').startsWith('boss:mega');
}

Object.assign(Game, {
  updateEBullets(dt) {
    const p = this.player;
    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i];
      b.life -= dt;
      b.age = (b.age || 0) + dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.life <= 0) { this.ebullets.splice(i, 1); continue; }
      const canHitPlayer = !p.dead && (p.invuln <= 0 || enemyBulletBypassesInvulnerability(b));
      if (canHitPlayer && dist2(b.x, b.y, p.x, p.y) < (b.r + CFG.player.radius) * (b.r + CFG.player.radius)) {
        this.hurtPlayer(b.dmg, b.source || `enemy:${b.kind}`);
        this.ebullets.splice(i, 1);
      }
    }
  },
});
