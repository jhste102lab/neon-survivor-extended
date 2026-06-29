'use strict';
// Pause overlay presentation.
function pauseDetailEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

const UIPauseOverlay = {
  termGlossaryHtml() {
    const rows = ['pierce', 'delay', 'kb', 'cd', 'hitCd']
      .map(key => `<span>${pauseDetailEscape(tr(`pause.terms.${key}`))}</span>`)
      .join('');
    return `<div class="pauseTermCard"><b>${pauseDetailEscape(tr('pause.terms.title'))}</b><div>${rows}</div></div>`;
  },

  detailCardHtml(detail) {
    if (!detail) return '';
    const rows = (detail.details || []).slice(0, 6).map(line => `<span>${pauseDetailEscape(line)}</span>`).join('');
    const toggled = detail.kind === 'weapon';
    const off = toggled && !!detail.effectHidden;
    const attrs = toggled ? ` data-weapon-id="${pauseDetailEscape(detail.id)}" role="button" tabindex="0"` : '';
    return `<div class="pauseMiniCard${off ? ' effectOff' : ''}${toggled ? ' effectToggle' : ''}"${attrs}>
      <div class="pauseMiniHead"><span>${pauseDetailEscape(detail.icon)}</span><b>${pauseDetailEscape(detail.name)}</b><em>${pauseDetailEscape(detail.level)}</em>${toggled ? `<strong>${off ? 'FX OFF' : 'FX ON'}</strong>` : ''}</div>
      <p>${pauseDetailEscape(detail.desc)}</p>
      ${rows ? `<div class="pauseMiniRows">${rows}</div>` : ''}
    </div>`;
  },

  renderBuildDetails(build) {
    const panel = $('pauseDetail');
    if (!panel) return;
    const details = (build.slots || []).map(slot => slot.detail).filter(Boolean);
    const hasWeapon = details.some(detail => detail.kind === 'weapon');
    panel.innerHTML = details.map(detail => this.detailCardHtml(detail)).join('') + (hasWeapon ? this.termGlossaryHtml() : '');
    panel.classList.toggle('hide', !details.length);
  },

  toggleWeaponEffect(id) {
    if (!Game.toggleWeaponEffectHidden || !Game.toggleWeaponEffectHidden(id)) return;
    this.renderPauseBuild();
  },

  bindEffectToggles() {
    document.querySelectorAll('#pauseOv [data-detail-kind="weapon"], #pauseDetail [data-weapon-id]').forEach(el => {
      const id = el.dataset.detailId || el.dataset.weaponId;
      el.addEventListener('click', () => this.toggleWeaponEffect(id));
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.toggleWeaponEffect(id);
      });
    });
  },

  renderPauseBuild() {
    const build = UIPauseBuildDto.fromPlayer(Game.player);
    $('buildList').innerHTML = UIPauseBuildHtml.render(build);
    this.renderBuildDetails(build);
    this.bindEffectToggles();
  },

  showPause() {
    this.renderPauseBuild();
    showOverlay('pauseOv');
  },
};
