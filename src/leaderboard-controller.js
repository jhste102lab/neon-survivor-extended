'use strict';
// Leaderboard submission/refresh orchestration separated from DOM row rendering.
const LeaderboardController = {
  submitRunAndRefresh({ won, game = Game, targetId, ui = UI } = {}) {
    if (game && game.test && game.test.headless) return Promise.resolve({ ok: true, skipped: 'headless' });
    if (!ui || typeof ui.renderLeaderboard !== 'function') return Promise.resolve({ ok: false, skipped: 'ui unavailable' });
    ui.renderLeaderboard(targetId, { message: tr('leaderboard.saving') });
    return RunRecords.submitLeaderboard(!!won, game).then(result => {
      ui.renderLeaderboard(targetId);
      ui.renderLeaderboard('titleLeaderboard');
      return result;
    });
  },
};
