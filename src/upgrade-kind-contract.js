'use strict';
// Single contract point for generated upgrade kinds across description, reward text, and application.
const UpgradeKindContract = (() => {
  const kinds = Object.freeze({
    w: Object.freeze({ description: 'weapon upgrade', chestText: true, applicator: 'weapon' }),
    ow: Object.freeze({ description: 'weapon overlevel', chestText: true, applicator: 'weapon' }),
    nw: Object.freeze({ description: 'new weapon', chestText: true, applicator: 'weapon' }),
    p: Object.freeze({ description: 'passive upgrade', chestText: true, applicator: 'passive' }),
    np: Object.freeze({ description: 'new passive', chestText: true, applicator: 'passive' }),
    ev: Object.freeze({ description: 'evolution', chestText: true, applicator: 'special' }),
    nc: Object.freeze({ description: 'companion', chestText: true, applicator: 'special' }),
    t: Object.freeze({ description: 'transcend', chestText: true, applicator: 'transcend' }),
    heal: Object.freeze({ description: 'heal', chestText: true, applicator: 'heal' }),
  });

  function get(kind) {
    return kinds[kind] || null;
  }

  function require(kind) {
    const contract = get(kind);
    if (!contract) throw new Error(`Unknown upgrade kind: ${kind}`);
    return contract;
  }

  function applicator(kind) {
    return require(kind).applicator;
  }

  function allKinds() {
    return Object.keys(kinds);
  }

  function validateTables(descriptionByKind, chestTextByKind) {
    const missing = [];
    for (const kind of allKinds()) {
      if (kind !== 'heal' && typeof descriptionByKind[kind] !== 'function') missing.push(`${kind}:description`);
      if (typeof chestTextByKind[kind] !== 'function') missing.push(`${kind}:chest`);
      if (!get(kind).applicator) missing.push(`${kind}:applicator`);
    }
    if (missing.length) throw new Error(`Upgrade kind contract missing handlers: ${missing.join(', ')}`);
  }

  return { get, require, applicator, allKinds, validateTables };
})();
