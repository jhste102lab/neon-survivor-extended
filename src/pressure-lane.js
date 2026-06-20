'use strict';
// Late-pressure lane trap pattern.
Object.assign(Game, {
  spawnLateLaneTrap(context) {
    const p = context.player;
    const threat = context.threat;
    const mx = p.moveX || 0, my = p.moveY || (mx ? 0 : 1);
    const ma = Math.atan2(my, mx);
    const pa = ma + Math.PI / 2;
    const gap = randi(-1, 1);
    const ahead = 120 + Math.min(80, threat * 8);
    for (let i = -2; i <= 2; i++) {
      if (i === gap) continue;
      this.spawnHazard({
        kind: 'late-lane', x: p.x + Math.cos(ma) * ahead + Math.cos(pa) * i * 78, y: p.y + Math.sin(ma) * ahead + Math.sin(pa) * i * 78,
        r: 38, warn: context.warn, life: 2.35, dmg: context.dmg + 2, tick: 0.55,
        color: '#ffd23d', source: 'director:lane-trap', label: 'LANE',
      });
    }
  },
});
