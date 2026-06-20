'use strict';
// In-run banner notifications.
const UIHudBanner = {
  banner(txt, cls) {
    if (Game.test && Game.test.headless) return;
    const wrap = $('bannerwrap');
    while (wrap.children.length >= 3) wrap.firstChild.remove();
    const el = document.createElement('div');
    el.className = 'banner ' + cls;
    el.textContent = txt;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
};
