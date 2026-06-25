#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const context = vm.createContext({ console });
for (const file of ['src/passives-content.js', 'src/weapons-content.js', 'src/evolutions.js']) {
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const weapons = vm.runInContext('WEAPONS', context);
const passives = vm.runInContext('PASSIVES', context);
const evolutions = vm.runInContext('EVOLUTIONS', context);
const weaponIds = Object.keys(weapons).sort();
const evolutionIds = Object.keys(evolutions).sort();
const passiveIds = new Set(Object.keys(passives));
const errors = [];
const missing = weaponIds.filter(id => !evolutions[id]);
const extra = evolutionIds.filter(id => !weapons[id]);
if (missing.length) errors.push(`missing evolution(s) for weapon(s): ${missing.join(',')}`);
if (extra.length) errors.push(`evolution(s) without weapon: ${extra.join(',')}`);
for (const [id, evo] of Object.entries(evolutions)) {
  if (!passiveIds.has(evo.passive)) errors.push(`${id} references unknown passive ${evo.passive}`);
}
if (weaponIds.length !== 24 || evolutionIds.length !== 24) {
  errors.push(`expected 24 weapons and 24 evolutions, got weapons=${weaponIds.length} evolutions=${evolutionIds.length}`);
}
if (passiveIds.size !== 8) {
  errors.push(`expected 8 passive upgrades, got passives=${passiveIds.size}`);
}
if (errors.length) {
  console.error(`evolution contract verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Evolution contract verification passed (24 weapons, 24 evolutions, 8 passives).');
