# BossJobs

个人向多平台岗位情报台（Boss + 智联）——本地采集、CLI（人/AI）、Web 分析、公司背调。

## 文档

→ **[docs/README.md](./docs/README.md)**（需求与架构，文档先行）

## 快速开始

```bash
pnpm install
pnpm exec playwright install chrome
pnpm test:unit          # 单元 + 接口契约测试
pnpm test:api           # API mapper / URL 契约
# 真实浏览器冒烟（需先登录 Profile）:
# BOSSJOBS_LIVE=1 pnpm test:live

pnpm --filter @bossjobs/cli build
pnpm --filter @bossjobs/cli exec bossjobs --help
# 或: pnpm --filter @bossjobs/cli dev -- auth setup
```

探测真实接口：

```bash
pnpm --filter @bossjobs/adapters probe:boss 重庆 AI开发
pnpm --filter @bossjobs/adapters probe:zhilian 重庆 AI开发
```

## 技术栈

- 全 TypeScript + pnpm monorepo
- Playwright（Persistent Profile `bossjobs` / CDP）
- SQLite（`node:sqlite` → `~/.bossjobs/data.db`）
- CLI：`@bossjobs/cli`
