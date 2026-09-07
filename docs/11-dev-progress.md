## 开发进度快照（2026-09-07）

### 已完成
- Monorepo 初始化（pnpm + TS）
- `@bossjobs/core`：类型、薪资/休息解析、SQLite JobStore
- `@bossjobs/adapters`：BrowserManager、Boss/智联 Adapter、城市码、API mapper
- `@bossjobs/cli`：auth / collect / jobs / db path
- 单元测试 + API 契约测试通过（17）

### 进行中 / 待做
- 真实浏览器 live 冒烟（需 Profile 登录）
- Cookie 导出扩展
- Next.js Web + 分析页
- 公司背调 Provider

### 命令
```bash
pnpm test:unit
pnpm test:api
pnpm --filter @bossjobs/cli start -- --help
pnpm --filter @bossjobs/adapters probe:boss 重庆 AI开发
# BOSSJOBS_LIVE=1 pnpm test:live
```
