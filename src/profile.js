'use strict';
// Player nickname generation, sanitization, and local persistence.
const Profile = {
  storageKey: 'ns_nick',
  adjectives: ['귀여운', '용감한', '신비한', '빠른', '반짝이는', '조용한', '명랑한', '날쌘', '엉뚱한', '똑똑한', '행복한', '강철같은'],
  animals: ['햄스터', '고양이', '강아지', '토끼', '여우', '판다', '수달', '펭귄', '고래', '호랑이', '다람쥐', '부엉이'],
  specials: ['', '', '!', '@', '#', '*', '?'],

  secureInt(max) {
    if (max <= 0) return 0;
    try {
      if (crypto && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] % max;
      }
    } catch (e) {}
    return Math.floor(Math.random() * max);
  },

  generateName() {
    const adj = this.adjectives[this.secureInt(this.adjectives.length)];
    const animal = this.animals[this.secureInt(this.animals.length)];
    const num = String(this.secureInt(10000)).padStart(4, '0');
    const sp = this.specials[this.secureInt(this.specials.length)];
    return `${adj}${animal}${num}${sp}`;
  },

  sanitizeName(raw) {
    const compact = String(raw || '').trim().replace(/\s+/g, '').replace(/[<>&"'`]/g, '');
    return Array.from(compact).slice(0, 20).join('');
  },

  loadName() {
    try { return this.sanitizeName(localStorage.getItem(this.storageKey) || ''); }
    catch (e) { return ''; }
  },

  saveName(name) {
    const safe = this.sanitizeName(name);
    if (!safe) return '';
    try { localStorage.setItem(this.storageKey, safe); } catch (e) {}
    return safe;
  },

  setInputValue(name) {
    const input = $('nickInput');
    if (input) input.value = name;
  },

  initDom() {
    const input = $('nickInput');
    if (!input) return;
    const name = this.loadName() || this.generateName();
    this.saveName(name);
    input.value = name;
    input.addEventListener('change', () => {
      const next = this.ensureName();
      input.value = next;
    });
  },

  randomizeInput() {
    const name = this.generateName();
    this.saveName(name);
    this.setInputValue(name);
    return name;
  },

  ensureName() {
    const input = $('nickInput');
    let name = this.sanitizeName(input ? input.value : this.loadName());
    if (!name) name = this.generateName();
    this.saveName(name);
    this.setInputValue(name);
    return name;
  },

  runId() {
    const n = Date.now().toString(36);
    const r = String(this.secureInt(36 ** 4)).padStart(4, '0');
    return `${n}-${r}`;
  },
};
