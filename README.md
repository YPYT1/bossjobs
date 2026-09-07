# BossJobs

个人向多平台岗位情报台（Boss + 智联）：**薄浏览器会话 + 官方接口**采集，本地 SQLite，CLI（人/AI），Next.js 分析，公司背调。

仓库：https://github.com/YPYT1/bossjobs

## 架构（Path C）

见 [docs/12-path-c-architecture.md](./docs/12-path-c-architecture.md)

1. 启动专用 Chrome Profile（`~/.bossjobs/browser-profile`）
2. 在页面上下文 `fetch` 官方搜索 API（带 Cookie / `Zp_token`）
3. 失败时降级 CDP 旁听
4. 写入本地库，CLI / Web 共用

## 快速开始

```bash
pnpm install
pnpm --filter @bossjobs/cli start -- --help

# 首次登录（专用浏览器）
pnpm --filter @bossjobs/cli start -- auth setup

# 采集
pnpm --filter @bossjobs/cli start -- collect --platform boss --city 重庆 --keyword AI开发 --pages 2 --detail --json

# 多关键词
pnpm --filter @bossjobs/cli start -- collect --platform zhilian --city 重庆 --keywords "AI开发,Agent" --pages 1 --json

# 分析 / 公司
pnpm --filter @bossjobs/cli start -- analyze salary --keyword AI --json
pnpm --filter @bossjobs/cli start -- company "腾讯科技" --json

# Web
pnpm --filter @bossjobs/web dev
# http://localhost:3456
```

Cookie 扩展：Chrome 加载 `packages/extension`（开发者模式）。

## 测试

```bash
pnpm test:unit
pnpm test:api
# BOSSJOBS_LIVE=1 pnpm test:live
```

## 文档

→ [docs/README.md](./docs/README.md)
