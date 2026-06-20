'use strict';
// Public overlay facade. Focused ui-overlay-* modules own overlay behavior.
/* ================================================================
   UI overlays
   ================================================================ */
Object.assign(UI, {
  showPause() {
    return UIPauseOverlay.showPause();
  },

  toTitle() {
    return UITitleOverlay.toTitle();
  },
});
