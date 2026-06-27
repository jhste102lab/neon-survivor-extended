import { RULESET, WIN_TIME_SECONDS } from './config.js';

export function isEntryPlausible(entry) {
  if (entry.time < 5) return false;
  if (entry.won && entry.time < WIN_TIME_SECONDS - 5) return false;
  if (entry.kills > 1000 + entry.time * 75) return false;
  if (entry.level > 8 + entry.time / 6) return false;
  if (entry.maxCombo > entry.kills) return false;
  if (entry.ruleset !== RULESET) return false;
  if (entry.build && entry.build.fieldTest) return false;
  return true;
}
