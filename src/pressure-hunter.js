'use strict';
// Late-pressure hunter bullet pattern.
Object.assign(Game, {
  spawnLateHunterTrap(context) {
    const p = context.player;
    const threat = context.threat;
    const n = 3 + Math.min(4, Math.floor(threat / 2.2));
    const base = rand(0, TAU);
    for (let i = 0; i < n; i++) {
      const a = base + i / n * TAU;
      this.spawnEnemyBullet(
        p.x + Math.cos(a) * 430,
        p.y + Math.sin(a) * 430,
        -Math.cos(a) * (155 + Math.min(75, threat * 5)),
        -Math.sin(a) * (155 + Math.min(75, threat * 5)),
        { r: 7.5, dmg: context.dmg + 1, life: 3.7, kind: 'hunter', source: 'director:hunter-bullet' }
      );
    }
  },
});
