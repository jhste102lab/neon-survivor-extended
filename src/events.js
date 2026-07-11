'use strict';
// Field event state machine plus opt-in random dimension portal scheduler.
Object.assign(Game, {
  eventDelay() {
    return rand(72, 108) * (this.endless ? 1 : 1.15);
  },

  eventSpawnBlocked() {
    if (this.boss) return true;
    if (this.lastBossSpawnT && this.time - this.lastBossSpawnT < 15) return true;
    return false;
  },

  updateEvents(dt, st) {
    if (!this.player || this.player.dead) return;
    this.updateDimensionRiftOfferSchedule();
    if (!this.activeEvent && this.evolutionUnlocked && this.evolutionUnlocked() && this.time >= this.nextEventT) {
      if (this.eventSpawnBlocked()) this.nextEventT = this.time + 10;
      else this.spawnEventOffer();
    }
    const ev = this.activeEvent;
    if (!ev) return;

    const p = this.player;
    ev.life -= dt;
    ev.pulse = (ev.pulse || 0) + dt;

    if (ev.state === 'offer') {
      if (this.eventSpawnBlocked()) { ev.life = Math.min(ev.maxLife, ev.life + dt); return; }
      if (dist2(p.x, p.y, ev.x, ev.y) < ev.r * ev.r) this.activateEvent(ev);
      else if (ev.life <= 0) {
        const info = this.eventDisplayInfo(ev);
        GameRuntime.banner(tr('event.vanished', { icon: info.icon, name: info.name }), 'info');
        this.activeEvent = null;
        this.nextEventT = this.time + this.eventDelay();
      }
      return;
    }

    FieldEventDefinitions.require(ev.type).update(this, ev, dt, st);
  },

  updateDimensionRiftOfferSchedule() {
    const cfg = CFG.dimensionRift || {};
    const due = this.nextDimensionRiftT || cfg.firstCheck || 120;
    if (cfg.enabled === false || this.finalDimensionRiftOffered || this.activeEvent || this.time < due) return;
    if (due > (cfg.lastRandomCheck || 480)) return;
    if (this.eventSpawnBlocked()) { this.nextDimensionRiftT = this.time + 10; return; }
    this.nextDimensionRiftT = due + (cfg.interval || 120);
    if (RNG.next() >= (cfg.chance || 0.3)) return;
    this.spawnDimensionPortal(false);
  },

  spawnDimensionPortal(final = false, x = null, y = null) {
    if (this.activeEvent || !Array.isArray(DIMENSIONS) || !DIMENSIONS.length) return false;
    const def = pick(DIMENSIONS);
    this.spawnEventOffer('rift', { dimension: def.id, scheduledRift: true, final, x, y });
    if (final) this.finalDimensionRiftOffered = true;
    return true;
  },

  offerFinalDimensionRift(x, y) {
    if (this.finalDimensionRiftOffered) return false;
    if (this.activeEvent) this.activeEvent = null;
    return this.spawnDimensionPortal(true, x, y);
  },

  eventDisplayInfo(ev) {
    if (ev && ev.type === 'rift' && typeof DimensionRiftRules !== 'undefined') {
      const full = typeof DIMENSIONS !== 'undefined' && DIMENSIONS.find(def => def.id === ev.dimension);
      if (full) return { icon: full.icon, name: `${full.name} 차원 균열`, color: full.color };
      const dim = DimensionRiftRules.get(ev.dimension);
      return { icon: dim.icon, name: dim.name, color: dim.color };
    }
    return FIELD_EVENTS[ev.type] || FIELD_EVENTS.rift;
  },

  spawnEventOffer(type = null, opts = {}) {
    if (this.activeEvent) return;
    const p = this.player;
    const selectedType = type || pick(FieldEventDefinitions.ids());
    const a = rand(0, TAU), d = rand(220, 360);
    const definition = FieldEventDefinitions.require(selectedType);
    const cfg = CFG.dimensionRift || {};
    const offerLife = selectedType === 'rift' && opts.scheduledRift ? (cfg.offerLife || definition.offerLife) : definition.offerLife;
    const offerRadius = selectedType === 'rift' && opts.scheduledRift ? (cfg.offerRadius || definition.offerRadius) : definition.offerRadius;
    this.activeEvent = {
      state: 'offer', type: selectedType,
      dimension: selectedType === 'rift' ? (opts.dimension || (typeof DimensionRiftRules !== 'undefined' ? DimensionRiftRules.pick().id : 'archive')) : '',
      scheduledRift: !!opts.scheduledRift,
      x: Number.isFinite(opts.x) ? opts.x : p.x + Math.cos(a) * d,
      y: Number.isFinite(opts.y) ? opts.y : p.y + Math.sin(a) * d,
      r: offerRadius, life: offerLife, maxLife: offerLife, hold: 0, pulse: 0,
    };
    this.metrics.eventOffers++;
    const info = this.eventDisplayInfo(this.activeEvent);
    GameRuntime.banner(tr('event.offer', { icon: info.icon, name: info.name }), 'info');
  },

  activateEvent(ev) {
    if (ev.type === 'rift' && ev.scheduledRift && this.enterAutomaticDimensionRift) {
      const dimensionId = ev.dimension;
      this.activeEvent = null;
      this.enterAutomaticDimensionRift(dimensionId);
      return;
    }
    ev.state = 'active';
    ev.startedAt = this.time;
    ev.pulse = 0;
    ev.spawnT = 0.6;
    ev.hazardT = 1.0;
    ev.hold = 0;
    const definition = FieldEventDefinitions.require(ev.type);
    const cfg = CFG.dimensionRift || {};
    ev.maxLife = ev.type === 'rift' && ev.scheduledRift ? (cfg.activeLife || definition.activeLife) : definition.activeLife;
    ev.life = ev.maxLife;
    ev.r = ev.type === 'rift' && ev.scheduledRift ? (cfg.activeRadius || definition.activeRadius) : definition.activeRadius;
    this.metrics.eventStarts++;
    const info = this.eventDisplayInfo(ev);
    GameRuntime.banner(tr('event.start', { icon: info.icon, name: info.name }), 'warn');
  },

  completeEvent(ev, success) {
    const info = this.eventDisplayInfo(ev);
    if (success) {
      this.metrics.eventSuccess++;
      GameRuntime.banner(tr('event.complete', { icon: info.icon, name: info.name }), 'good');
      this.grantEventReward(ev);
    } else {
      GameRuntime.banner(tr('event.fail', { icon: info.icon, name: info.name }), 'warn');
    }
    this.activeEvent = null;
    this.nextEventT = this.time + this.eventDelay();
  },
});
