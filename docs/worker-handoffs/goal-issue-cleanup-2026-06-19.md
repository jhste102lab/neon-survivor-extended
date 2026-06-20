# Worker Goal Handoff: modular split cleanup and issue implementation

Created: 2026-06-19 KST  
Project root: `/home/jasonjh/code/neon-survivor_jh`  
Detailed instruction document path: `/home/jasonjh/code/neon-survivor_jh/docs/worker-handoffs/goal-issue-cleanup-2026-06-19.md`

## 작업 배경

The local working tree was recently split from a large HTML/JS game into many classic browser scripts under `src/` plus Cloudflare Pages functions under `functions/api/**`. The split is uncommitted/untracked in places and may not yet match remote `main`.

Current local status observed before this document was written:

- `index.html` modified and now loads many `src/*.js` classic scripts.
- `src/` is untracked and contains the modular browser game scripts.
- `functions/` is untracked and contains Cloudflare Pages API modules.
- `README.md` is modified.
- Previous verification passed: JS syntax checks, script loader exactness checks, `wrangler pages functions build`, and Playwright smoke.

The user wants the remaining cleanup issues handled to completion, not stopped after partial passes. The working principle is: every class/module/function should have one clear responsibility, and fixes should address root causes rather than adding temporary patches.

## 작업 목표

Implement and verify the open cleanup/refactor/hardening issues created for this modular split, starting with the loader/runtime safety foundations and continuing through render/gameplay/i18n/leaderboard/API responsibility cleanup until no actionable issue in the agreed scope remains.

Primary issue set:

- Parent: <https://github.com/jhste102lab/neon-survivor_jh/issues/1>
- Work items: <https://github.com/jhste102lab/neon-survivor_jh/issues/2> through <https://github.com/jhste102lab/neon-survivor_jh/issues/29>

Do not treat issue count as a reason to do only a first pass. Work issue-by-issue or in dependency-safe batches, verify each completed slice, and continue while meaningful progress is possible.

## 관련 이슈

Recommended order:

1. #2 Add script-order and dependency verification for split classic scripts
2. #3 Make runtime and boot composition deterministic for tests
3. #4 Add attach-time dependency assertions for split facades and weapon handlers
4. #5 Split canvas lifecycle from render frame and layer orchestration
5. #6 Split combat rendering and share weapon visual geometry
6. #7 Make nova/effect rendering data-driven and split transient effect renderers
7. #8 Collapse enemy visual sequencing behind an enemy render model
8. #9 Make the game-loop phase schedule explicit and verifiable
9. #10 Recompute enemy proximity after movement and split movement/contact phases
10. #11 Extract director and pressure scheduling policies from spawn side effects
11. #12 Move field event type rules into an event definition registry
12. #13 Make BalanceSim runtime mutations exception-safe
13. #14 Split input vector state from browser DOM, game, and audio side effects
14. #15 Separate player projectile kinematics from effects, rewards, and feedback
15. #16 Separate loot entity updates from pickup/drop effects and presentation feedback
16. #17 Make combat resolution return outcomes before UI, audio, and reward side effects
17. #18 Make localized content fallback and source ownership deterministic
18. #19 Separate HTML-bearing i18n copy from plain text rendering
19. #20 Make upgrade kind contracts explicit across choices, descriptions, rewards, and applicators
20. #21 Replace bidirectional i18n self-install hooks with explicit composition
21. #22 Introduce an owned namespace registry for plugin-style globals
22. #23 Unify client and server leaderboard contract to prevent drift
23. #24 Fix remote leaderboard session endpoint configuration and stale proof races
24. #25 Harden the session API boundary and KV key namespace isolation
25. #26 Make leaderboard writes, rate limits, and session proofs race-safe
26. #27 Separate leaderboard UI rendering from record submission and persistence orchestration
27. #28 Split audio engine state, mute persistence, and sound-effect catalog responsibilities
28. #29 Extract initial run-state construction from game lifecycle transitions

If an issue is already solved by later local changes, verify that objectively, update this document's progress notes, and move to the next issue.

## 관련 파일 및 문서 경로

Project and handoff:

