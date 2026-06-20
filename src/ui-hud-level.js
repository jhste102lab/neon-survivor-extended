'use strict';
// Level badge tier styling and level-number rendering.
const UIHudLevel = {
  syncLevelTier(level, force = false) {
    if (Game.test && Game.test.headless) return levelTierInfo(level);
    const info = levelTierInfo(level);
    if (!force && UI.levelTier === info.tier) return info;
    UI.levelTier = info.tier;
    const badge = $('lvbadge');
    if (badge) {
      badge.style.setProperty('--level-tier', info.color);
      badge.style.setProperty('--level-tier-soft', info.soft);
      badge.style.setProperty('--level-tier-bg', info.bg);
      badge.style.setProperty('--level-tier-glow', info.glow);
      badge.dataset.tier = String(info.tier + 1);
    }
    return info;
  },

  reset() {
    $('lvNum').textContent = '1';
    UI.syncLevelTier(1, true);
  },

  update(level) {
    $('lvNum').textContent = level;
    UI.syncLevelTier(level);
  },
};
