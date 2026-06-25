#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const errors = [];
function fail(message) { errors.push(message); }
function loadClassic(file, context) { vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
const context = vm.createContext({ console });
loadClassic('src/i18n-ui-copy.js', context);
loadClassic('src/i18n-content.js', context);
const copy = vm.runInContext('I18N_UI_COPY', context);
const content = vm.runInContext('I18N_CONTENT', context);
const htmlAllowed = new Set(['help.tip', 'profile.controlsHint', 'title.controlsHint', 'leaderboard.bestLine']);
const markupPattern = /<[^>]+>/;

for (const [locale, dict] of Object.entries(copy)) {
  for (const [key, value] of Object.entries(dict)) {
    if (markupPattern.test(String(value)) && !htmlAllowed.has(key)) {
      fail(`${locale}.${key} contains markup but is not data-i18n-html allowlisted`);
    }
  }
}

function keys(obj) { return Object.keys(obj || {}).sort(); }
function sameKeys(label, base, candidate) {
  const a = keys(base), b = keys(candidate);
  const missing = a.filter(k => !b.includes(k));
  const extra = b.filter(k => !a.includes(k));
  if (missing.length || extra.length) fail(`${label} key mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
}

for (const locale of ['ko','zh','ja']) {
  sameKeys(`${locale}.ui`, copy.en, copy[locale]);
  sameKeys(`${locale}.weapons`, content.en.weapons, content[locale].weapons);
  sameKeys(`${locale}.passives`, content.en.passives, content[locale].passives);
  sameKeys(`${locale}.evolutions`, content.en.evolutions, content[locale].evolutions);
  sameKeys(`${locale}.overDesc`, content.en.overDesc, content[locale].overDesc);
  sameKeys(`${locale}.transcend`, content.en.transcend, content[locale].transcend);
  sameKeys(`${locale}.fieldEvents`, content.en.fieldEvents, content[locale].fieldEvents);
  sameKeys(`${locale}.companions.roles`, content.en.companions?.roles, content[locale].companions?.roles);
  if (!Array.isArray(content[locale].profile?.adjectives) || !Array.isArray(content[locale].profile?.animals)) {
    fail(`${locale}.profile word lists must include adjectives and animals arrays`);
  }
}

if (errors.length) {
  console.error(`i18n contract verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('i18n content/html contract verification passed.');
