# 10 · 路线图与验收

## 阶段 0：文档先行（当前）

- [x] ADR 与 PRD
- [x] 逐条需求清单
- [x] 架构 / 数据模型 / CLI / 认证 / 适配器 / 背调 / Web
- [ ] **用户确认文档无异议** → 进入阶段 1

## 阶段 1：一期 MVP（文档确认后开发）

顺序建议：

1. Monorepo 脚手架（pnpm + packages）
2. `core`：SQLite schema + 仓储
3. `adapters`：BrowserManager + Boss（先）+ 智联
4. `cli`：auth / collect / jobs / analyze / company
5. Cookie 导入 + 扩展最小版
6. `apps/web`：jobs / analytics / settings
7. CompanyProvider 空实现 + 免费 API 接线

### 一期验收清单（对照需求）

- [ ] REQ-SCOPE-001 Boss+智联可采集
- [ ] REQ-COLLECT-003~009 核心字段入库
- [ ] REQ-AUTH-001 Profile bossjobs 可用
- [ ] REQ-AUTH-003 Cookie 粘贴可用
- [ ] REQ-CLI-001 CLI 可安装调用
- [ ] REQ-CLI-003 `--json` 可用
- [ ] REQ-WEB-003/004 分析可用
- [ ] REQ-CO-001/003 背调可插拔且可空跑

## 阶段 2：二期

- 鱼泡采集 Adapter
- MCP Server 包装 CLI
- 投递自动化（评估开源接入）
- 更丰富的分析与导出

## 变更流程

1. 改 `02-requirements.md` 状态与描述  
2. 必要时更新 ADR / 相关专项文档  
3. 再改代码  
