# 09 · Web 与数据分析

对应：REQ-WEB-001 ~ REQ-WEB-006、REQ-TECH-003。

## 1. 技术

- Next.js 最新稳定版 + TypeScript + pnpm
- 数据访问：服务端通过 `@bossjobs/core` 读 SQLite（同机路径）
- UI：清晰的岗位情报台，不做营销落地页；图表用轻量库（如 Recharts）

## 2. 页面结构（一期）

| 路由 | 功能 |
|------|------|
| `/` | 概览：最近采集、岗位总数、快捷入口 |
| `/jobs` | 岗位列表：城市/平台/关键词/薪资筛选 |
| `/jobs/[id]` | 岗位详情：JD、福利、休息、公司链接 |
| `/tasks` | 采集任务：创建（城市+关键词+平台）、状态 |
| `/analytics` | 分析看板 |
| `/companies/[id]` 或按名 | 公司背调结果 |
| `/settings` | Cookie 粘贴导入、DB 路径只读展示、Provider Key |

## 3. 分析能力（一期必做）

### 3.1 岗位 × 城市（REQ-WEB-003）

- 过滤条件：关键词（匹配 `keyword` 或 title 含词）
- 输出：各 `city` 的岗位数量柱状图/表

### 3.2 城市 × 薪资（REQ-WEB-004）

- 基于 `salary_min` / `salary_max`（忽略 NULL）
- 按城市：样本量、中位数（或平均值）、常见区间
- CLI `bossjobs analyze salary` 输出同一套统计 JSON，Web 可视化

### 3.3 可选增强（有余力再做，需改需求状态）

- 福利词频、双休占比、公司重复发岗 Top N

## 4. Web 与采集

- Web「创建任务」调用 core 的 collect（需本机浏览器/会话可用）
- 若无头服务器环境无 Chrome，任务应明确失败并提示改用本机 CLI

## 5. 验收

- [ ] 列表能筛重庆 AI 相关已入库岗位
- [ ] 分析页在有数据时展示城市数量与薪资统计
- [ ] 设置页可保存 Cookie 文本
