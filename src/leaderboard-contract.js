'use strict';
// Client-side leaderboard contract mirrored by functions/api/leaderboard/config.js and verified by scripts.
const LEADERBOARD_CONTRACT = Object.freeze({
  ruleset: CFG.ruleset,
  winTimeSeconds: CFG.winTime,
  publicLimit: 10,
});
