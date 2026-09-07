# 01 · 产品需求文档（PRD）

> 功能目标总览见 [VISION.md](./VISION.md)（只写要达成什么）。本文补充问题背景、方案与发布范围。

## 1. Summary

BossJobs 帮助求职者按「城市 + 关键词」批量采集 Boss 直聘、智联招聘的岗位与公司信息，存入本地数据库，并通过可安装 CLI（给人与 AI）和 Next.js Web 完成检索、城市/薪资分析、Excel 导出与公司背调。一期不做自动投递。

## 2. Contacts

| 角色 | 说明 |
|------|------|
| 产品/用户 | 项目所有者（个人求职场景） |
| 实现 | 本仓库开发 |

## 3. Background

手动在多个招聘站搜索「重庆 · AI 开发 / Agent」效率低，且难以对比薪资、福利、休息制度与公司风险。现有开源多为单平台脚本、油猴助手或投递自动化，缺少「统一采集 → 本地库 → CLI/AI → Web 分析 → 公司背调」的一体方案。

技术上，Boss 等站点的列表数据来自内部 JSON API（如明文薪资字段），适合用 Playwright + CDP 在真实登录态下旁听/复用接口，而不是纯 DOM 爬取。

## 4. Objective

- **目标：** 个人求职情报闭环——搜得快、存得清、析得明、背调可得、AI 可调。
- **成功标准（一期）：**
  1. 能对 Boss + 智联，按城市与关键词抓取并入库约定字段
  2. CLI 安装后可完成 auth / search / analyze / company
  3. Web 可浏览岗位并展示城市维度薪资分析
  4. 公司名可触发免费背调 Provider，有则展示、无则空
  5. 全部需求可在文档中追溯到 REQ-ID

## 5. Market Segment(s)

- 主要用户：需要对比多岗位、做城市薪资判断的个人求职者（尤其 AI/研发方向）
- 约束：单机本地使用；依赖用户自有招聘站账号会话

## 6. Value Proposition(s)

| 痛点 | 收益 |
|------|------|
| 手动搜索慢 | 关键词批量采集 |
| 信息散落 | 统一 Schema + 本地库 |
| 难做市场判断 | 城市 × 薪资等分析 |
| 不了解公司 | 工商/风险字段补全 |
| AI 用不了工具 | 可安装 CLI + JSON 输出 |

## 7. Solution

### 7.1 主流程

1. 用户启动/复用 `bossjobs` Chrome Profile，或导入 Cookie  
2. CLI 或 Web 发起：`平台 + 城市 + 关键词 (+ 页数)`  
3. Adapter 经 Playwright/CDP 获取列表与详情接口数据  
4. 规范化写入 SQLite  
5. Web/CLI 查询与分析；按需对公司名做 enrichment  
6. AI 通过 CLI 子命令完成同样操作  

### 7.2 关键能力（摘要）

详见 [02-requirements.md](./02-requirements.md)。

### 7.3 Technology

- TypeScript + pnpm monorepo  
- Playwright（CDP / Persistent Context）  
- SQLite  
- Next.js（Web）  
- 可选：Chrome 扩展导出 Cookie  

### 7.4 Assumptions

- 用户可在专用浏览器中登录招聘站，或提供有效 Cookie  
- 招聘站内部 API 路径可能变更，Adapter 需可配置/可更新  
- 免费公司 API 字段与额度有限，不保证社保人数等全部有值  
- 「双休/休息制度」依赖 JD 或平台字段解析，可能需启发式抽取  

## 8. Release

| 阶段 | 内容 |
|------|------|
| 文档阶段（当前） | 本目录全部文档确认 |
| 一期 MVP | Boss+智联采集、CLI、本地库、Web 基础分析、公司背调 Provider、Cookie 导入与扩展 |
| 二期 | 鱼泡采集、MCP、投递自动化对接开源、更多分析图表 |

相对时间：文档确认后开发一期；具体日历不在此锁定。
