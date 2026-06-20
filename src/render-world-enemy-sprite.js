'use strict';
// Focused renderer for enemy body sprites and damage flashes.
const RenderWorldEnemySprites = (() => {
  function drawEnemySprite(x, e, visual) {
    const size = visual.sprite.width * visual.scale;
    if (visual.rotation) {
      drawRotatedEnemySprite(x, e, visual, size);
    } else {
      drawAxisAlignedEnemySprite(x, e, visual, size);
    }
  }

  function drawRotatedEnemySprite(x, e, visual, size) {
    x.save(); x.translate(e.x, e.y); x.rotate(visual.rotation);
    x.drawImage(visual.sprite, -size / 2, -size / 2, size, size);
    drawRotatedEnemyFlash(x, e, size);
    x.restore();
  }

  function drawAxisAlignedEnemySprite(x, e, visual, size) {
    x.drawImage(visual.sprite, e.x - size / 2, e.y - size / 2, size, size);
    drawAxisAlignedEnemyFlash(x, e, size);
  }

  function drawRotatedEnemyFlash(x, e, size) {
    if (!(e.flash > 0)) return;
    x.globalAlpha = e.flash / 0.09;
    x.drawImage(Sprites.shape(e.def.shape, e.def.color, e.r, true), -size / 2, -size / 2, size, size);
    x.globalAlpha = 1;
  }

  function drawAxisAlignedEnemyFlash(x, e, size) {
    if (!(e.flash > 0)) return;
    x.globalAlpha = e.flash / 0.09;
    x.drawImage(Sprites.shape(e.def.shape, e.def.color, e.r, true), e.x - size / 2, e.y - size / 2, size, size);
    x.globalAlpha = 1;
  }

  return { drawEnemySprite };
})();
globalThis.RenderWorldEnemySprites = RenderWorldEnemySprites;
