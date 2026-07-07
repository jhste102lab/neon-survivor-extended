'use strict';
// Start-screen item drop filter preferences. Boss rewards intentionally ignore these filters.
const DropPreferences = {
  key: 'ns_drop_preferences_v1',
  defaultKinds: Object.freeze({ chicken: true, magnet: true, bomb: true }),
  labels: Object.freeze({ chicken: '🍗 치킨', magnet: '🧲 자석', bomb: '💣 폭탄' }),

  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.key) || 'null');
      return { ...this.defaultKinds, ...(raw && typeof raw === 'object' ? raw : {}) };
    } catch (e) {
      this.noteStorageFallback('load', e);
      return { ...this.defaultKinds };
    }
  },

  save(prefs) {
    try { localStorage.setItem(this.key, JSON.stringify({ ...this.defaultKinds, ...(prefs || {}) })); }
    catch (e) { this.noteStorageFallback('save', e); }
  },

  noteStorageFallback(action, error) {
    this.lastError = error && error.message ? `${action}: ${error.message}` : `${action}: storage unavailable`;
  },

  enabled(kind) {
    const prefs = this.load();
    return prefs[kind] !== false;
  },

  render(container) {
    if (!container) return;
    const prefs = this.load();
    container.innerHTML = Object.keys(this.defaultKinds).map(kind => `<label class="dropPrefChip${prefs[kind] === false ? ' off' : ''}">
      <input type="checkbox" data-drop-kind="${kind}" ${prefs[kind] === false ? '' : 'checked'}>
      <span>${this.labels[kind] || kind}</span>
    </label>`).join('');
    container.querySelectorAll('[data-drop-kind]').forEach(input => {
      input.addEventListener('change', () => {
        const next = this.load();
        next[input.dataset.dropKind] = !!input.checked;
        this.save(next);
        this.render(container);
      });
    });
  },

  initDom() {
    this.render(typeof $ === 'function' ? $('dropPrefChoices') : null);
  },
};

globalThis.DropPreferences = DropPreferences;

Object.assign(Game, {
  itemDropEnabled(kind) {
    if (!kind || typeof DropPreferences === 'undefined') return true;
    return DropPreferences.enabled(kind);
  },
});
