'use strict';
// Late-pressure ring trap pattern.
Object.assign(Game, {
  spawnLateRingTrap(context) {
    const p = context.player;
    const threat = context.threat;
    const n = 5 + Math.min(4, Math.floor(threat / 1.8));
    const gap = randi(0, n - 1);
    const base = rand(0, TAU);
    const radius = 178 + Math.min(64, threat * 8);
    for (let i = 0; i < n; i++) {
      if (i === gap) continue;
      const a = base + i / n * TAU;
      this.spawnHazard({
        kind: 'late-ring', x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius,
        r: 34 + Math.min(10, threat * 1.2), warn: context.warn, life: 2.45, dmg: context.dmg, tick: 0.55,
        color: '#ff4d8e', source: 'director:ring-trap', label: 'RING',
      });
    }
  },
});
