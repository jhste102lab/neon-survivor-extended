'use strict';
// Pressure pattern command planning. Pattern modules apply these commands as side effects.
const PressurePatternPlans = {
  lateRing(context, baseAngle, gap) {
    const p = context.player;
    const threat = context.threat;
    const n = 5 + Math.min(4, Math.floor(threat / 1.8));
    const radius = 178 + Math.min(64, threat * 8);
    const commands = [];
    for (let i = 0; i < n; i++) {
      if (i === gap) continue;
      const a = baseAngle + i / n * TAU;
      commands.push({ type: 'hazard', hazard: {
        kind: 'late-ring', x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius,
        r: 34 + Math.min(10, threat * 1.2), warn: context.warn, life: 2.45, dmg: context.dmg, tick: 0.55,
        color: '#ff4d8e', source: 'director:ring-trap', label: 'RING',
      } });
    }
    return commands;
  },

  lateLane(context, gap) {
    const p = context.player;
    const threat = context.threat;
    const mx = p.moveX || 0, my = p.moveY || (mx ? 0 : 1);
    const ma = Math.atan2(my, mx);
    const pa = ma + Math.PI / 2;
    const ahead = 120 + Math.min(80, threat * 8);
    const commands = [];
    for (let i = -2; i <= 2; i++) {
      if (i === gap) continue;
      commands.push({ type: 'hazard', hazard: {
        kind: 'late-lane', x: p.x + Math.cos(ma) * ahead + Math.cos(pa) * i * 78, y: p.y + Math.sin(ma) * ahead + Math.sin(pa) * i * 78,
        r: 38, warn: context.warn, life: 2.35, dmg: context.dmg + 2, tick: 0.55,
        color: '#ffd23d', source: 'director:lane-trap', label: 'LANE',
      } });
    }
    return commands;
  },

  lateHunter(context, baseAngle) {
    const p = context.player;
    const threat = context.threat;
    const n = 3 + Math.min(4, Math.floor(threat / 2.2));
    const commands = [];
    for (let i = 0; i < n; i++) {
      const a = baseAngle + i / n * TAU;
      commands.push({ type: 'enemyBullet', x: p.x + Math.cos(a) * 430, y: p.y + Math.sin(a) * 430,
        vx: -Math.cos(a) * (155 + Math.min(75, threat * 5)), vy: -Math.sin(a) * (155 + Math.min(75, threat * 5)),
        opts: { r: 7.5, dmg: context.dmg + 1, life: 3.7, kind: 'hunter', source: 'director:hunter-bullet' } });
    }
    return commands;
  },

  idleMissiles(context, rolls) {
    const p = context.player;
    const commands = [];
    for (let i = 0; i < context.n; i++) {
      const direct = i === 0;
      const roll = rolls[i] || { angle: 0, spread: 0 };
      const spread = direct ? 0 : roll.spread;
      commands.push({ type: 'hazard', hazard: {
        kind: 'idle-missile',
        x: p.x + Math.cos(roll.angle) * spread,
        y: p.y + Math.sin(roll.angle) * spread,
        r: context.radius, warn: context.warn, life: 2.25, dmg: context.dmg, tick: 0.42,
        color: '#ff6b3d', source: 'director:idle-missile', label: 'MOVE', bypassInvuln: true,
      } });
    }
    commands.push({ type: 'sound', name: 'missile' });
    return commands;
  },

  apply(game, commands) {
    for (const command of commands || []) {
      if (command.type === 'hazard') game.spawnHazard(command.hazard);
      else if (command.type === 'enemyBullet') game.spawnEnemyBullet(command.x, command.y, command.vx, command.vy, command.opts);
      else if (command.type === 'sound') GameRuntime.playSound(command.name, ...(command.args || []));
    }
  },
};
globalThis.PressurePatternPlans = PressurePatternPlans;
