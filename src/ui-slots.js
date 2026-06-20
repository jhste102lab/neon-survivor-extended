'use strict';
// Weapon, passive, and companion slot rendering.
/* ================================================================
   UI slots
   ================================================================ */
Object.assign(UI, {
  refreshSlots() {
    const p = Game.player;
    const weaponCount = $('weaponCount');
    if (weaponCount) weaponCount.textContent = tr('hud.weaponCount', { count: p.weapons.length, max: maxWeaponSlotsFor(Game) });
    let html = '';
    for (const w of p.weapons) {
      const max = w.lv >= MAX_LV;
      const over = Math.max(0, w.lv - MAX_LV);
      const evolved = p.evolved && p.evolved[w.id];
      html += `<div class="slot${max ? ' max' : ''}${evolved ? ' evolved' : ''}" title="${evolved ? EVOLUTIONS[w.id].name : WEAPONS[w.id].name}">${evolved ? EVOLUTIONS[w.id].icon : WEAPONS[w.id].icon}
        <span class="pips">${Array.from({ length: MAX_LV }, (_, i) => `<i class="${i < Math.min(w.lv, MAX_LV) ? 'on' : ''}"></i>`).join('')}</span>
        ${over ? `<span class="overlv">+${over}</span>` : evolved ? '<span class="overlv">E</span>' : ''}</div>`;
    }
    $('wslots').innerHTML = html;
    html = '';
    for (const id in p.passives) {
      const lv = p.passives[id], max = lv >= MAX_LV;
      html += `<div class="slot p${max ? ' max' : ''}" title="${PASSIVES[id].name}">${PASSIVES[id].icon}
        <span class="pips">${Array.from({ length: MAX_LV }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span></div>`;
    }
    if (p.companions && p.companions.count > 0) {
      for (const role of (p.companions.roles || [])) {
        const C = COMPANION_ROLES[role];
        if (C) html += `<div class="slot p max companion" title="${C.name}">${C.icon}</div>`;
      }
      const echoN = (p.companions.echoes || []).length;
      if (echoN > 0) html += `<div class="slot p max companion" title="${tr('companions.echoTitle')}">🧿<span class="overlv">+${echoN}</span></div>`;
    }
    $('pslots').innerHTML = html;
  },
});
