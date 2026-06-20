'use strict';
// Expanding nova/area-effect update orchestration.
Object.assign(Game, {
  ensureNovaHelpers() {
    const missing = [];
    if (typeof NovaFields === 'undefined') missing.push('nova-fields.js');
    if (typeof NovaRings === 'undefined') missing.push('nova-rings.js');
    if (missing.length) {
      throw new Error(`Nova helper scripts missing: ${missing.join(', ')}. Load them before novas.js.`);
    }
  },

  removeNovaAt(i) {
    const last = this.novas.pop();
    if (i < this.novas.length) this.novas[i] = last;
  },

  updateNovas(dt, st) {
    this.ensureNovaHelpers();

    for (let i = this.novas.length - 1; i >= 0; i--) {
      const n = this.novas[i];
      if (NovaRings.delayActive(n, dt)) continue;

      NovaRings.startVisual(this, n);

      if (n.field) {
        if (NovaFields.update(this, n, dt)) this.removeNovaAt(i);
        continue;
      }

      if (NovaRings.update(this, n, dt, st)) this.removeNovaAt(i);
    }
  },
});

