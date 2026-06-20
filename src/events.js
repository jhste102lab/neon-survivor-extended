'use strict';
// Post-unlock field event state machine. Specific event behaviors and rewards live in event-* modules.
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
    if (!this.evolutionUnlocked || !this.evolutionUnlocked()) return;
    if (!this.activeEvent && this.time >= this.nextEventT) {
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
        const info = FIELD_EVENTS[ev.type];
        GameRuntime.banner(tr('event.vanished', { icon: info.icon, name: info.name }), 'info');
        this.activeEvent = null;
        this.nextEventT = this.time + this.eventDelay();
      }
      return;
    }

    FieldEventDefinitions.require(ev.type).update(this, ev, dt, st);
  },

  spawnEventOffer() {
    if (this.activeEvent) return;
    const p = this.player;
    const type = pick(FieldEventDefinitions.ids());
    const a = rand(0, TAU), d = rand(220, 360);
    this.activeEvent = {
      state: 'offer', type,
      x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d,
      r: FieldEventDefinitions.require(type).offerRadius, life: FieldEventDefinitions.require(type).offerLife, maxLife: FieldEventDefinitions.require(type).offerLife, hold: 0, pulse: 0,
    };
    this.metrics.eventOffers++;
    GameRuntime.banner(tr('event.offer', { icon: FIELD_EVENTS[type].icon, name: FIELD_EVENTS[type].name }), 'info');
  },

  activateEvent(ev) {
    ev.state = 'active';
    ev.startedAt = this.time;
    ev.pulse = 0;
    ev.spawnT = 0.6;
    ev.hazardT = 1.0;
    ev.hold = 0;
    const definition = FieldEventDefinitions.require(ev.type);
    ev.maxLife = definition.activeLife;
    ev.life = ev.maxLife;
    ev.r = definition.activeRadius;
    this.metrics.eventStarts++;
    GameRuntime.banner(tr('event.start', { icon: FIELD_EVENTS[ev.type].icon, name: FIELD_EVENTS[ev.type].name }), 'warn');
  },

  completeEvent(ev, success) {
    const info = FIELD_EVENTS[ev.type];
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
