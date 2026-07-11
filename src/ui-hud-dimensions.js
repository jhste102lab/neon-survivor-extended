'use strict';
// HUD text for dimension goals and complete-run status.
Object.assign(UI, {
  updateDimensionHud(G) {
    let el = $('dimensionHud');
    const dim = G.dimension;
    const show = !!(dim && (dim.unlocked || dim.mode === 'dimension' || dim.mode === 'collapse') && G.state !== 'title');
    if (!el && show) {
      el = document.createElement('div');
      el.id = 'dimensionHud';
      document.body.appendChild(el);
    }
    if (!el) return;
    el.classList.toggle('hide', !show);
    if (!show) return;
    const completed = dim.completed ? Object.keys(dim.completed).length : 0;
    if (dim.mode === 'dimension') {
      const def = dim.activeDef || {};
      const briefing = dim.introT > 0;
      el.classList.toggle('briefing', briefing);
      el.innerHTML = briefing
        ? `<em>DIMENSION BRIEFING</em><b>${def.icon || '◆'} ${def.name || '차원'}</b><strong>${def.goal || '표시된 목표를 파괴하세요'}</strong><small>${def.playHint || def.summary || ''}</small>`
        : `<b>${def.icon || '◆'} ${def.name || '차원'}</b><strong>${G.dimensionActionText ? G.dimensionActionText() : ''}</strong><span>${G.dimensionProgressText ? G.dimensionProgressText() : ''}</span>`;
    } else if (dim.mode === 'hub') {
      el.classList.remove('briefing');
      el.innerHTML = `<b>차원 허브</b><span>정복 ${completed}/8 · 원하는 차원을 선택하세요</span>`;
    } else {
      el.classList.remove('briefing');
      el.innerHTML = `<b>차원문 개방</b><span>정복 ${completed}/8 · 허브 포털로 진입</span>`;
    }
  },
});
