'use strict';
// Canvas drawing for collectible gems and timed drop pickups.
const DropRenderAssets = (() => {
  const icons = Object.freeze({ chicken: '🍗', magnet: '🧲', bomb: '💣', chest: '📦' });
  const colors = Object.freeze({ chicken: '#7dffc1', magnet: '#41f0ff', bomb: '#ff4d5e', chest: '#ffd23d' });
  const backs = Object.freeze({ chicken: 'rgba(35,100,62,.78)', magnet: 'rgba(20,78,110,.78)', bomb: 'rgba(98,24,42,.8)', chest: 'rgba(96,70,18,.82)' });
  const cache = Object.create(null);

  function key(kind, mobileScale, imminent) {
    return `${kind}_${Math.round(mobileScale * 100)}_${imminent ? 1 : 0}`;
  }

  function sprite(kind, mobileScale, imminent = false) {
    const id = key(kind, mobileScale, imminent);
    if (cache[id]) return cache[id];
    const size = Math.ceil(76 * mobileScale);
    const c = size / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const x = cv.getContext('2d');
    const color = colors[kind] || '#ffffff';
    const glow = Sprites.glowDot(color, 16 * mobileScale);
    x.drawImage(glow, 0, 0, size, size);
    x.globalAlpha = 0.92;
    x.fillStyle = backs[kind] || 'rgba(10,14,34,.78)';
    x.beginPath(); x.arc(c, c, 20 * mobileScale, 0, TAU); x.fill();
    x.globalAlpha = 1;
    x.strokeStyle = color;
    x.lineWidth = 2.5 * mobileScale;
    x.beginPath(); x.arc(c, c, 22 * mobileScale, 0, TAU); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `${Math.round((imminent ? 30 : 27) * mobileScale)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
    x.shadowColor = 'rgba(0,0,0,.95)';
    x.shadowBlur = 5 * mobileScale;
    x.shadowOffsetY = 1.5 * mobileScale;
    x.fillText(icons[kind] || '?', c, c + 0.5 * mobileScale);
    x.shadowBlur = 0; x.shadowOffsetY = 0;
    cache[id] = cv;
    return cv;
  }

  return { colors, sprite };
})();

Object.assign(Render, {
  drawGems(x, frame = this._frame) {
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => this.worldVisible(px, py, pad);
    const colors = ['#3dff8e', '#19a8ff', '#d44dff'];
    const ms = this.mobileVisualScale();
    const sizes = [5.5 * ms, 7 * ms, 10 * ms];
    const clarity = Game.clarityK ? Game.clarityK() : 0;
    const drawLimit = Math.round(lerp(260, 96, clarity));
    const stride = Game.gems.length > drawLimit ? Math.ceil(Game.gems.length / drawLimit) : 1;
    let index = 0;
    x.save();
    x.globalAlpha = 1 - clarity * 0.42;
    for (const g of Game.gems) {
      if (stride > 1 && (index++ % stride) !== 0 && !g.mag && g.tier < 2) continue;
      if (!visible(g.x, g.y, 90)) continue;
      const r = sizes[g.tier] * (1 + Math.sin(g.bob) * 0.12);
      const sp = Sprites.glowDot(colors[g.tier], sizes[g.tier]);
      x.drawImage(sp, g.x - r * 2.5, g.y - r * 2.5, r * 5, r * 5);
      // 다이아 코어
      x.fillStyle = '#fff';
      x.save(); x.translate(g.x, g.y); x.rotate(Math.PI / 4);
      x.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
      x.restore();
    }
    x.restore();
  },
  drawDrops(x, frame = this._frame) {
    const visible = frame && frame.worldVisible ? frame.worldVisible : (px, py, pad) => this.worldVisible(px, py, pad);
    const ms = this.mobileVisualScale();
    const clarity = Game.clarityK ? Game.clarityK() : 0;
    const commonDrawLimit = Game.dropLimit ? Math.max(28, Math.round(Game.dropLimit() * lerp(0.72, 0.42, clarity))) : 96;
    let commonDrawn = 0;
    for (const d of Game.drops) {
      if (!visible(d.x, d.y, 130)) continue;
      const important = d.boss || d.kind === 'chest';
      if (!important && commonDrawn++ >= commonDrawLimit) continue;
      const fy = d.y + Math.sin(d.bob) * 5;
      const lifeK = d.maxLife ? clamp(d.life / d.maxLife, 0, 1) : 1;
      const warning = d.life < 60;
      const imminent = d.life < 20;
      const blink = imminent ? (0.48 + Math.sin(Game.time * 16) * 0.24) : warning ? (0.76 + Math.sin(Game.time * 8) * 0.12) : 1;
      const sprite = DropRenderAssets.sprite(d.kind, ms, imminent);

      x.globalAlpha = blink * (important ? 1 : 1 - clarity * 0.32);
      x.drawImage(sprite, d.x - 38 * ms, fy - 38 * ms, 76 * ms, 76 * ms);
      x.globalAlpha = 1;
      if ((d.stack || 1) > 1) {
        x.fillStyle = '#07121d';
        x.strokeStyle = DropRenderAssets.colors[d.kind] || '#ffffff';
        x.lineWidth = 1.5 * ms;
        x.beginPath(); x.arc(d.x + 19 * ms, fy - 19 * ms, 10 * ms, 0, TAU); x.fill(); x.stroke();
        x.fillStyle = '#ffffff';
        x.font = `bold ${Math.round(11 * ms)}px Arial`;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(`x${d.stack}`, d.x + 19 * ms, fy - 19 * ms + 0.5 * ms);
      }
      if (warning) {
        x.strokeStyle = imminent ? '#ff4d5e' : (DropRenderAssets.colors[d.kind] || '#ffffff');
        x.lineWidth = imminent ? 3 : 2;
        x.beginPath(); x.arc(d.x, fy, 28 * ms, -Math.PI / 2, -Math.PI / 2 + TAU * lifeK); x.stroke();
      }
    }
  },
});
