[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

# 🌟 NEON SURVIVOR - ブラウザ弾幕回避サバイバルシューティングゲーム

**NEON SURVIVOR** は、ネオンの怪物の嵐に閉じ込められた小さなパイロットが、ひたすら避けて強くなり続けるブラウザ弾幕サバイバルシューティングです。プレイヤーは移動と回避に集中し、武器は自動で攻撃します。レベルアップごとに、雷、ブラックホール、ドローン、地雷、レーザー、軌道攻撃、進化武器、仲間が組み合わさり、毎回違うビルドになります。

インストールもダウンロードもアカウントも不要です。PC でもモバイルでも、ページを開けばすぐに遊べます。現在の v1.1.4 Cloudflare ビルドには、グローバルランキング、24 種類の武器進化、10 分ごとに戻ってくる合体ボス、8 分後に解放される 0.5x 精密速度、スタック式ドロップ、無敵表示、後半の自動視認性補正、モバイル実行時の安定化、クラッシュ後の再開復元が含まれます。

## ▶️ オンラインでプレイ

今すぐプレイ: **https://neon-survivor.pages.dev/**

## 🕹️ どんなゲーム？

- **回避中心のアクション**: 攻撃は自動なので、ネオンの群れをすり抜ける移動に集中できます。
- **ローグライト風ビルド選択**: アップグレードカード、レシピ用パッシブ、進化コアで全武器を進化できます。
- **上がり続ける生存圧**: 6 分から敵の速度と密度が上がり、7〜8 分で圧力が強まり、10 分ごとに巨大な群体コア合体ボスが戻ってきます。
- **短時間で遊べる Web ゲーム**: 即リスタート、ローカル記録、任意のグローバルランキング、モバイル仮想ジョイスティック、1x/2x/3x 速度変更に対応しています。

## 🌐 言語

- 既定のプロジェクト README は英語版（`README.md`）です。
- ゲーム内言語はブラウザ/システム言語から自動検出され、不明な場合は英語にフォールバックします。
- ゲーム内対応言語: **English**, **한국어**, **简体中文**, **日本語**。
- 開始前のタイトル画面で言語ボタンから手動変更できます。
- UI テキスト、アップグレードカード、武器、パッシブ、仲間、イベント、記録、ランキング文言がローカライズされています。

## ▶️ ローカル実行

任意の静的サーバーで実行します。

```bash
python3 -m http.server
```

その後 `http://127.0.0.1:8000/` を開いてください。

公開デプロイ URL: **https://neon-survivor.pages.dev/**。ゲームクライアントは静的ホスティングで動作します。Cloudflare Pages ビルドでは任意機能のグローバルランキングを Pages Functions で提供します。

## 🎮 操作

| 入力 | 操作 |
|---|---|
| `WASD` / 矢印キー | 移動。攻撃は自動 |
| `P` / `ESC` | 一時停止 / 再開 |
| `M` | サウンド切り替え |
| `1` `2` `3` | レベルアップカードを選択。プレイ中は画面上の `1x`/`2x`/`3x` ボタンで速度変更 |
| モバイル | 画面下部をドラッグして仮想ジョイスティック操作 |

## ⚔️ 機能

- **現在のソースビルドでは 24 種類の武器**: Magic Bolt, Spinning Shuriken, Thunder Lightning, Flame Nova, Homing Missile, Prism Laser, Neon Boomerang, Frost Aura, Plasma Lance, Orbital Strike, Neon Shotgun, Drone Cannon, Black Hole Round, Chain Blade, Neon Arrow Rain, Shock Mine, Ricochet Disc, Time Rift, Railgun, Toxic Mist, Phoenix Feathers, Sonic Bomb, Ice Spear, Satellite Laser。
- **8 種類のパッシブ**: Power Core, Overclock, Neon Boots, Reinforced Heart, Magnet Gloves, Nano Regen, Lucky Charm, Rune of Wisdom。
- **5 分後のアンロック**: 武器/パッシブスロット拡張、武器進化、仲間、フィールドイベントが利用可能になります。
- **24 種類の武器進化**: すべての武器は、武器最大レベル、レシピ用パッシブの育成、Evolution Core の条件を満たすと進化できます。追加 16 種は新しい回復/シールド効果を入れず、ダメージ、群衆制御、ターゲット、移動圧を強化します。
- **エンドレス後半ループ**: 固定の勝利画面はなく、6 分から敵の速度と密度が上がり始め、7〜8 分で圧力が体感しやすくなります。10 分以降も難易度とボス圧力が上がり続け、10 分ごとに群体コアの合体ボスイベントが繰り返し発生します。
- **ネオンの仲間**: 6 種類の仲間ロールが参加し、後半では後列レゾナンスで強化できます。
- **フィールドイベント**: リフト、ストーム、コントラクト、サプライが、アンロック後に時間制限付きのリスク/報酬目標を追加します。
- **敵とプレッシャーシステム**: 基本敵 6 種、アンロック後の特殊敵 5 種、予定ボス 3 種、より脅威になった 10 分ごとの群体コア合体ボス、ランダム追加パターンを得るエンドレスボス、エリート、バナーなしで作動する停止対策ミサイル、危険ゾーンパターンがあります。後半の敵数は維持しつつ、大量の通常敵は低解像度バッチレイヤーで描画して、密集感を保ちながらカクつきを抑えます。
- **ドロップ、放置対策、速度変更、記録**: 維持時間が短くなった回復チキン、マグネット、爆弾、宝箱、通知過多を抑えるためのマグネット/停止プレッシャーバナー非表示、停止中の再生・シールド効率低下とシールド/無敵を貫通する停止ミサイル、タイトル画面のニックネーム入力/ランダム生成、プレイ中の 1x/2x/3x 速度変更、ローカル記録、任意のランキング送信に対応します。

## 🛠️ 技術メモ

現在のローカルビルドは `src/` 以下の責務別ブラウザモジュールに分割されており、`index.html` は DOM シェルと classic script のエントリーポイントです。

- **レンダリング**: Canvas 2D、事前レンダリングされたグロー sprite、additive blending、分割レンダーモジュール、敵グロースプライトの余白削減、敵数を減らさない後半大量敵用の再利用レイヤー。
- **オーディオ**: Web Audio API で効果音と音楽を合成し、グラフのライフサイクル、ミュート永続化、音楽シーケンス、SFX レシピを分離しています。
- **ゲームロジック**: ライフサイクル、ループ段階、ステータス、武器、投射物、進化、仲間、イベント、危険要素、アップグレード、戦闘、ルート、UI がモジュール化されています。
- **ローカライズ**: `src/i18n*.js` が言語検出、タイトル画面の言語ボタン、DOM テキスト更新、ゲーム内容のローカライズパッチを担当します。
- **ランキング**: 既定では localStorage。Cloudflare Pages Functions により `/api/session` と `/api/leaderboard` のグローバルランキングを有効化できます。

## ✅ ローカル検証

リポジトリ内チェックでは、構文、classic script ロード順、i18n 安全性、ランキング契約のずれ、ゲームプレイ結果、オーディオ挙動、API 境界を確認します。

```bash
npm run check:syntax
npm run verify
npx --yes wrangler pages functions build --outdir=/tmp/neon-survivor-functions-build
```

実行環境に Playwright がある場合はブラウザ smoke も実行できます。

```bash
NEON_ROOT=$PWD node scripts/smoke-browser.mjs
```

## 🏆 ランキングのデプロイメモ

- GitHub Pages などの静的ホストではグローバル記録検証ができないため、ゲームは**ローカル非公式ランキング**を使用します。
- Cloudflare Pages では `functions/api/session.js` と `functions/api/leaderboard.js` が GLOBAL ランキングフローを提供できます。
- Pages プロジェクトに `LEADERBOARD` という KV namespace をバインドし、再デプロイしてください。
- 複数環境が同じ KV namespace を共有する場合は、`prod`、`preview-$CF_PAGES_BRANCH`、`staging` などの `LEADERBOARD_PREFIX` を環境ごとに設定し、session、rate-limit、entry key の衝突を避けてください。
- ローカル Cloudflare Functions テストでは `npx wrangler pages dev . --kv=LEADERBOARD --compatibility-date=2026-06-19` を実行し、`?remoteLb=1` を付けてグローバル API パスを強制できます。
- カスタムリモートクライアントは `window.NS_LEADERBOARD_API` と、必要に応じて `window.NS_LEADERBOARD_SESSION_API` を設定できます。未設定の場合、セッションエンドポイントはランキングエンドポイントから推定されます。
- サーバーは session token、プレイ時間、ニックネーム/スコア範囲、送信制限、proof の冪等性、rate limit、ruleset バージョンを検証します。完全なチート耐性には、サーバー権威シミュレーションまたはリプレイ検証が別途必要です。

## 📄 ライセンス

[MIT](LICENSE) — 自由に変更、再配布、発展させることができます。Issue と PR を歓迎します。

---

*made with [Claude](https://claude.com/claude-code)*
