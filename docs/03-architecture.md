# 03 · 架构设计

## 1. 总览

```
┌──────────────────────────────────────────────────────────┐
│ apps/web          Next.js UI：岗位 / 任务 / 分析 / 公司     │
└─────────────────────────────┬────────────────────────────┘
                              │ 读同一 SQLite；可选调 core API
┌─────────────────────────────┴────────────────────────────┐
│ packages/core     领域模型、DB、分析、CompanyProvider、采集编排 │
└───────┬─────────────────────────────┬────────────────────┘
        │                             │
┌───────┴────────┐          ┌─────────┴──────────┐
│ packages/cli   │          │ packages/adapters  │
│ bossjobs CLI   │          │ boss / zhilian     │
│ （人 + AI）     │          │ Playwright+CDP     │
└────────────────┘          └─────────┬──────────┘
                                      │
                            Chrome Profile「bossjobs」
                            或 Cookie 会话
┌─────────────────────────────────────┴────────────────────┐
│ packages/extension   Cookie 导出（Boss / 智联 / 鱼泡）       │
└──────────────────────────────────────────────────────────┘
```

## 2. 包职责

| 包 | 职责 |
|----|------|
| `packages/core` | SQLite、Schema 迁移、Job/Company/Task 仓储、分析纯函数、凭证存储抽象 |
| `packages/adapters` | 平台 Adapter 接口；BossAdapter、ZhilianAdapter；Playwright 浏览器管理 |
| `packages/cli` | `bossjobs` 可执行入口，调用 core + adapters |
| `apps/web` | Next.js；服务端读 DB / 调 core |
| `packages/extension` | MV3 扩展，导出 Cookie 文本 |

## 3. 采集数据流

```
CLI/Web 发起 CollectTask
    → BrowserManager 确保 Profile/CDP 可用
    → PlatformAdapter.search(city, keyword, pages)
        → 打开搜索页 / 监听 API 响应 / 解析为 RawJob
    → normalize(RawJob) → JobRecord
    → upsert SQLite
    → （可选）fetchDetail → 更新 JD/福利
    → （可选）enqueue company enrich
```

## 4. Adapter 接口（约定）

```ts
interface PlatformAdapter {
  readonly platform: 'boss' | 'zhilian';
  ensureAuth(): Promise<AuthStatus>;
  search(input: SearchInput): Promise<RawJobListItem[]>;
  fetchDetail(ref: JobRef): Promise<RawJobDetail>;
  resolveCityCode(cityName: string): Promise<string>;
}
```

投递预留（一期空实现）：

```ts
interface ApplyPort {
  apply(jobRef: JobRef, options?: ApplyOptions): Promise<never>; // 抛 NotImplemented
}
```

## 5. 浏览器管理

- **默认：** `launchPersistentContext(userDataDir)`，`userDataDir` 指向 `~/.bossjobs/browser-profile`（展示名/文档中称 Profile `bossjobs`）
- **备选：** 用户手动启动 Chrome `--remote-debugging-port=9222 --user-data-dir=...`，CLI `connectOverCDP`
- **Cookie 模式：** 将导入的 Cookie 写入 Context，或注入到持久 Profile（实现细节见 06）

## 6. 为何不用 Python（一期）

见 [ADR-001](./00-decisions.md)。Playwright TS 已覆盖 CDP 持久化与网络旁听；与 Next 同语言。

## 7. 配置与密钥

- 用户配置：`~/.bossjobs/config.json`
- 凭证：`~/.bossjobs/credentials/`（权限收紧）
- 公司 API Key：环境变量或 config（如 `CNBIZAPI_KEY`）
- 项目根 `.env` 仅用于本地 LLM 等可选能力，**不得**把招聘站 Cookie 提交进 Git
