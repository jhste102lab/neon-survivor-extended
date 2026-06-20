'use strict';
// Idle-pressure missile hazard pattern.
Object.assign(Game, {
  spawnIdleMissilePattern(context) {
    const p = context.player;
    for (let i = 0; i < context.n; i++) {
      const direct = i === 0;
      const a = rand(0, TAU);
      const spread = direct ? 0 : rand(58, 122 + context.idleK * 38);
      this.spawnHazard({
        kind: 'idle-missile',
        x: p.x + Math.cos(a) * spread,
        y: p.y + Math.sin(a) * spread,
        r: context.radius, warn: context.warn, life: 2.25, dmg: context.dmg, tick: 0.42,
        color: '#ff6b3d', source: 'director:idle-missile', label: 'MOVE', bypassInvuln: true,
      });
    }
  },
});
