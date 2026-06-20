'use strict';
// Owned registry for split-script extension points. Keep this script early in index.html.
(function initNeonSurvivorRegistry(global) {
  const root = global.NS || (global.NS = {});
  const weaponFireHandlers = global.WeaponFireHandlers || Object.create(null);
  global.WeaponFireHandlers = weaponFireHandlers; // backwards-compatible debug hook

  function cleanId(id) {
    return String(id || '').trim();
  }

  function assertCallable(name, fn) {
    if (typeof fn !== 'function') throw new Error(`${name} must be a function`);
  }

  function registerWeaponFireHandler(id, fn) {
    const key = cleanId(id);
    if (!key) throw new Error('Weapon fire handler id is required');
    assertCallable(`Weapon fire handler "${key}"`, fn);
    if (weaponFireHandlers[key] && weaponFireHandlers[key] !== fn) {
      throw new Error(`Duplicate weapon fire handler registration: ${key}`);
    }
    weaponFireHandlers[key] = fn;
    return fn;
  }

  function getWeaponFireHandler(id) {
    return weaponFireHandlers[cleanId(id)] || null;
  }

  function listWeaponFireHandlers() {
    return Object.keys(weaponFireHandlers).sort();
  }

  function assertWeaponFireHandlers(ids) {
    const missing = (ids || []).filter(id => !getWeaponFireHandler(id));
    if (missing.length) {
      throw new Error(`Missing weapon fire handlers: ${missing.join(', ')}. Load weapon-fire-*.js before weapon-fire.js/main.js.`);
    }
  }

  root.registry = root.registry || {};
  Object.assign(root.registry, {
    registerWeaponFireHandler,
    getWeaponFireHandler,
    listWeaponFireHandlers,
    assertWeaponFireHandlers,
  });

  global.NeonSurvivorRegistry = root.registry;
  global.registerWeaponFireHandler = registerWeaponFireHandler;
  global.getWeaponFireHandler = getWeaponFireHandler;
})(globalThis);
