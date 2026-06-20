'use strict';
// Pause overlay presentation.
const UIPauseOverlay = {
  showPause() {
    const build = UIPauseBuildDto.fromPlayer(Game.player);
    $('buildList').innerHTML = UIPauseBuildHtml.render(build);
    showOverlay('pauseOv');
  },
};
