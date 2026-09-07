# 02 · 需求清单（逐条落实）

> 开发必须以本表为准。状态含义见 [README](./README.md)。  
> **实现状态：** `todo` | `doing` | `done` | `n/a`

最后确认日期：2026-09-07 · 实现更新：2026-09-07（Path C）

---

## A. 产品范围

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-SCOPE-001 | 一期完整支持 Boss 直聘 + 智联招聘采集 | confirmed | done |
| REQ-SCOPE-002 | 鱼泡一期仅 Cookie 导出扩展域名预留，不做采集 | confirmed | done |
| REQ-SCOPE-003 | 自动投递/打招呼一期不实现，仅预留模块接口 | confirmed | done |
| REQ-SCOPE-004 | 数据仅存本地，不默认做多用户云端 SaaS | confirmed | done |

---

## B. 采集能力

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-COLLECT-001 | 支持按「关键词」搜索岗位（可多关键词任务） | confirmed | done |
| REQ-COLLECT-002 | 支持指定城市（中文名，内部映射平台城市码） | confirmed | done |
| REQ-COLLECT-003 | 采集字段：岗位名称 | confirmed | done |
| REQ-COLLECT-004 | 采集字段：工作地点/位置 | confirmed | done |
| REQ-COLLECT-005 | 采集字段：薪资区间（明文，不依赖字体 DOM） | confirmed | done |
| REQ-COLLECT-006 | 采集字段：福利待遇 | confirmed | done |
| REQ-COLLECT-007 | 采集字段：是否双休 / 休息制度（接口有则取；否则从 JD 启发式解析，可空） | confirmed | done |
| REQ-COLLECT-008 | 采集字段：岗位 JD 全文 | confirmed | done |
| REQ-COLLECT-009 | 采集字段：公司名称 | confirmed | done |
| REQ-COLLECT-010 | 记录来源平台、原始 job id、抓取时间、原始 JSON（或摘要） | confirmed | done |
| REQ-COLLECT-011 | 采数优先内部 API（页面内 fetch / CDP 旁听） | confirmed | done |
| REQ-COLLECT-012 | 同一岗位按「平台 + 平台侧 job_id」去重 upsert | confirmed | done |
| REQ-COLLECT-013 | 支持分页/页数上限配置，带请求间隔 | confirmed | done |
| REQ-COLLECT-014 | 列表与详情可分步 | confirmed | done |

---

## C. 认证与浏览器

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-AUTH-001 | 专用浏览器 Profile `bossjobs` | confirmed | done |
| REQ-AUTH-002 | Playwright Persistent Context / CDP | confirmed | done |
| REQ-AUTH-003 | Cookie 文本粘贴导入 | confirmed | done |
| REQ-AUTH-004 | Cookie 导出扩展（Boss/智联/鱼泡） | confirmed | done |
| REQ-AUTH-005 | AI/CLI 无需交互登录 | confirmed | done |
| REQ-AUTH-006 | `bossjobs auth status` | confirmed | done |
| REQ-AUTH-007 | 凭证仅存本地 | confirmed | done |

---

## D. 技术栈与工程

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-TECH-001 | 全套 TypeScript | confirmed | done |
| REQ-TECH-002 | pnpm | confirmed | done |
| REQ-TECH-003 | Next.js + TypeScript Web | confirmed | done |
| REQ-TECH-004 | Playwright 采集 | confirmed | done |
| REQ-TECH-005 | SQLite `~/.bossjobs/data.db` | confirmed | done |
| REQ-TECH-006 | Monorepo core/cli/web/extension | confirmed | done |
| REQ-TECH-007 | 文档先行 | confirmed | done |

---

## E. CLI 与 AI

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-CLI-001 | 可安装 CLI `bossjobs` | confirmed | done |
| REQ-CLI-002 | auth / collect / jobs / analyze / company | confirmed | done |
| REQ-CLI-003 | `--json` | confirmed | done |
| REQ-CLI-004 | 共用 SQLite | confirmed | done |
| REQ-CLI-005 | 一期 CLI；MCP deferred | confirmed | done |

---

## F. Web 与分析

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-WEB-001 | 岗位浏览筛选 | confirmed | done |
| REQ-WEB-002 | 采集任务触发 | confirmed | done |
| REQ-WEB-003 | 城市数量分析 | confirmed | done |
| REQ-WEB-004 | 城市薪资分析 | confirmed | done |
| REQ-WEB-005 | 岗位详情 | confirmed | done |
| REQ-WEB-006 | Cookie 导入设置页 | confirmed | done |

---

## G. 公司背调

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-CO-001 | 按公司名查询缓存 | confirmed | done |
| REQ-CO-002 | 目标字段有则填 | confirmed | done |
| REQ-CO-003 | CNBizAPI / null Provider | confirmed | done |
| REQ-CO-004 | CLI + Web | confirmed | done |

---

## H. 明确延期

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-DEFER-001 | 鱼泡采集 | deferred | n/a |
| REQ-DEFER-002 | MCP Server | deferred | n/a |
| REQ-DEFER-003 | 自动投递 | deferred | n/a |
| REQ-DEFER-004 | 多用户云端 | deferred | n/a |
