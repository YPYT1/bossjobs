# BossJobs 文档中心

> **原则：文档先行。未写入本文档体系并标记为「已确认」的需求，不得进入开发。**

BossJobs 是个人向的多平台岗位情报台：按关键词 + 城市从招聘站采集结构化岗位数据，本地存储，提供 CLI（给人与 AI）、Web 分析界面，以及公司背调能力。

## 文档索引

| 编号 | 文档 | 说明 |
|------|------|------|
| 00 | [决策记录（ADR）](./00-decisions.md) | 已锁定的技术与产品决策 |
| 01 | [产品需求 PRD](./01-prd.md) | 问题、目标、方案、发布范围 |
| 02 | [需求清单](./02-requirements.md) | **逐条需求**，开发必须对照落实 |
| 03 | [架构设计](./03-architecture.md) | 模块划分、数据流、包结构 |
| 04 | [数据模型](./04-data-model.md) | SQLite Schema、统一 Job 字段 |
| 05 | [CLI 与 AI 工具](./05-cli-ai.md) | 可安装 CLI、命令、给 AI 的调用约定 |
| 06 | [认证与 Cookie](./06-auth-cookie.md) | Profile `bossjobs`、Cookie 导入、导出扩展 |
| 07 | [采集适配器](./07-adapters.md) | Boss / 智联接口抓取策略 |
| 08 | [公司背调](./08-company-enrichment.md) | 免费 API Provider 设计 |
| 09 | [Web 与数据分析](./09-web-analytics.md) | Next.js 页面与分析能力 |
| 10 | [路线图](./10-roadmap.md) | 一期 / 二期边界与验收 |
| 11 | [开发进度](./11-dev-progress.md) | 实现进度快照 |
| 12 | [Path C 架构](./12-path-c-architecture.md) | 薄浏览器 + 官方接口 |
| 附录 | [TS + Playwright 可行性](./appendix-ts-playwright.md) | 为何一期可全 TS |

## 文档状态约定

每条需求在 [02-requirements.md](./02-requirements.md) 中有唯一 ID（如 `REQ-COLLECT-001`），状态为：

- `confirmed` — 已确认，可开发
- `proposed` — 提案中，需用户拍板
- `deferred` — 明确延期
- `rejected` — 不做

**开发任务必须引用需求 ID。** 实现完成后在需求表更新「实现状态」。

## 当前总状态

- 技术栈：**全 TypeScript**（采集用 Playwright/CDP，不默认引入 Python）
- 一期平台：Boss 直聘 + 智联招聘
- 本地库：SQLite
- AI 入口：可安装 CLI（优先），后续可再包一层 MCP
- 开发状态：**脚手架 + 采集适配器 + CLI + 单元/API 契约测试已就绪；Web/扩展/live 冒烟进行中**
