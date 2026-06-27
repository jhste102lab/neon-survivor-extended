'use strict';
// Pause build-list HTML rendering from DTOs.
function pauseBuildAttributesHtml(attributes) {
  let html = '';
  for (const [name, value] of attributes) html += ` ${name}="${value}"`;
  return html;
}

const UIPauseBuildHtml = {
  renderSlot(slot, index = -1) {
    const detailAttr = slot.detail ? ` data-detail-index="${index}"` : '';
    return `<div class="${slot.className}"${pauseBuildAttributesHtml(slot.attributes)}${detailAttr}>${slot.icon}<em>${slot.badge}</em></div>`;
  },

  renderCompanionRow(row) {
    return `<div class="companionInfoRow"><b>${row.icon} ${row.name}${row.rank > 1 ? ` Lv.${row.rank}` : ''}</b><span>${row.summary}</span></div>`;
  },

  render(build) {
    const slotsHtml = build.slots.map((slot, index) => UIPauseBuildHtml.renderSlot(slot, index)).join('');
    const emptyHtml = `<span style="color:#5e7390">${tr('build.empty')}</span>`;
    const companionInfo = build.companionInfo.map(row => UIPauseBuildHtml.renderCompanionRow(row)).join('');
    return (slotsHtml || emptyHtml) + (companionInfo ? `<div class="companionInfo">${companionInfo}</div>` : '');
  },
};
