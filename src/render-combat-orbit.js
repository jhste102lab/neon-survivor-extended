'use strict';
// Orbit blade rendering.
{
  function findOrbitWeapon() {
    return Game.player.weapons.find(w => w.id === 'orbit');
  }

  function shouldDrawOrbitBlades(weapon) {
    return Boolean(weapon) && !Game.player.dead && !(Game.weaponEffectHidden && Game.weaponEffectHidden('orbit'));
  }

  function drawOrbitBladeSprite(x, sprite, position) {
    x.save();
    x.translate(position.x, position.y);
    x.rotate(Game.blades.angle * 4);
    x.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    x.restore();
  }

  function drawOrbitBlades(x, weapon) {
    const stats = weaponStats('orbit', weapon.lv);
    const player = Game.player;
    const evolved = Game.weaponEvolved && Game.weaponEvolved('orbit');
    const sprite = Sprites.shape('star', evolved ? '#7dffc1' : '#3dff8e', 13);
    x.save();
    for (const blade of WeaponAuraOrbitGeometry.bladePositions(player, stats, evolved, Game.blades.angle)) {
      drawOrbitBladeSprite(x, sprite, blade);
    }
    x.restore();
  }

const RenderCombatOrbitBlades = {
  draw(x) {
    const weapon = findOrbitWeapon();
    if (!shouldDrawOrbitBlades(weapon)) return;
    drawOrbitBlades(x, weapon);
  },
};
globalThis.RenderCombatOrbitBlades = RenderCombatOrbitBlades;
}
