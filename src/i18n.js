'use strict';
// Runtime localization core facade. Data and side-effect helpers live in i18n-*.js.
// English is the fallback; browser/system language is detected on first load.
const I18N = {
  storageKey: 'ns_lang',
  fallback: 'en',
  supported: ['en', 'ko', 'zh', 'ja'],
  names: { en: 'English', ko: '한국어', zh: '简体中文', ja: '日本語' },
  current: 'en',
  dictionaries: {},
  content: {},
  dom: null,
  contentApplier: null,

  configure(parts = {}) {
    this.dictionaries = parts.dictionaries || this.dictionaries || {};
    this.content = parts.content || this.content || {};
    this.dom = parts.dom || this.dom;
    this.contentApplier = parts.contentApplier || this.contentApplier;
    if (this.dom && typeof this.dom.install === 'function') this.dom.install(this);
    if (this.contentApplier && typeof this.contentApplier.install === 'function') this.contentApplier.install(this);
  },

  normalize(locale) {
    const raw = String(locale || '').toLowerCase();
    if (raw.startsWith('ko')) return 'ko';
    if (raw.startsWith('ja')) return 'ja';
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('en')) return 'en';
    return '';
  },

  detect() {
    try {
      const qs = new URLSearchParams(location.search);
      const fromUrl = this.normalize(qs.get('lang'));
      if (fromUrl) return fromUrl;
    } catch (e) {}
    try {
      const saved = this.normalize(localStorage.getItem(this.storageKey));
      if (saved) return saved;
    } catch (e) {}
    const langs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    for (const lang of langs) {
      const hit = this.normalize(lang);
      if (hit) return hit;
    }
    return this.fallback;
  },

  t(key, vars = {}) {
    const dict = this.dictionaries[this.current] || this.dictionaries[this.fallback];
    const fb = this.dictionaries[this.fallback] || {};
    let text = (dict && dict[key]) || fb[key] || key;
    return String(text).replace(/\{(\w+)\}/g, (_, name) => vars[name] == null ? '' : String(vars[name]));
  },

  init() {
    this.setLocale(this.detect(), { save: false, refresh: false });
    this.populateLanguageSelect();
    this.applyDom();
    this.applyContent();
    this.bindLanguageSelect();
  },

  setLocale(locale, opts = {}) {
    const next = this.normalize(locale) || this.fallback;
    this.current = this.supported.includes(next) ? next : this.fallback;
    if (opts.save !== false) {
      try { localStorage.setItem(this.storageKey, this.current); } catch (e) {}
    }
    this.applyDom();
    this.applyContent();
    if (opts.refresh !== false) this.refreshRuntime();
  },

  populateLanguageSelect() {},
  bindLanguageSelect() {},
  applyDom() {},
  refreshRuntime() {},
  assign() {},
  applyContent() {},
};

I18N.configure({
  dictionaries: typeof I18N_UI_COPY !== 'undefined' ? I18N_UI_COPY : {},
  content: typeof I18N_CONTENT !== 'undefined' ? I18N_CONTENT : {},
  dom: typeof I18N_DOM !== 'undefined' ? I18N_DOM : null,
  contentApplier: typeof I18N_CONTENT_APPLY !== 'undefined' ? I18N_CONTENT_APPLY : null,
});

function tr(key, vars) {
  return I18N.t(key, vars);
}

if (typeof globalThis !== 'undefined') {
  globalThis.I18N = I18N;
  globalThis.tr = tr;
}