- `/home/jasonjh/code/neon-survivor_jh`
- `/home/jasonjh/code/neon-survivor_jh/docs/worker-handoffs/goal-issue-cleanup-2026-06-19.md`
- `/home/jasonjh/code/neon-survivor_jh/README.md`
- `{{확인 필요: 절대 경로}}` for any repo-local `AGENTS.md`; none was present in the root listing during this handoff, but user-provided repo instructions still apply.

Main browser app paths:

- `/home/jasonjh/code/neon-survivor_jh/index.html`
- `/home/jasonjh/code/neon-survivor_jh/src`
- `/home/jasonjh/code/neon-survivor_jh/src/main.js`
- `/home/jasonjh/code/neon-survivor_jh/src/runtime.js`
- `/home/jasonjh/code/neon-survivor_jh/src/game-lifecycle.js`
- `/home/jasonjh/code/neon-survivor_jh/src/game-loop.js`
- `/home/jasonjh/code/neon-survivor_jh/src/render-core.js`
- `/home/jasonjh/code/neon-survivor_jh/src/render-combat.js`
- `/home/jasonjh/code/neon-survivor_jh/src/render-effects.js`
- `/home/jasonjh/code/neon-survivor_jh/src/enemy-ai.js`
- `/home/jasonjh/code/neon-survivor_jh/src/director-spawn.js`
- `/home/jasonjh/code/neon-survivor_jh/src/events.js`
- `/home/jasonjh/code/neon-survivor_jh/src/balance-sim.js`
- `/home/jasonjh/code/neon-survivor_jh/src/input.js`
- `/home/jasonjh/code/neon-survivor_jh/src/player-bullets.js`
- `/home/jasonjh/code/neon-survivor_jh/src/loot.js`
- `/home/jasonjh/code/neon-survivor_jh/src/combat.js`
- `/home/jasonjh/code/neon-survivor_jh/src/i18n.js`
- `/home/jasonjh/code/neon-survivor_jh/src/i18n-dom.js`
- `/home/jasonjh/code/neon-survivor_jh/src/i18n-content-apply.js`
- `/home/jasonjh/code/neon-survivor_jh/src/upgrade-choices.js`
- `/home/jasonjh/code/neon-survivor_jh/src/upgrade-descriptions.js`
- `/home/jasonjh/code/neon-survivor_jh/src/leaderboard.js`
- `/home/jasonjh/code/neon-survivor_jh/src/leaderboard-remote.js`
- `/home/jasonjh/code/neon-survivor_jh/src/ui-leaderboard.js`
- `/home/jasonjh/code/neon-survivor_jh/src/audio-fx.js`

Cloudflare/API paths:

- `/home/jasonjh/code/neon-survivor_jh/functions`
- `/home/jasonjh/code/neon-survivor_jh/functions/api/session.js`
- `/home/jasonjh/code/neon-survivor_jh/functions/api/leaderboard.js`
- `/home/jasonjh/code/neon-survivor_jh/functions/api/leaderboard`

Suggested new local verification/doc paths, if needed:

- `/home/jasonjh/code/neon-survivor_jh/scripts/verify-script-order.mjs`
- `/home/jasonjh/code/neon-survivor_jh/scripts` if a scripts directory is created
- `/home/jasonjh/code/neon-survivor_jh/docs` for additional implementation notes

## 확인된 문제와 근본 원인

High-level root causes:

- The code was physically split into many files, but many responsibility seams are still implicit classic-script globals.
- Dependency order is encoded manually in `index.html`, not verified by tooling.
- Several facades delegate to helpers without fail-fast dependency assertions.
- Runtime side effects such as DOM, audio, storage, network, and UI feedback still leak into game logic and simulation paths.
- Some correctness bugs are tied to responsibility mixing, e.g. stale enemy distance after movement and unsafe simulation cleanup.
- Client/server leaderboard contracts and Cloudflare KV/session behavior have drift/race risks.
- i18n content mutation and HTML rendering have hidden ownership and safety assumptions.

Do not assume a subagent finding is proof. Re-inspect the specific path before changing it. Mark findings as `not checked` unless inspected locally.

## 필요한 수정사항

Implement the issue acceptance criteria from #2-#29, preserving current player-visible behavior unless an issue explicitly requires a bug fix. Prefer small, reversible, dependency-safe slices, but do not artificially split work into “first implementation” and “second implementation.” For each issue or batch:

- inspect the relevant files and confirm the failure mode;
- implement the root-cause fix;
- update/extend verification scripts or smoke tests where practical;
- run relevant checks;
- record results in this document;
- continue to the next actionable item while progress is possible.

