'use strict';
// Boss enrage scalar from overtime/endless pressure.
function getBossEnrage(game, e) {
  return (game.time >= CFG.winTime || game.endless) ? clamp(((e.age || 0) - 55) / 95, 0, 1.6) : 0;
}
