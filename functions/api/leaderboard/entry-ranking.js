export function compareEntries(a, b) {
  return (b.time - a.time)
    || (b.kills - a.kills)
    || (b.level - a.level)
    || (b.maxCombo - a.maxCombo)
    || String(a.submittedAt).localeCompare(String(b.submittedAt));
}

export function rankEntries(entries) {
  return entries.slice().sort(compareEntries);
}
