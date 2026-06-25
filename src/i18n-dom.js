'use strict';
// DOM localization binding/application and runtime UI refresh helpers.
var I18N_DOM = {
  htmlKeys: Object.freeze(['help.tip', 'profile.controlsHint', 'title.controlsHint', 'leaderboard.bestLine']),

  assertHtmlAllowed(key) {
    if (!this.htmlKeys.includes(key)) throw new Error(`Translation key is not HTML-allowlisted: ${key}`);
  },

  populateLanguageSelect() {
    const group = typeof document !== 'undefined' ? document.getElementById('languageChoices') : null;
    if (!group || group.children.length) return;
    for (const code of this.supported) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'languageChoice';
      btn.dataset.lang = code;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.textContent = this.names[code];
      group.appendChild(btn);
    }
  },

  bindLanguageSelect() {
    const group = typeof document !== 'undefined' ? document.getElementById('languageChoices') : null;
    if (!group || group.dataset.i18nBound === '1') return;
    group.dataset.i18nBound = '1';
    const choose = (locale) => {
      const next = this.normalize(locale) || this.fallback;
      const changed = next !== this.current;
      this.setLocale(next);
      if (changed && typeof Profile !== 'undefined' && Profile.randomizeInput) {
        Profile.randomizeInput();
      }
    };
    group.addEventListener('click', (event) => {
      const btn = event.target && event.target.closest ? event.target.closest('.languageChoice') : null;
      if (!btn || !group.contains(btn)) return;
      choose(btn.dataset.lang);
    });
    group.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      const buttons = [...group.querySelectorAll('.languageChoice')];
      const index = buttons.findIndex(btn => btn.dataset.lang === this.current);
      const dir = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const next = buttons[(Math.max(0, index) + dir + buttons.length) % buttons.length];
      if (!next) return;
      event.preventDefault();
      next.focus();
      choose(next.dataset.lang);
    });
  },

  applyDom() {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = this.current === 'zh' ? 'zh-CN' : this.current;
    document.title = this.t('meta.title');
    document.querySelectorAll('[data-i18n-content]').forEach(el => { el.setAttribute('content', this.t(el.dataset.i18nContent)); });
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      I18N_DOM.assertHtmlAllowed(key);
      el.innerHTML = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', this.t(el.dataset.i18nPlaceholder)); });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', this.t(el.dataset.i18nTitle)); });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', this.t(el.dataset.i18nAriaLabel)); });
    document.querySelectorAll('.languageChoice').forEach(btn => {
      const active = btn.dataset.lang === this.current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
  },

  refreshRuntime() {
    if (typeof UI === 'undefined' || typeof Game === 'undefined') return;
    try {
      UI.refreshTitleBest && UI.refreshTitleBest();
      UI.refreshBestMini && UI.refreshBestMini();
      if (Game.player) {
        UI.updateTimer && UI.updateTimer(Game.time || 0);
        UI.refreshSlots && UI.refreshSlots();
      }
      UI.renderLeaderboard && UI.renderLeaderboard('titleLeaderboard');
      if (Game.state === 'levelup' && UI.renderCards) UI.renderCards();
      if (Game.state === 'pause' && UI.showPause) UI.showPause();
      if (Game.state === 'over' && UI.statsHtml) document.getElementById('overStats').innerHTML = UI.statsHtml();
      if (Game.state === 'win' && UI.statsHtml) document.getElementById('winStats').innerHTML = UI.statsHtml();
    } catch (e) {
      if (typeof console !== 'undefined' && console.debug) console.debug('i18n runtime refresh skipped', e && e.message ? e.message : e);
    }
  },

  install(i18n) {
    i18n.populateLanguageSelect = I18N_DOM.populateLanguageSelect;
    i18n.bindLanguageSelect = I18N_DOM.bindLanguageSelect;
    i18n.applyDom = I18N_DOM.applyDom;
    i18n.refreshRuntime = I18N_DOM.refreshRuntime;
  },
};
