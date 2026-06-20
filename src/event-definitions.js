'use strict';
// Field event registry: type-specific timing, radius, and active update dispatch live here.
const FieldEventDefinitions = (() => {
  const definitions = Object.create(null);

  function register(definition) {
    if (!definition || !definition.id) throw new Error('Field event definition id is required');
    if (definitions[definition.id]) throw new Error(`Duplicate field event definition: ${definition.id}`);
    if (typeof definition.update !== 'function') throw new Error(`Field event ${definition.id} missing update handler`);
    definitions[definition.id] = Object.freeze({
      offerLife: 24,
      offerRadius: 82,
      activeLife: 26,
      activeRadius: 118,
      ...definition,
    });
  }

  function get(id) {
    return definitions[id] || null;
  }

  function ids() {
    return Object.keys(definitions);
  }

  function require(id) {
    const definition = get(id);
    if (!definition) throw new Error(`Unknown field event type: ${id}`);
    return definition;
  }

  register({ id: 'rift', activeLife: 28, activeRadius: 118, update: (game, ev, dt, st) => game.updateRiftEvent(ev, dt, st) });
  register({ id: 'storm', activeLife: 20, activeRadius: 118, update: (game, ev, dt, st) => game.updateStormEvent(ev, dt, st) });
  register({ id: 'contract', activeLife: 32, activeRadius: 118, update: (game, ev, dt, st) => game.updateContractEvent(ev, dt, st) });
  register({ id: 'supply', activeLife: 26, activeRadius: 112, update: (game, ev, dt, st) => game.updateSupplyEvent(ev, dt, st) });

  return { register, get, ids, require };
})();
