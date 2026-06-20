'use strict';
// Drone body rendering.
{
  function findDroneWeapon() {
    return Game.player.weapons.find(w => w.id === 'drone');
  }

  function shouldDrawDrones(weapon) {
    return Boolean(weapon) && !Game.player.dead;
  }

  function droneAim(position, target) {
    return target ? Math.atan2(target.y - position.y, target.x - position.x) : position.angle + Math.PI / 2;
  }

  function drawDroneRotorArms(x, mobileScale) {
    const arm = x.createLinearGradient(-13 * mobileScale, -10 * mobileScale, 13 * mobileScale, 10 * mobileScale);
    arm.addColorStop(0, '#45505d');
    arm.addColorStop(0.5, '#b7c3cf');
    arm.addColorStop(1, '#303944');
    x.fillStyle = arm;
    x.strokeStyle = '#111821';
    x.lineWidth = 1.2 * mobileScale;
    const pads = [[-14, -10], [-14, 6], [4, -10], [4, 6]];
    for (const [px, py] of pads) {
      x.fillRect(px * mobileScale, py * mobileScale, 9 * mobileScale, 4 * mobileScale);
      x.strokeRect(px * mobileScale, py * mobileScale, 9 * mobileScale, 4 * mobileScale);
    }
  }

  function drawDroneBody(x, mobileScale) {
    const body = x.createLinearGradient(-11 * mobileScale, -8 * mobileScale, 11 * mobileScale, 8 * mobileScale);
    body.addColorStop(0, '#1d2630');
    body.addColorStop(0.35, '#758290');
    body.addColorStop(0.72, '#d7dde4');
    body.addColorStop(1, '#303a46');
    x.fillStyle = body;
    x.beginPath();
    x.moveTo(11 * mobileScale, 0);
    x.lineTo(5 * mobileScale, -8 * mobileScale);
    x.lineTo(-9 * mobileScale, -7 * mobileScale);
    x.lineTo(-13 * mobileScale, 0);
    x.lineTo(-9 * mobileScale, 7 * mobileScale);
    x.lineTo(5 * mobileScale, 8 * mobileScale);
    x.closePath();
    x.fill();
    x.stroke();
  }

  function dronePalette(index) {
    const colors = ['#7dffc1', '#19e3ff', '#ff2bd6', '#ffd23d', '#a36bff'];
    return colors[index % colors.length];
  }

  function drawMiniNeonDrone(x, position, mobileScale, index) {
    const pulse = 0.5 + Math.sin(Game.time * 10 + index * 1.7) * 0.5;
    const color = dronePalette(index);
    const s = mobileScale * (0.62 + pulse * 0.05);
    const aura = Sprites.glowDot(color, 12 * s, '#ffffff');
    const core = Sprites.glowDot(color, 7 * s, '#ffffff');
    x.save();
    x.translate(position.x, position.y);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.42 + pulse * 0.18;
    x.drawImage(aura, -24 * s, -24 * s, 48 * s, 48 * s);
    x.globalAlpha = 0.92;
    x.drawImage(core, -13 * s, -13 * s, 26 * s, 26 * s);
    x.globalAlpha = 1;
    x.strokeStyle = `rgba(255,255,255,${0.62 + pulse * 0.2})`;
    x.lineWidth = 1.4 * mobileScale;
    x.beginPath(); x.arc(0, 0, 7.4 * s, 0, TAU); x.stroke();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(Math.cos(position.angle) * 4.2 * s, Math.sin(position.angle) * 4.2 * s, 1.8 * s, 0, TAU); x.fill();
    x.restore();
  }

  function drawDroneSquad(x, weapon, mobileScale, visibility) {
    const stats = weaponStats('drone', weapon.lv);
    const player = Game.player;
    const count = WeaponDroneGeometry.count(stats);
    x.save();
    x.globalCompositeOperation = 'source-over';
    for (let index = 0; index < count; index++) {
      const position = WeaponDroneGeometry.mount(player, Game.time, count, index);
      if (!visibility.worldVisible(position.x, position.y, 90)) continue;
      drawMiniNeonDrone(x, position, mobileScale, index);
    }
    x.restore();
  }

const RenderCombatDrones = {
  draw(render, x, frame = null) {
    const weapon = findDroneWeapon();
    if (!shouldDrawDrones(weapon)) return;
    const visibility = frame && frame.worldVisible ? frame : { worldVisible: (px, py, pad) => render.worldVisible(px, py, pad) };
    drawDroneSquad(x, weapon, frame ? frame.mobileScale : render.mobileVisualScale(), visibility);
  },
};
globalThis.RenderCombatDrones = RenderCombatDrones;
}
