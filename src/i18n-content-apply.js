'use strict';
// Applies localized content patches onto runtime game data globals.
var I18N_CONTENT_APPLY = {
  baseTargets: null,

  clone(value) {
    if (Array.isArray(value)) return value.map(v => this.clone(v));
    if (value && typeof value === 'object') {
      const out = {};
      for (const key of Object.keys(value)) out[key] = this.clone(value[key]);
      return out;
    }
    return value;
  },

  captureBaseTargets() {
    if (this.baseTargets) return;
    this.baseTargets = {
      WEAPONS: typeof WEAPONS !== 'undefined' ? this.clone(WEAPONS) : null,
      PASSIVES: typeof PASSIVES !== 'undefined' ? this.clone(PASSIVES) : null,
      OVER_DESC: typeof OVER_DESC !== 'undefined' ? this.clone(OVER_DESC) : null,
      TRANSCEND: typeof TRANSCEND !== 'undefined' ? this.clone(TRANSCEND) : null,
      BOSSES: typeof BOSSES !== 'undefined' ? this.clone(BOSSES) : null,
      EVOLUTIONS: typeof EVOLUTIONS !== 'undefined' ? this.clone(EVOLUTIONS) : null,
      FIELD_EVENTS: typeof FIELD_EVENTS !== 'undefined' ? this.clone(FIELD_EVENTS) : null,
      COMPANION_ROLES: typeof COMPANION_ROLES !== 'undefined' ? this.clone(COMPANION_ROLES) : null,
      COMPANION_UPGRADES: typeof COMPANION_UPGRADES !== 'undefined' ? this.clone(COMPANION_UPGRADES) : null,
      Profile: typeof Profile !== 'undefined' ? { adjectives: [...Profile.adjectives], animals: [...Profile.animals] } : null,
    };
  },

  replaceObject(target, source) {
    if (!target || !source) return;
    for (const key of Object.keys(target)) delete target[key];
    for (const key of Object.keys(source)) target[key] = this.clone(source[key]);
  },

  restoreBaseTargets() {
    this.captureBaseTargets();
    const base = this.baseTargets || {};
    if (typeof WEAPONS !== 'undefined') this.replaceObject(WEAPONS, base.WEAPONS);
    if (typeof PASSIVES !== 'undefined') this.replaceObject(PASSIVES, base.PASSIVES);
    if (typeof OVER_DESC !== 'undefined') this.replaceObject(OVER_DESC, base.OVER_DESC);
    if (typeof TRANSCEND !== 'undefined' && base.TRANSCEND) { TRANSCEND.length = 0; base.TRANSCEND.forEach(row => TRANSCEND.push(this.clone(row))); }
    if (typeof BOSSES !== 'undefined' && base.BOSSES) { BOSSES.length = 0; base.BOSSES.forEach(row => BOSSES.push(this.clone(row))); }
    if (typeof EVOLUTIONS !== 'undefined') this.replaceObject(EVOLUTIONS, base.EVOLUTIONS);
    if (typeof FIELD_EVENTS !== 'undefined') this.replaceObject(FIELD_EVENTS, base.FIELD_EVENTS);
    if (typeof COMPANION_ROLES !== 'undefined') this.replaceObject(COMPANION_ROLES, base.COMPANION_ROLES);
    if (typeof COMPANION_UPGRADES !== 'undefined') this.replaceObject(COMPANION_UPGRADES, base.COMPANION_UPGRADES);
    if (typeof Profile !== 'undefined' && base.Profile) {
      Profile.adjectives = [...base.Profile.adjectives];
      Profile.animals = [...base.Profile.animals];
    }
  },

  assign(target, patch) {
    if (!target || !patch) return;
    for (const key of Object.keys(patch)) {
      if (Array.isArray(patch[key])) target[key] = [...patch[key]];
      else if (patch[key] && typeof patch[key] === 'object') target[key] = { ...(target[key] || {}), ...patch[key] };
      else target[key] = patch[key];
    }
  },

  applyLocalePatch(data, i18n) {
    if (!data) return;
    const weapons = data.weapons || {};
    const passives = data.passives || {};
    const transcend = data.transcend || {};
    const evolutions = data.evolutions || {};
    const fieldEvents = data.fieldEvents || {};
    const companionRoles = data.companions && data.companions.roles;
    if (typeof WEAPONS !== 'undefined') for (const id in weapons) this.assign(WEAPONS[id], weapons[id]);
    if (typeof PASSIVES !== 'undefined') for (const id in passives) this.assign(PASSIVES[id], passives[id]);
    if (typeof OVER_DESC !== 'undefined') Object.assign(OVER_DESC, data.overDesc || {});
    if (typeof TRANSCEND !== 'undefined') for (const row of TRANSCEND) this.assign(row, transcend[row.id]);
    if (typeof BOSSES !== 'undefined') (data.bosses || []).forEach((patch, i) => this.assign(BOSSES[i], patch));
    if (typeof EVOLUTIONS !== 'undefined') for (const id in evolutions) this.assign(EVOLUTIONS[id], evolutions[id]);
    if (typeof FIELD_EVENTS !== 'undefined') for (const id in fieldEvents) this.assign(FIELD_EVENTS[id], fieldEvents[id]);
    if (typeof COMPANION_ROLES !== 'undefined' && companionRoles) {
      for (const id in companionRoles) {
        this.assign(COMPANION_ROLES[id], companionRoles[id]);
        if (typeof COMPANION_UPGRADES !== 'undefined') this.assign(COMPANION_UPGRADES[id], companionRoles[id]);
      }
      if (typeof COMPANION_UPGRADES !== 'undefined') {
        for (const id in companionRoles) {
          const role = companionRoles[id];
          this.assign(COMPANION_UPGRADES[`echo_${id}`], {
            name: `${role.name}${i18n.t('companions.echoSuffix')}`,
            tag: i18n.t('companions.echoTag'),
            desc: i18n.t('companions.echoDesc'),
          });
        }
      }
    }
    if (typeof Profile !== 'undefined' && data.profile) {
      Profile.adjectives = [...data.profile.adjectives];
      Profile.animals = [...data.profile.animals];
    }
  },

  applyContentFor(i18n) {
    this.restoreBaseTargets();
    const fallbackData = i18n.content[i18n.fallback];
    const currentData = i18n.content[i18n.current];
    this.applyLocalePatch(fallbackData, i18n);
    if (i18n.current !== i18n.fallback) this.applyLocalePatch(currentData, i18n);
  },

  install(i18n) {
    i18n.assign = (target, patch) => I18N_CONTENT_APPLY.assign(target, patch);
    i18n.applyContent = () => I18N_CONTENT_APPLY.applyContentFor(i18n);
  },
};

