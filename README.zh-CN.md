[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

# 🌟 霓虹幸存者

**NEON SURVIVOR** 是一款浏览器生存动作游戏：在无尽涌来的霓虹怪潮中尽可能活得更久。移动、闪避、收集宝石，并在升级时选择卡牌构筑流派；武器会自动攻击。

无需安装 · 支持 PC/移动端 · Vanilla JavaScript + Canvas 2D · 无图片/音频资源文件

## 🌐 语言

- 默认项目 README 是英文版（`README.md`）。
- 游戏语言会根据浏览器/系统语言自动检测，无法识别时回退到英语。
- 游戏内支持语言：**English**、**한국어**、**简体中文**、**日本語**。
- 开始前可在标题画面通过语言按钮手动切换。
- UI 文案、升级卡、武器、被动、伙伴、事件、记录和排行榜文本均已本地化。

## ▶️ 本地运行

用任意静态服务器运行：

```bash
python3 -m http.server
```

然后打开 `http://127.0.0.1:8000/`。

当前仓库中没有已验证的公开游玩 URL 部署配置。游戏客户端可在静态托管上运行；Cloudflare Pages Functions 仅用于可选的全球排行榜。

## 🎮 操作

| 输入 | 动作 |
|---|---|
| `WASD` / 方向键 | 移动；攻击自动进行 |
| `P` / `ESC` | 暂停 / 继续 |
| `M` | 开关声音 |
| `1` `2` `3` | 选择升级卡；游玩中可用屏幕上的 `1x`/`2x`/`3x` 按钮调整倍速 |
| 移动端 | 拖动屏幕下半部分使用虚拟摇杆 |

## ⚔️ 功能

- **当前源码构建包含 24 种武器**：Magic Bolt、Spinning Shuriken、Thunder Lightning、Flame Nova、Homing Missile、Prism Laser、Neon Boomerang、Frost Aura、Plasma Lance、Orbital Strike、Neon Shotgun、Drone Cannon、Black Hole Round、Chain Blade、Neon Arrow Rain、Shock Mine、Ricochet Disc、Time Rift、Railgun、Toxic Mist、Phoenix Feathers、Sonic Bomb、Ice Spear、Satellite Laser。
- **8 种被动**：Power Core、Overclock、Neon Boots、Reinforced Heart、Magnet Gloves、Nano Regen、Lucky Charm、Rune of Wisdom。
- **5 分钟后解锁**：武器/被动槽扩展、武器进化、伙伴和场地事件。
- **24 种武器进化**：所有武器在满级、配方被动达到要求且拥有 Evolution Core 时都可进化。新增 16 种进化不加入新的治疗或护盾效果，重点强化伤害、控场、锁定和移动压迫。
- **无尽后期循环**：没有固定胜利画面；敌人速度和密度从 6 分钟开始提升，7–8 分钟会明显感到压力。10 分钟后难度和 Boss 压力继续提升，并且每 10 分钟会反复出现集群核心合体 Boss 事件。
- **霓虹伙伴**：6 种伙伴角色可加入，并可在后期获得后排共鸣。
- **场地事件**：裂隙、风暴、契约和补给事件在解锁后提供限时风险/奖励目标。
- **敌人与压力系统**：6 种基础敌人、5 种解锁后的特殊敌人、3 个预定 Boss、更具威胁的 10 分钟循环集群核心合体 Boss、会获得随机追加模式的无尽 Boss、精英敌人、无提示横幅的静止压力导弹和危险区域模式。后期敌人数保持不变，但大量普通怪会通过低分辨率批量图层渲染，让画面仍显得拥挤同时减少卡顿。
- **掉落、防挂机、倍速与记录**：持续时间更短的鸡腿治疗、磁铁、炸弹和宝箱；磁铁与静止压力横幅已隐藏以减少提示干扰；静止时生命恢复和护盾续航会降低，静止导弹可穿透护盾/无敌；标题画面昵称输入/随机生成；游玩中 1x/2x/3x 倍速；本地记录和可选排行榜提交。

## 🛠️ 技术说明

当前本地构建已拆分为 `src/` 下按职责划分的浏览器模块，`index.html` 保留为 DOM 外壳和 classic script 入口。

- **渲染**：Canvas 2D、预渲染发光精灵、additive blending、拆分渲染模块、缩小的敌人发光精灵边界，以及不减少敌人数的后期大群怪复用图层。
- **音频**：使用 Web Audio API 合成音效和音乐，并拆分图生命周期、静音持久化、音乐编排和命名 SFX 配方。
- **游戏逻辑**：生命周期、循环阶段、属性、武器、弹体、进化、伙伴、事件、危险区域、升级、战斗、掉落和 UI 均按模块拆分。
- **本地化**：`src/i18n*.js` 负责语言检测、标题画面语言按钮、DOM 文案更新和游戏内容本地化补丁。
- **排行榜**：默认使用 localStorage；Cloudflare Pages Functions 可启用 `/api/session` 和 `/api/leaderboard` 全球排行榜。

## ✅ 本地验证

仓库内检查覆盖语法、classic script 加载顺序、i18n 安全性、排行榜契约漂移、游戏结果、音频行为和 API 边界：

```bash
npm run check:syntax
npm run verify
npx --yes wrangler pages functions build --outdir=/tmp/neon-survivor-functions-build
```

如果运行环境中有 Playwright，也可以执行浏览器 smoke 测试：

```bash
NEON_ROOT=$PWD node scripts/smoke-browser.mjs
```

## 🏆 排行榜部署说明

- 在 GitHub Pages 等静态托管上无法进行全球记录校验，因此游戏会使用**本地非官方排行榜**。
- 在 Cloudflare Pages 上，`functions/api/session.js` 和 `functions/api/leaderboard.js` 可提供 GLOBAL 排行榜流程。
- 在 Pages 项目中绑定名为 `LEADERBOARD` 的 KV namespace 并重新部署。
- 若多个环境共享同一个 KV namespace，请为每个环境设置 `LEADERBOARD_PREFIX`，例如 `prod`、`preview-$CF_PAGES_BRANCH` 或 `staging`，避免 session、rate-limit 和记录 key 冲突。
- 本地测试 Cloudflare Functions 时运行 `npx wrangler pages dev . --kv=LEADERBOARD --compatibility-date=2026-06-19`，并加上 `?remoteLb=1` 强制使用全球 API 路径。
- 自定义远程客户端可设置 `window.NS_LEADERBOARD_API`，必要时也可设置 `window.NS_LEADERBOARD_SESSION_API`；否则会从排行榜端点推导 session 端点。
- 服务器会验证 session token、游玩时间、昵称/分数范围、提交限制、proof 幂等性、rate limit 和 ruleset 版本。完整反作弊仍需要服务端权威模拟或回放验证。

## 📄 许可证

[MIT](LICENSE) — 可自由修改、再分发和构建。欢迎提交 issue 和 PR。

---

*made with [Claude](https://claude.com/claude-code)*