## 구현 계획

Suggested sequence:

1. Establish verification foundations (#2).
2. Make runtime/boot and facades deterministic (#3, #4).
3. Add or adjust test/smoke harnesses that benefit from deterministic boot.
4. Refactor render seams (#5-#8).
5. Refactor game-loop/gameplay outcome seams (#9-#17, #29).
6. Refactor i18n/upgrade contract seams (#18-#21).
7. Refactor namespace/global ownership (#22).
8. Harden leaderboard/API/client-server contract (#23-#27).
9. Split audio responsibilities (#28).
10. Re-run the full verification suite and update issue status/progress notes.

Dependency guidance is advisory, not a reason to stop. If a later issue is safer to complete earlier based on actual code evidence, do so and record why.

## 유지보수성 고려사항

- Keep modules deep enough to earn their interface; avoid pass-through files that only rename a call.
- Prefer explicit registries, manifests, and validation over hidden `globalThis` conventions.
- Add fail-fast checks at facade/boot seams, not late first-frame crashes.
- Keep domain logic testable without DOM/audio/network where reasonable.
- Do not introduce a bundler/framework migration unless separately approved.
- Preserve existing global dev hooks unless replacing them with backward-compatible aliases.

## 확장성 고려사항

- Adding a weapon, aura, render layer, event type, upgrade kind, or leaderboard field should have one obvious registration/contract point.
- Duplicate registration should fail clearly.
- Future Cloudflare preview/staging/prod deployments should not share ambiguous KV key namespaces.
- Client/server leaderboard changes should fail a contract test before reaching production.

## 페이지 속도 및 로딩 성능 고려사항

- The current app uses many classic scripts. Verification should make this safe, but additional files can increase request overhead.
- Avoid adding heavy runtime dependencies or network calls on startup.
- Keep boot-time assertions linear and cheap; they should validate names/order, not run gameplay simulations.
- Preserve existing static-hosting compatibility.
- If a change materially increases script count or boot work, document the tradeoff and consider grouping only where it does not reintroduce mixed responsibilities.

## 검증 방법

Minimum checks after relevant changes:

```bash
cd /home/jasonjh/code/neon-survivor_jh
find src functions -name '*.js' -type f -print0 | xargs -0 -n1 node --check
npx --yes wrangler pages functions build --outdir=/tmp/neon-survivor-functions-build
```

After #2 exists, also run the script-order/dependency verification command, for example:

```bash
node /home/jasonjh/code/neon-survivor_jh/scripts/verify-script-order.mjs
```

Browser smoke should verify at least:

- title screen renders;
- game starts;
- player has HP and starter weapon;
- level-up cards render and can be selected;
- no page console errors;
- BalanceSim still runs a short simulation;
- leaderboard/session paths still fall back gracefully when remote is unavailable.

Use Playwright or an existing smoke script if present. If no smoke script exists, create a small deterministic script and document its path.

For Cloudflare/API changes, add targeted tests or local fakes for request parsing, CORS, contract drift, session proof race/idempotency, and storage race behavior where practical.

## 검증 결과 기록 방식

Append entries here as work progresses:

| Date/KST | Issue(s) | Changed paths | Commands/checks run | Result | Notes/risks |
|---|---:|---|---|---|---|
| 2026-06-19 | handoff | `/home/jasonjh/code/neon-survivor_jh/docs/worker-handoffs/goal-issue-cleanup-2026-06-19.md` | document creation only | pending implementation | New worker must run fresh checks after edits. |

Do not mark an issue complete from intent alone. Record concrete evidence: files inspected, commands run, smoke output, or tests.

## 최종 보고 형식

Final report should be concise and include:

- implemented issue numbers and short summary;
- root causes confirmed;
- changed files;
- verification commands and results;
- path to this Markdown document;
- any issues intentionally left open with reason;
- remaining risks separated into `not found`, `not checked`, and `blocked`.

Do not claim “complete” if checks were skipped without explaining why.

## 중단 조건과 막힘 발생 시 보고 방식

Do not stop just because the issue set is long. Continue while there is a safe, evidence-backed next action.

Stop and report only when one of these is true:

- repository state required by #1 is unavailable and cannot be reconstructed from local files;
- tests/builds fail due to an external service/tool outage after reasonable local fallback attempts;
- a required product/deployment decision is genuinely ambiguous, such as choosing Durable Objects vs D1 for a strong race-safe leaderboard implementation;
- changes would require a scope expansion explicitly excluded by the issues, such as migrating to a bundler/framework;
- another worker has conflicting in-progress edits in the same files and coordination is required;
- there is a possible data-loss/security regression that cannot be safely resolved without user input;
- 자체 해소가 불가능한 경우.

When blocked, report:

- issue number(s);
- exact blocker;
- evidence inspected;
- attempted paths;
- smallest user decision/input needed;
- safe next step once unblocked.

## 동시 작업 및 서브에이전트 기준

Assume multiple workers and sessions may be active.

- Focus on your assigned scope and avoid unrelated rewrites.
- Before editing, check `git status --short` and inspect the files you plan to touch.
- Do not revert or overwrite changes you did not make unless the user explicitly authorizes it.
- Use subagents only when a task is genuinely parallel, non-trivial, and has a disjoint ownership area.
- Do not spawn subagents for simple checks, small edits, or immediately inspectable questions.
- If using subagents, give each a concrete scope, wait long enough for useful output, then inspect the code yourself before applying or accepting results.

## Objective stance

Maintain the repo instruction supplied by the user:

- Do not unilaterally agree with assumptions.
- Do not answer or implement based on unsupported guesses.
- When uncertain, verify from code, docs, logs, tests, or ask only when a reasonable safe assumption is not possible.

## Progress update — 2026-06-19 KST worker implementation

### Implemented in this slice

- #2: Added `scripts/verify-script-order.mjs` and documented local verification commands. The check validates script existence, uniqueness, dependency order, runtime/bootstrap position, facade helpers, i18n composition, leaderboard contract, event registry, audio mute adapter, and final `main.js` boot.
- #3: Moved `runtime.js` to the early loader foundation, removed the `Game`-binding default from `GameRuntime.isHeadless()`, exposed `window.NS_BOOT`, and gated auto-boot with `window.NS_NO_AUTO_BOOT`.
- #4/#22: Added `src/namespace.js` with an owned weapon-fire registry, migrated weapon fire handlers to duplicate-checked registration, added boot/facade assertions for weapon-fire, weapon-aura, render-world, HUD, player bullet, combat, and loop helpers.
- #5/#8: Added `src/render-canvas.js` for canvas lifecycle/render context, passed an explicit frame context into enemy rendering, and introduced an enemy render model plus role telegraph dispatch table.
- #6/#7: Shared orbit/drone visual geometry with gameplay helpers and replaced delayed-nova source-string checks with explicit telegraph flags/dispatch.
- #9/#10/#11/#12/#29: Added `src/game-loop-phases.js`, fixed enemy contact/teleport checks to use post-movement distance, switched late pressure selection to a registry table, added `src/event-definitions.js`, and moved fresh run-state defaults to `src/run-state.js`.
- #13/#14/#15/#17: Made `BalanceSim.run()` use scoped `try/finally` restore for RNG/test/audio/input state, split pure input vector state into `src/input-vector.js`, made boomerang return movement emit outcomes before applying heal/barrier effects, and added structured combat damage outcome construction plus earlier reward-helper assertion.
- #18/#19/#20/#21: Moved overlevel copy to `src/overdrive-content.js`, made i18n content apply fallback-first from captured base state, rendered `[data-i18n]` via text by default with explicit HTML allowlist for known HTML-bearing keys, and replaced bidirectional i18n self-install hooks with `I18N.configure()`.
- #23/#24/#25/#26/#27: Added client leaderboard contract verification, derived session endpoint from custom leaderboard API config, guarded stale session responses, waited briefly for session proof before remote submit, reused API helpers in `/api/session`, added body-size JSON parsing, env-prefixed KV keys, per-attempt rate keys, per-run entry keys, session proof idempotency checks, and `src/leaderboard-controller.js` to separate submission orchestration from leaderboard DOM rendering.
- #28: Split mute persistence/button presentation into `src/audio-mute.js` and routed `AudioFX.setMuted()` through that seam.

### Verification results

| Date/KST | Issue(s) | Changed paths | Commands/checks run | Result | Notes/risks |
|---|---:|---|---|---|---|
| 2026-06-19 | #2-#29 slice | `index.html`, `README.md`, `src/**`, `functions/api/**`, `scripts/**`, this doc | `find src functions -name '*.js' -type f -print0 \| xargs -0 -n1 node --check` | pass | JS syntax passed for browser and Cloudflare files. |
| 2026-06-19 | #2/#3/#4/#22 | `index.html`, `scripts/verify-script-order.mjs`, loader/facade files | `node scripts/verify-script-order.mjs` | pass | 230 classic scripts verified for existence, uniqueness, and dependency order. |
| 2026-06-19 | #18/#19/#20/#21/#23 | `src/i18n*`, `src/leaderboard*`, `functions/api/leaderboard/config.js`, `scripts/*contract*` | `node scripts/verify-i18n-contract.mjs`; `node scripts/verify-leaderboard-contract.mjs` | pass | HTML-bearing copy and leaderboard ruleset/win-time drift checks passed. |
| 2026-06-19 | #24/#25/#26 | `functions/api/**`, `scripts/test-api-boundary.mjs` | `node scripts/test-api-boundary.mjs` | pass | Covers invalid JSON, oversized body without trusting content-length, env-prefixed session/entry keys, changed proof retry rejection, and session rate limiting with fake KV. |
| 2026-06-19 | API build | `functions/api/**` | `npx --yes wrangler pages functions build --outdir=/tmp/neon-survivor-functions-build` | pass | Wrangler 4.103.0 compiled Worker successfully. |
| 2026-06-19 | browser smoke / #13 | `index.html`, `src/**`, `scripts/smoke-browser.mjs` | Temp Playwright install, then `NEON_ROOT=/home/jasonjh/code/neon-survivor_jh node smoke-browser.mjs` | pass | Title renders, Start enters play, level-up cards render, BalanceSim cleanup leaves test flags restored. MCP browser failed due environment X/headless issue; temp Playwright headless path used instead. |

### Remaining risks / follow-up candidates

- `not checked`: Manual visual parity for every weapon/effect/event on a real device was not exhaustively checked; the smoke verifies boot/start/cards/sim cleanup only.
- `residual risk`: #15/#16/#17 outcome separation is improved for boomerang movement and combat damage, but projectile collision, loot collection, and reward feedback still contain mixed side effects in existing files. They are safer than the baseline but not a fully pure outcome pipeline.
- `residual risk`: #26 uses KV per-run entries, env-prefixed keys, per-attempt rate keys, and proof idempotency. Cloudflare KV still is not a strongly atomic primitive; exact concurrent rate-limit enforcement would require Durable Objects, D1, or another atomic coordinator if the product requires strict guarantees under simultaneous writes.
- `residual risk`: #28 only split mute persistence/button presentation and exposed music graph information. Full Web Audio graph/SFX catalog extraction remains larger follow-up work if strict one-file-per-audio-responsibility is required.
- `not found`: No syntax, script-order, i18n contract, leaderboard contract, fake API boundary, Wrangler build, or headless browser-smoke failures remain after this slice.

## Progress update — 2026-06-20 KST outcome/API/audio closure

This update supersedes the earlier residual notes for #15/#16/#17/#28. It also narrows #26 to the strongest KV-only implementation available in this codebase without introducing a new atomic platform primitive.

### Implemented in this slice

- #15: Added `src/player-bullet-outcomes.js`; projectile movement/collision now returns explicit outcome data for boomerang return healing/barrier, missile trails, mine/missile/blast explosions, slow/damage/feedback/heal, hit memory, and pierce consumption before the facade applies side effects.
- #16: Added `src/loot-outcomes.js`; gem merge/collection, drop pickup, expiry, and trim effects are now applied through an explicit loot outcome seam, including separate `dropsExpired` and `dropsTrimmed` metrics.
- #17: Extended `src/combat-kills.js` so enemy kill resolution can build a kill outcome before applying removal, kill metrics, combo, HUD/audio/burst feedback, and death rewards.
- #26: Reworked KV-safe leaderboard behavior: per-run entries remain aggregated by prefix, exact retry is idempotently accepted, changed retry with the same proof is rejected, sessions are marked submitted before the entry write to reduce divergence windows, existing entry fingerprint conflicts fail publicly, and rate-limit attempts are stored as ranked per-attempt keys instead of one shared counter.
- #28: Added `src/audio-engine.js` for Web Audio graph/context lifecycle and `src/audio-sfx-catalog.js` for named SFX recipes; `AudioFX` remains the public facade for existing callers, mute remains routed through `AudioMuteState`, and `Music` now receives an explicit graph object instead of the `AudioFX` facade.
- Verification/documentation: Added `scripts/test-gameplay-outcomes.mjs` and `scripts/test-audio-contract.mjs`; updated `README.md` verification commands and audio architecture notes; updated script-order verification for the new loader entries; added a minimal root `package.json` with `type: module` so Node syntax checks parse Cloudflare Pages function ESM files correctly.

### Verification results

| Date/KST | Issue(s) | Changed paths | Commands/checks run | Result | Notes/risks |
|---|---:|---|---|---|---|
| 2026-06-20 | #15/#16/#17/#26/#28 plus regression | `src/**`, `functions/api/**`, `scripts/**` | `find src functions -name '*.js' -type f -print0 \| xargs -0 -n1 node --check` | pass | JS syntax passed for browser and Cloudflare files after the new outcome/audio/API changes. |
| 2026-06-20 | #2/#4/#15/#16/#28 loader safety | `index.html`, `scripts/verify-script-order.mjs` | `node scripts/verify-script-order.mjs` | pass | 234 classic scripts verified for existence, uniqueness, dependency order, and final `main.js` boot. |
| 2026-06-20 | #18/#19/#20/#21 | `src/i18n*`, `scripts/verify-i18n-contract.mjs` | `node scripts/verify-i18n-contract.mjs` | pass | HTML-bearing i18n allowlist and locale key parity passed. |
| 2026-06-20 | #23/#24/#25/#26 | `src/leaderboard*`, `functions/api/leaderboard/**` | `node scripts/verify-leaderboard-contract.mjs`; `node scripts/test-api-boundary.mjs` | pass | Ruleset/win-time drift, invalid JSON, oversized body, env-prefixed keys, exact retry acceptance, changed retry rejection, distinct concurrent run retention, and delayed fake-KV rate-limit excess rejection covered. |
| 2026-06-20 | #15/#16/#17 | `src/player-bullet-*`, `src/loot-*`, `src/combat-kills.js` | `node scripts/test-gameplay-outcomes.mjs` | pass | VM tests prove projectile movement/collision, loot, and combat builders do not apply side effects before explicit outcome application. |
| 2026-06-20 | #28 | `src/audio-*`, `src/music.js` | `node scripts/test-audio-contract.mjs` | pass | Fake Web Audio test proves graph creation, explicit music graph, SFX catalog delegation, and mute persistence/button behavior. |
| 2026-06-20 | Cloudflare API build | `functions/api/**` | `npx --yes wrangler pages functions build --outdir=/tmp/neon-survivor-functions-build` | pass | Wrangler 4.103.0 compiled Worker successfully. |
| 2026-06-20 | Browser smoke / full loader | `index.html`, `src/**`, `scripts/smoke-browser.mjs` | Temporary Playwright package in `/tmp/neon-survivor-playwright-smoke`; `NEON_ROOT=/home/jasonjh/code/neon-survivor_jh node /tmp/neon-survivor-playwright-smoke/smoke-browser.mjs` | pass | Title renders, Start enters play, level-up cards render, no page console errors, BalanceSim cleanup leaves flags restored. Repo itself was not modified for Playwright installation. |

### Current remaining risks / verification boundaries

- `residual risk`: #26 is now KV-safe for the documented local fake/delayed-KV cases, but Cloudflare KV still does not provide a true compare-and-swap/transaction primitive. A strict guarantee that `RATE_LIMIT_PER_MINUTE + 1` simultaneous requests always rejects exactly the excess, and that submit-state/entry-write can never diverge under arbitrary edge races, would require an atomic coordinator such as Durable Objects or D1. This is a platform decision rather than a local refactor gap.
- `not checked`: Exhaustive manual visual parity for every weapon/effect/event on physical mobile hardware was not checked. Browser smoke covers boot, start, level-up UI, no console errors, and BalanceSim cleanup.
- `not found`: No syntax, loader-order, i18n contract, leaderboard contract, gameplay outcome, audio contract, fake API boundary, Wrangler build, or headless browser-smoke failures remain after this slice.
