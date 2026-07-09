'use strict';
// Pause overlay presentation.
function pauseDetailEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

const UIPauseOverlay = {
  selectedDetailKey: '',

  detailKey(detail) {
    return detail ? `${detail.kind}:${detail.id}` : '';
  },

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
      ${toggled ? '<p class="pauseMiniHint">이 카드를 누르면 해당 무기 이펙트를 끄고 켭니다.</p>' : ''}
    </div>`;
  },

  renderBuildDetails(build) {
    const panel = $('pauseDetail');
    if (!panel) return;
    const details = (build.slots || []).map(slot => slot.detail).filter(Boolean);
    if (!details.length) {
      panel.innerHTML = '';
      panel.classList.add('hide');
      return;
    }
    const selected = details.find(detail => this.detailKey(detail) === this.selectedDetailKey) || details[0];
    this.selectedDetailKey = this.detailKey(selected);
    const hasWeapon = selected && selected.kind === 'weapon';
    panel.innerHTML = this.detailCardHtml(selected) + (hasWeapon ? this.termGlossaryHtml() : '');
    panel.classList.remove('hide');
    document.querySelectorAll('#buildList [data-detail-kind]').forEach(el => {
      el.classList.toggle('activeDetail', `${el.dataset.detailKind}:${el.dataset.detailId}` === this.selectedDetailKey);
    });
  },

  toggleWeaponEffect(id) {
    if (!Game.toggleWeaponEffectHidden || !Game.toggleWeaponEffectHidden(id)) return;
    this.renderPauseBuild();
  },

  bindBuildSelection(build) {
    document.querySelectorAll('#buildList [data-detail-kind]').forEach(el => {
      const key = `${el.dataset.detailKind}:${el.dataset.detailId}`;
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      const select = () => {
        this.selectedDetailKey = key;
        this.renderBuildDetails(build);
        this.bindEffectToggles();
      };
      el.addEventListener('click', select);
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        select();
      });
    });
  },

  bindEffectToggles() {
    document.querySelectorAll('#pauseDetail [data-weapon-id]').forEach(el => {
      const id = el.dataset.weaponId;
      el.addEventListener('click', () => this.toggleWeaponEffect(id));
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.toggleWeaponEffect(id);
      });
    });
  },

  syncAllFxButton() {
    const btn = $('btnAllWeaponFx');
    if (!btn) return;
    const weapons = Game.player && Game.player.weapons || [];
    const allOff = weapons.length > 0 && weapons.every(w => Game.weaponEffectHidden && Game.weaponEffectHidden(w.id));
    btn.textContent = allOff ? '무기 이펙트 모두 ON' : '무기 이펙트 모두 OFF';
  },

  renderPauseBuild() {
    const build = UIPauseBuildDto.fromPlayer(Game.player);
    $('buildList').innerHTML = UIPauseBuildHtml.render(build);
    this.renderBuildDetails(build);
    this.bindBuildSelection(build);
    this.bindEffectToggles();
    this.syncAllFxButton();
  },

  showPause() {
    this.selectedDetailKey = '';
    this.renderPauseBuild();
    showOverlay('pauseOv');
  },
};
