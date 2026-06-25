'use strict';
// Camera shake, hit stop, particles, floating text, and transient visual effects.
Object.assign(Game, {
  shake(mag, dur) {
    if (this.test.noFx) return;
    this.shakeMag = Math.max(this.shakeMag * (this.shakeT > 0 ? 1 : 0), mag); this.shakeT = dur; this.shakeDur = dur;
  },

  hitStop(dur, scale) {
    if (this.test.noFx) return;
    this.hitStopT = dur; this.timeScale = scale;
  },

  spawnParticle(x, y, vx, vy, life, size, color, drag) {
    if (this.test.noFx) return;
    if (typeof PerformanceBudget !== 'undefined' && PerformanceBudget.visualPressure() > 0.72 && RNG.next() < 0.42) return;
    const P = this.particles;
    const cap = this.particleLimit ? this.particleLimit() : 700;
    const particle = P.length >= cap ? P[0] : {};
    particle.x = x; particle.y = y; particle.vx = vx; particle.vy = vy;
    particle.life = life; particle.maxLife = life; particle.size = size; particle.color = color; particle.drag = drag;
    if (P.length >= cap) P[0] = P[P.length - 1];
    P[P.length >= cap ? P.length - 1 : P.length] = particle;
  },

  spawnBurst(x, y, color, n, spd, size, life) {
    if (this.test.noFx) return;
    const scale = this.fxScale ? this.fxScale() : 1;
    const budgetScale = typeof PerformanceBudget !== 'undefined' ? PerformanceBudget.fxMultiplier() : 1;
    n = Math.max(1, Math.round(n * scale * budgetScale));
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(spd * 0.3, spd);
      this.spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(life * 0.5, life), rand(size * 0.5, size), color, 0.92);
    }
  },

  spawnText(x, y, txt, crit, color) {
    if (this.test.noFx) return;
    const late = this.clarityK ? this.clarityK() : (this.loadShedK ? this.loadShedK(CFG.unlockTime || 300, 240) : clamp((this.time - (CFG.lateRampStart || 420)) / 240, 0, 1));
    if (!crit && !color) {
      const keep = this.isMobileRuntime && this.isMobileRuntime() ? lerp(0.30, 0.06, late) : lerp(0.54, 0.10, late);
      if (RNG.next() > keep) return;
    } else if (color && !crit && late > 0.85 && !/[A-Z가-힣+]/.test(String(txt))) {
      if (RNG.next() > 0.45) return;
    }
    const T = this.texts;
    const cap = this.textLimit ? this.textLimit() : 70;
    const text = T.length >= cap ? T[0] : {};
    text.x = x; text.y = y; text.vy = -55; text.life = 0.7; text.txt = String(txt);
    text.crit = crit; text.color = color || (crit ? '#ffd23d' : '#ffffff');
    if (T.length >= cap) T[0] = T[T.length - 1];
    T[T.length >= cap ? T.length - 1 : T.length] = text;
  },

  updateFX(dt) {
    const P = this.particles;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= dt;
      if (p.life <= 0) { P[i] = P[P.length - 1]; P.pop(); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.drag) { const f = Math.pow(p.drag, dt * 60); p.vx *= f; p.vy *= f; }
    }
    const T = this.texts;
    for (let i = T.length - 1; i >= 0; i--) {
      const t = T[i];
      t.life -= dt; t.y += t.vy * dt; t.vy *= 0.95;
      if (t.life <= 0) { T[i] = T[T.length - 1]; T.pop(); }
    }
    if (this.megaAbsorbs) {
      for (let i = this.megaAbsorbs.length - 1; i >= 0; i--) {
        const g = this.megaAbsorbs[i];
        g.life -= dt;
        g.age = (g.age || 0) + dt;
        g.x += g.vx * dt; g.y += g.vy * dt;
        g.r = Math.max(3, g.r * Math.pow(0.985, dt * 60));
        if (g.life <= 0) { this.megaAbsorbs[i] = this.megaAbsorbs[this.megaAbsorbs.length - 1]; this.megaAbsorbs.pop(); }
      }
    }
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) { this.beams[i] = this.beams[this.beams.length - 1]; this.beams.pop(); }
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) { this.bolts[i] = this.bolts[this.bolts.length - 1]; this.bolts.pop(); }
    }
  },

  /* ---------- 일시정지 등 ---------- */
});
