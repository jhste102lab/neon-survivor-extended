'use strict';
// Active storm event behavior.
Object.assign(Game, {
  updateStormEvent(ev, dt) {
    ev.hazardT -= dt;
    if (ev.hazardT <= 0) {
      ev.hazardT = this.time >= CFG.winTime ? 2.65 : 2.25;
      const p = this.player;
      const base = rand(0, TAU);
      const n = 7 + Math.min(5, Math.floor((this.time - (CFG.unlockTime || CFG.winTime)) / 220));
      for (let i = 0; i < n; i++) {
        const a = base + i / n * TAU;
        this.spawnEnemyBullet(p.x + Math.cos(a) * 360, p.y + Math.sin(a) * 360, -Math.cos(a) * 160, -Math.sin(a) * 160,
          { r: 8, dmg: 10, life: 3.3, kind: 'storm', source: 'event:storm' });
      }
      if (this.time >= CFG.winTime && this.spawnLineHazard) this.spawnStormRicochetLasers(ev, base);
      GameRuntime.playSound('shoot');
    }
    if (ev.life <= 0) this.completeEvent(ev, true);
  },

  spawnStormRicochetLasers(ev, base) {
    const cfg = CFG.bossPatternPhase || {};
    const p = this.player;
    const safeA = base + Math.PI / 2;
    const count = 2 + (this.time >= CFG.winTime + 240 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = safeA + (i - (count - 1) / 2) * 0.42;
      const px = p.x + Math.cos(a) * (170 + i * 18);
      const py = p.y + Math.sin(a) * (170 + i * 18);
      const dir = a + Math.PI / 2 + (i % 2 ? 0.22 : -0.22);
      const len = 620;
      this.spawnLineHazard({
        kind: 'storm-ricochet',
        x1: px - Math.cos(dir) * len, y1: py - Math.sin(dir) * len,
        x2: px + Math.cos(dir) * len, y2: py + Math.sin(dir) * len,
        width: 22, warn: 1.1, life: 1.05,
        dmg: cfg.ricochetDamage || 30, tick: 1.1,
        color: '#41f0ff', source: 'event:storm-ricochet', label: 'BOUNCE',
      });
    }
    if (this.applyPatternCrowdRelief) this.applyPatternCrowdRelief(p, 380, 160);
    if (this.metrics) this.metrics.eventSafePhase = (this.metrics.eventSafePhase || 0) + 1;
  },
});
