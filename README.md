[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

# 🌟 NEON SURVIVOR - Browser Bullet Hell Survival Shooting Game

**NEON SURVIVOR** is a fast browser bullet-hell survival shooter about one tiny pilot trapped inside a glowing monster storm. You dodge by hand, your weapons fire automatically, and every level-up turns the run into a new build: lightning chains, black holes, drones, mines, lasers, orbitals, evolutions, companions, and boss pressure that keeps escalating past 10 minutes.

No install, no downloads, no account required — open the page and survive as long as you can on PC or mobile. The current v1.1.2 Cloudflare build includes global leaderboard support, 24 weapon evolutions, recurring fusion bosses, speed controls, and late-game swarm rendering optimized for crowded screens.

## ▶️ Play online

Play now: **https://neon-survivor.pages.dev/**

## 🕹️ What kind of game is it?

- **Dodge-first action**: movement is the main skill; attacks are automatic so you can focus on threading through neon swarms.
- **Roguelite build choices**: choose upgrade cards, complete recipe passives, and evolve every weapon in the arsenal.
- **Escalating survival loop**: enemies speed up from 6 minutes, pressure becomes obvious around 7–8 minutes, and a huge Cluster Core fusion boss returns every 10 minutes.
- **Short-session web game**: instant restart, local records, optional global leaderboard, keyboard/mouse-free mobile joystick, and 1x/2x/3x speed controls.

## 🌐 Languages

- This English README is the default project README.
- In-game language is auto-detected from the browser/system language, with English as the fallback.
- Supported in-game languages: **English**, **한국어**, **简体中文**, **日本語**.
- Language buttons are available on the title screen before starting.
- UI copy, upgrade cards, weapons, passives, companions, events, records, and leaderboard text are localized.

## ▶️ Run locally

Run the game from any static server:

```bash
python3 -m http.server
```

Then open `http://127.0.0.1:8000/`.

Public deployment: **https://neon-survivor.pages.dev/**. Static hosts work for the game client; Cloudflare Pages Functions power the optional global leaderboard on the Cloudflare build.

## 🎮 Controls

| Input | Action |
|---|---|
| `WASD` / arrow keys | Move; attacks are automatic |
| `P` / `ESC` | Pause / resume |
| `M` | Toggle sound |
| `1` `2` `3` | Pick a level-up card; during play, use the on-screen `1x`/`2x`/`3x` buttons to change game speed |
| Mobile | Drag the lower screen for the virtual joystick |

## ⚔️ Features

- **24 weapons** in the current source build: Magic Bolt, Spinning Shuriken, Thunder Lightning, Flame Nova, Homing Missile, Prism Laser, Neon Boomerang, Frost Aura, Plasma Lance, Orbital Strike, Neon Shotgun, Drone Cannon, Black Hole Round, Chain Blade, Neon Arrow Rain, Shock Mine, Ricochet Disc, Time Rift, Railgun, Toxic Mist, Phoenix Feathers, Sonic Bomb, Ice Spear, and Satellite Laser.
- **8 passives**: Power Core, Overclock, Neon Boots, Reinforced Heart, Magnet Gloves, Nano Regen, Lucky Charm, and Rune of Wisdom.
- **Late-game unlocks at 5 minutes**: expanded weapon/passive slots, weapon evolutions, companions, and field events become available.
- **24 weapon evolutions**: every weapon can evolve when the weapon is maxed, its recipe passive is trained, and an Evolution Core is available. The 16 added evolutions emphasize damage, crowd control, targeting, and mobility pressure without adding new healing or shield effects.
- **Endless late loop**: there is no fixed victory screen; enemy speed and density begin ramping from 6 minutes, pressure is noticeable by 7–8 minutes, and after 10 minutes the loop keeps scaling difficulty and boss pressure, including recurring 10-minute Cluster Core fusion boss events.
- **Neon companions**: six companion roles can join and later gain rear-line resonance.
- **Field events**: rift, storm, contract, and supply events add timed risk/reward objectives after unlock.
- **Enemies and pressure systems**: six base enemy types, five post-unlock special enemies, three scheduled bosses, a recurring and more threatening 10-minute Cluster Core fusion boss, scaling endless bosses with randomized extra patterns, elites, silent idle-pressure missiles, and hazard patterns. Late-game enemy counts are preserved, while mass-enemy rendering is optimized with a low-resolution batching layer so huge swarms still look crowded with less frame hitching.
- **Drops, anti-idle pressure, speed controls, and records**: shorter-lived healing chicken, magnet, bomb, and treasure chest drops; magnet and idle-pressure banners are suppressed to reduce notification spam; idle play now reduces regeneration/shield sustain and lets idle missiles pierce barrier/invulnerability; title-screen nickname entry/randomization; in-run 1x/2x/3x speed controls; local records; and optional leaderboard submission.

## 🛠️ Tech notes

The current local build is split into responsibility-focused browser modules under `src/`, while `index.html` remains the DOM shell and classic-script entrypoint.

- **Rendering**: Canvas 2D, pre-rendered glow sprites, additive blending, split render modules, trimmed enemy glow sprite bounds, and a reusable mass-enemy layer for late-game swarm rendering without reducing enemy counts.
- **Audio**: Web Audio API synthesis for effects and music, with separate modules for graph lifecycle, mute persistence, music sequencing, and named SFX recipes.
- **Game logic**: separate modules for lifecycle, loop phases, stats, weapons, projectiles, evolutions, companions, events, hazards, upgrades, combat, loot, and UI.
- **Localization**: `src/i18n*.js` owns language detection, title-screen language buttons, DOM text updates, and localized game-content patches.
- **Leaderboard**: localStorage by default; Cloudflare Pages Functions can enable `/api/session` and `/api/leaderboard` for a global leaderboard.

## ✅ Local verification

Repo-local checks cover syntax, classic-script loader order, i18n safety, leaderboard contract drift, gameplay outcomes, audio behavior, and API boundaries:

```bash
npm run check:syntax
npm run verify
npx --yes wrangler pages functions build --outdir=/tmp/neon-survivor-functions-build
```

Browser smoke can be run with Playwright available in the invoking environment:

```bash
NEON_ROOT=$PWD node scripts/smoke-browser.mjs
```

## 🏆 Leaderboard deployment notes

- On static hosts such as GitHub Pages, global record validation is not available, so the game uses a **local unofficial leaderboard**.
- On Cloudflare Pages, `functions/api/session.js` and `functions/api/leaderboard.js` can serve the GLOBAL leaderboard flow.
- Bind a KV namespace as `LEADERBOARD` on the Pages project and redeploy.
- Set `LEADERBOARD_PREFIX` per environment, for example `prod`, `preview-$CF_PAGES_BRANCH`, or `staging`, so session, rate-limit, and entry keys do not collide when environments share a KV namespace.
- For local Cloudflare Functions testing, run `npx wrangler pages dev . --kv=LEADERBOARD --compatibility-date=2026-06-19` and open with `?remoteLb=1` to force the global API path.
- Optional custom remote clients can set `window.NS_LEADERBOARD_API` and, if needed, `window.NS_LEADERBOARD_SESSION_API`; otherwise the session endpoint is derived from the leaderboard endpoint.
- The server validates session token, play time, nickname/score bounds, submit limits, proof idempotency, rate limits, and ruleset version. Full cheat resistance would still require server-authoritative simulation or replay verification.

## 📄 License

[MIT](LICENSE) — free to modify, redistribute, and build on. Issues and PRs are welcome.

---

*made with [Claude](https://claude.com/claude-code)*
