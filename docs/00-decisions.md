# 00 · 决策记录（ADR）

本文档记录已锁定决策。变更需更新本文件，并同步修改相关需求文档。

---

## ADR-001：全栈 TypeScript，不用 Python（一期）

**状态：** 已确认  
**日期：** 2026-09-07

**决策：** 采集引擎、CLI、Web、共享库全部使用 TypeScript。一期不引入 Python。

**理由：**

- Playwright 官方支持 TypeScript，并提供：
  - `chromium.launchPersistentContext(userDataDir)` — 持久化 Profile（对应 `bossjobs`）
  - `chromium.connectOverCDP(endpoint)` — 连接已开启远程调试的 Chrome
  - `page.on('response')` / `waitForResponse` — 旁听页面内部 API
  - `page.context().newCDPSession(page)` — 需要时直接发 CDP 命令
- 与 Next.js / pnpm monorepo 统一语言，降低维护成本
- 可安装 npm/pnpm CLI，便于 AI 与人直接调用

**若遇阻塞：** 仅当 Playwright/CDP 路径在 Boss/智联上长期不可用时，再评估 Python 旁路，并新开 ADR。默认路径仍是 TS。

---

## ADR-002：本地 SQLite 作为唯一数据源

**状态：** 已确认

**决策：** 默认数据库路径 `~/.bossjobs/data.db`（Windows：`%USERPROFILE%\.bossjobs\data.db`）。Web、CLI、分析模块读写同一文件。实现使用 Node.js 内置 `node:sqlite`（DatabaseSync），避免原生模块编译问题。

**理由：** 单机场景零运维；CLI 与 Web 天然共享；便于备份与迁移。

---

## ADR-003：采数优先「内部接口」，CDP 复用真实浏览器会话

**状态：** 已确认

**决策：**

1. 不依赖 DOM 解析薪资（Boss 有字体反爬）
2. 通过 Playwright 导航真实搜索页，**旁听**页面发出的 JSON API，或在已登录上下文中请求同一接口
3. 专用 Chrome Profile 目录名/标识：**`bossjobs`**

**参考接口（Boss，实现时以实抓为准）：**  
`/wapi/zpgeek/search/joblist.json`（含明文 `salaryDesc`）

---

## ADR-004：认证双通道

**状态：** 已确认

**决策：**

| 优先级 | 方式 | 说明 |
|--------|------|------|
| P0 | CDP + 持久 Profile `bossjobs` | 最稳，推荐日常使用 |
| P0 | Cookie 文本粘贴导入 | 支持 CLI/Web 配置页导入 |
| P1 | 浏览器扩展导出 Cookie | 覆盖 Boss / 智联 / 鱼泡域名 |

「AI 免登录」含义：用户预先完成登录或导入 Cookie；AI 只调用 CLI，不交互登录。

---

## ADR-005：一期平台范围

**状态：** 已确认

- **一期完整实现：** Boss 直聘 + 智联招聘
- **一期仅 Cookie 导出预留：** 鱼泡直聘
- **一期不实现：** 自动投递 / 打招呼（模块可预留空壳）

---

## ADR-006：AI 入口形态

**状态：** 已确认

**决策：** 一期以 **可安装 CLI** 作为 AI 与人的统一入口（例如全局 `bossjobs` 命令）。CLI 输出结构化 JSON（`--json`），便于模型解析。

**后续可选：** 在 CLI 之上增加 MCP Server 包装（不阻塞一期）。

---

## ADR-007：公司背调用可插拔免费 API

**状态：** 已确认

**决策：** `CompanyProvider` 接口；默认优先免费额度源（如 CNBizAPI 约 200 次/月）。字段缺失时允许为空，不强行爬 gsxt。

---

## ADR-008：包管理与 Web 技术栈

**状态：** 已确认

- 包管理：**pnpm**
- Web：**Next.js 最新稳定版 + TypeScript**
- Monorepo：建议 `pnpm workspace`（`apps/web`、`packages/core`、`packages/cli`、`packages/extension` 等）

---

## ADR-009：文档先行

**状态：** 已确认

未在 `docs/02-requirements.md` 登记且状态为 `confirmed` 的需求，不得进入编码。需求变更先改文档，再改代码。
