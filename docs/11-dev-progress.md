## 开发进度快照（2026-09-07）

### 已完成（一期 Path C）
- Monorepo：`packages/core` · `adapters` · `cli` · `extension` · `apps/web`
- 薄浏览器会话 + 官方接口：Boss `joblist.json` / 详情；智联 `fe-api…/c/i/sou`
- CLI：`auth` / `collect`（多关键词）/ `jobs` / `analyze` / `company` / `config` / `db path`
- Cookie 导出扩展（Boss / 智联 / 鱼泡域名预留）
- Next.js Web：岗位 / 采集 / 分析 / 公司背调 / 设置
- 公司背调：`CNBizAPI` + `null` Provider
- 投递自动化：仅预留 `ApplyPort`（一期不实现）
- 单元测试 8 + API 契约 11 通过

### 使用前需本机完成
- `bossjobs auth setup` 登录求职者账号，或 Cookie 导入
- 公司背调填入 CNBizAPI Key（可选，无 Key 时走 null）

### 命令
```bash
pnpm test:unit
pnpm test:api
pnpm --filter @bossjobs/cli start -- --help
pnpm --filter @bossjobs/cli start -- auth setup
pnpm --filter @bossjobs/cli start -- collect --platform boss --city 重庆 --keyword AI开发 --pages 2 --detail --json
pnpm dev:web
# BOSSJOBS_LIVE=1 pnpm test:live
```
