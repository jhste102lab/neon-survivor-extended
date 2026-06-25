'use strict';
// Low-cost boss interaction telegraphs: links, casts, and player debuff rings.
const RenderEffectBossInteractions = (() => {
  function drawLinks(x) {
    const links = Game.bossLinks || [];
    if (!links.length) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    for (const link of links) {
      const k = clamp(link.life / (link.maxLife || 0.4), 0, 1);
      x.globalAlpha = 0.18 + k * 0.58;
      x.strokeStyle = link.color || '#ff2bd6';
      x.lineWidth = 1.5 + k * 3.5;
      x.beginPath();
      x.moveTo(link.x1, link.y1);
      x.lineTo(link.x2, link.y2);
      x.stroke();
      if (link.label && k > 0.45) {
        x.font = 'bold 11px Arial';
        x.textAlign = 'center';
        x.fillStyle = link.color || '#ffffff';
        x.fillText(link.label, (link.x1 + link.x2) / 2, (link.y1 + link.y2) / 2 - 8);
      }
    }
    x.restore();
  }
  function drawBossCasts(x) {
    for (const boss of Game.enemies) {
      if (!boss || !boss.boss || !boss.bossCast) continue;
      const cast = boss.bossCast;
      const p = 1 - clamp(cast.t / (cast.max || 1), 0, 1);
      const r = boss.r + 34 + p * 42;
      x.save();
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.35 + Math.sin(Game.time * 18) * 0.12;
      x.strokeStyle = cast.color || '#ffffff';
      x.lineWidth = 3;
      x.setLineDash([14, 9]);
      x.beginPath(); x.arc(boss.x, boss.y, r, 0, TAU); x.stroke();
      x.setLineDash([]);
      x.globalAlpha = 0.12;
      x.fillStyle = cast.color || '#ffffff';
      x.beginPath(); x.arc(boss.x, boss.y, r * 0.82, 0, TAU); x.fill();
      x.restore();
    }
  }
  function drawPlayerDebuffs(x) {
    const d = Game.bossDebuffs;
    if (!d || !Game.player) return;
    const p = Game.player;
    const active = [d.dropSealT > 0 ? { key: tr('boss.seal.short'), color: '#ffd23d', t: d.dropSealT } : null,
      d.weaponSilenceT > 0 ? { key: tr('boss.silence.short'), color: '#9f7dff', t: d.weaponSilenceT } : null,
      d.controlT > 0 ? { key: tr('boss.distort.short'), color: '#41f0ff', t: d.controlT } : null].filter(Boolean);
    if (!active.length) return;
    x.save();
    x.textAlign = 'center';
    active.forEach((item, i) => {
      const pulse = 0.5 + Math.sin(Game.time * 9 + i) * 0.5;
      const r = CFG.player.radius + 18 + i * 9 + pulse * 4;
      x.globalAlpha = 0.34 + pulse * 0.18;
      x.strokeStyle = item.color;
      x.lineWidth = 2;
      x.beginPath(); x.arc(p.x, p.y, r, 0, TAU); x.stroke();
      x.globalAlpha = 0.92;
      x.fillStyle = item.color;
      x.font = 'bold 10px Arial';
      x.fillText(`${item.key} ${item.t.toFixed(1)}`, p.x, p.y - 42 - i * 13);
    });
    x.restore();
  }
  function draw(render, x, frame = null) {
    drawLinks(x, frame);
    drawBossCasts(x, frame);
    drawPlayerDebuffs(x, frame);
  }

  return { draw };
})();
globalThis.RenderEffectBossInteractions = RenderEffectBossInteractions;
