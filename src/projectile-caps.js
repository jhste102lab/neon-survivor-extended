'use strict';
// Projectile creation and cap policy for player/enemy bullets.
Object.assign(Game, {

  playerBulletCap(b) {
    const source = String(b.source || '');
    const mobileK = this.isMobileRuntime && this.isMobileRuntime() ? 0.72 : 1;
    const scaled = n => Math.max(18, Math.floor(n * mobileK));
    if (b.kind === 'companion' || source.startsWith('companion')) return scaled(96);
    if (b.kind === 'missile') return scaled(b.child ? 48 : 55);
    if (b.kind === 'boom') return scaled(32);
    if (b.kind === 'lance' || b.kind === 'ice') return scaled(42);
    if (b.kind === 'mine') return scaled(44);
    if (b.kind === 'disc') return scaled(20);
    if (b.kind === 'saw') return scaled(26);
    if (b.kind === 'shotgun' || b.kind === 'feather') return scaled(92);
    if (b.kind === 'drone') return scaled(82);
    return this.playerBulletLimit ? this.playerBulletLimit() : CFG.maxPlayerBullets;
  },

  playerBulletTrimIndexForSpawn() {
    if (!this.bullets.length) return -1;
    const view = GameRuntime.viewportHalf ? GameRuntime.viewportHalf() : { w: 960, h: 540 };
    const pad = 180;
    const left = this.cam.x - view.w - pad, right = this.cam.x + view.w + pad;
    const top = this.cam.y - view.h - pad, bottom = this.cam.y + view.h + pad;
    let offscreen = -1, offscreenLife = Infinity, any = 0, anyLife = Infinity;
    for (let i = 0; i < this.bullets.length; i++) {
      const x = this.bullets[i];
      const life = x.life == null ? 9 : x.life;
      if (life < anyLife) { anyLife = life; any = i; }
      const out = x.x < left || x.x > right || x.y < top || x.y > bottom;
      if (out && life < offscreenLife) { offscreenLife = life; offscreen = i; }
    }
    return offscreen >= 0 ? offscreen : any;
  },

  trimPlayerBulletForSpawn() {
    const idx = this.playerBulletTrimIndexForSpawn();
    if (idx < 0) return false;
    const last = this.bullets.pop();
    if (idx < this.bullets.length) this.bullets[idx] = last;
    return true;
  },

  pushPlayerBullet(b) {
    if (!b) return false;
    b.source = b.source || (b.kind ? `weapon:${b.kind}` : 'weapon:unknown');
    const cap = this.playerBulletCap(b);
    let same = 0;
    for (const x of this.bullets) {
      if ((x.kind === b.kind) && (!!x.child === !!b.child) && (b.kind !== 'companion' || x.source === b.source)) same++;
    }
    if (same >= cap) return false;
    while (this.bullets.length >= (this.playerBulletLimit ? this.playerBulletLimit() : CFG.maxPlayerBullets)) {
      if (!this.trimPlayerBulletForSpawn()) break;
    }
    this.bullets.push(b);
    return true;
  },

  spawnEnemyBullet(x, y, vx, vy, opts = {}) {
    while (this.ebullets.length >= (this.enemyBulletLimit ? this.enemyBulletLimit() : (CFG.maxEnemyBullets || 220))) this.ebullets.pop();
    this.ebullets.push({
      x, y, vx, vy,
      r: opts.r || 7,
      dmg: opts.dmg || 10,
      life: opts.life || 4.5,
      maxLife: opts.life || 4.5,
      kind: opts.kind || 'aimed',
      source: opts.source || `enemy:${opts.kind || 'aimed'}`,
      age: 0,
    });
  },
});
