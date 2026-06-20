'use strict';
// localStorage adapter for Leaderboard persistence.
const LeaderboardLocal = {
  read(localKey, storageLimit) {
    try {
      const arr = JSON.parse(localStorage.getItem(localKey) || '[]');
      return Array.isArray(arr) ? LeaderboardEntry.normalizeList(arr, storageLimit) : [];
    } catch (e) {
      return [];
    }
  },

  write(localKey, entries, storageLimit) {
    try { localStorage.setItem(localKey, JSON.stringify(entries.slice(0, storageLimit))); }
    catch (e) {}
  },
};
