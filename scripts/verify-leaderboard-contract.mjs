#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const config = readFileSync(path.join(root, 'src/config.js'), 'utf8');
const server = readFileSync(path.join(root, 'functions/api/leaderboard/config.js'), 'utf8');
const clientRuleset = /ruleset:\s*'([^']+)'/.exec(config)?.[1];
const clientWin = Number(/winTime:\s*(\d+)/.exec(config)?.[1]);
const serverRuleset = /RULESET\s*=\s*'([^']+)'/.exec(server)?.[1];
const serverWin = Number(/WIN_TIME_SECONDS\s*=\s*(\d+)/.exec(server)?.[1]);
const errors = [];
if (!clientRuleset || clientRuleset !== serverRuleset) errors.push(`ruleset drift client=${clientRuleset} server=${serverRuleset}`);
if (!Number.isFinite(clientWin) || clientWin !== serverWin) errors.push(`winTime drift client=${clientWin} server=${serverWin}`);
if (!readFileSync(path.join(root, 'src/leaderboard-entry.js'), 'utf8').includes('LEADERBOARD_CONTRACT')) errors.push('client leaderboard entry does not use LEADERBOARD_CONTRACT');
if (!readFileSync(path.join(root, 'functions/api/leaderboard/entry-normalization.js'), 'utf8').includes('WIN_TIME_SECONDS')) errors.push('server normalization does not use WIN_TIME_SECONDS');
if (errors.length) {
  console.error(`leaderboard contract verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`leaderboard contract verification passed (${clientRuleset}, win=${clientWin}s).`);
