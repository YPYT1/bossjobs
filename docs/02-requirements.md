# 02 · 需求清单（逐条落实）

> 开发必须以本表为准。状态含义见 [README](./README.md)。  
> **实现状态：** `todo` | `doing` | `done` | `n/a`

最后确认日期：2026-09-07

---

## A. 产品范围

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-SCOPE-001 | 一期完整支持 Boss 直聘 + 智联招聘采集 | confirmed | todo |
| REQ-SCOPE-002 | 鱼泡一期仅 Cookie 导出扩展域名预留，不做采集 | confirmed | todo |
| REQ-SCOPE-003 | 自动投递/打招呼一期不实现，仅预留模块接口 | confirmed | todo |
| REQ-SCOPE-004 | 数据仅存本地，不默认做多用户云端 SaaS | confirmed | todo |

---

## B. 采集能力

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-COLLECT-001 | 支持按「关键词」搜索岗位（可多关键词任务） | confirmed | todo |
| REQ-COLLECT-002 | 支持指定城市（中文名，内部映射平台城市码） | confirmed | todo |
| REQ-COLLECT-003 | 采集字段：岗位名称 | confirmed | todo |
| REQ-COLLECT-004 | 采集字段：工作地点/位置 | confirmed | todo |
| REQ-COLLECT-005 | 采集字段：薪资区间（明文，不依赖字体 DOM） | confirmed | todo |
| REQ-COLLECT-006 | 采集字段：福利待遇 | confirmed | todo |
| REQ-COLLECT-007 | 采集字段：是否双休 / 休息制度（接口有则取；否则从 JD 启发式解析，可空） | confirmed | todo |
| REQ-COLLECT-008 | 采集字段：岗位 JD 全文 | confirmed | todo |
| REQ-COLLECT-009 | 采集字段：公司名称 | confirmed | todo |
| REQ-COLLECT-010 | 记录来源平台、原始 job id、抓取时间、原始 JSON（或摘要） | confirmed | todo |
| REQ-COLLECT-011 | 采数优先内部 API（CDP 旁听或登录态请求），禁止以 DOM 薪资为主路径 | confirmed | todo |
| REQ-COLLECT-012 | 同一岗位按「平台 + 平台侧 job_id」去重 upsert | confirmed | todo |
| REQ-COLLECT-013 | 支持分页/页数上限配置，带请求间隔，避免打爆风控 | confirmed | todo |
| REQ-COLLECT-014 | 列表与详情可分步：可只抓列表，或列表+详情 | confirmed | todo |

---

## C. 认证与浏览器

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-AUTH-001 | 专用浏览器 Profile，名称/目录标识为 `bossjobs` | confirmed | todo |
| REQ-AUTH-002 | 通过 Playwright 使用持久化 Context 或 connectOverCDP | confirmed | todo |
| REQ-AUTH-003 | 支持 Cookie 文本粘贴导入（Boss、智联） | confirmed | todo |
| REQ-AUTH-004 | 提供 Cookie 导出浏览器扩展；支持 Boss、智联、鱼泡域名 | confirmed | todo |
| REQ-AUTH-005 | AI/CLI 调用时无需交互登录（依赖已保存 Profile 或 Cookie） | confirmed | todo |
| REQ-AUTH-006 | 提供登录态检查命令（如 `bossjobs auth status`） | confirmed | todo |
| REQ-AUTH-007 | Cookie/凭证仅存本地用户目录，不入库明文到可分享导出的默认包 | confirmed | todo |

---

## D. 技术栈与工程

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-TECH-001 | 全套 TypeScript；一期不引入 Python | confirmed | todo |
| REQ-TECH-002 | 包管理使用 pnpm | confirmed | todo |
| REQ-TECH-003 | Web 使用 Next.js 最新稳定版 + TypeScript | confirmed | todo |
| REQ-TECH-004 | 采集使用 Playwright（含 CDP / Persistent Context） | confirmed | todo |
| REQ-TECH-005 | 本地库使用 SQLite，路径默认 `~/.bossjobs/data.db` | confirmed | todo |
| REQ-TECH-006 | Monorepo：core / cli / web / extension 分包 | confirmed | todo |
| REQ-TECH-007 | 文档先行：无 confirmed 需求不编码 | confirmed | todo |

---

## E. CLI 与 AI

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-CLI-001 | 提供可安装 CLI（pnpm/npm 全局或 link 后可用 `bossjobs`） | confirmed | todo |
| REQ-CLI-002 | CLI 覆盖：auth、search/collect、list、analyze、company | confirmed | todo |
| REQ-CLI-003 | 所有面向 AI 的命令支持 `--json` 结构化输出 | confirmed | todo |
| REQ-CLI-004 | CLI 与 Web 共用同一 SQLite | confirmed | todo |
| REQ-CLI-005 | 一期以 CLI 作为 AI 工具入口；MCP 列为二期（deferred） | confirmed | todo |

---

## F. Web 与分析

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-WEB-001 | Web 可浏览已采集岗位（筛选：城市、关键词、平台、薪资） | confirmed | todo |
| REQ-WEB-002 | Web 可发起/查看采集任务状态（至少手动触发采集） | confirmed | todo |
| REQ-WEB-003 | 分析：某岗位关键词在各城市的数量分布 | confirmed | todo |
| REQ-WEB-004 | 分析：城市维度薪资分布（区间/中位数等，以可实现为准） | confirmed | todo |
| REQ-WEB-005 | 岗位详情页展示 JD、福利、公司入口 | confirmed | todo |
| REQ-WEB-006 | Cookie 导入的 Web 配置入口（粘贴文本） | confirmed | todo |

---

## G. 公司背调

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-CO-001 | 按公司名称查询并缓存背调结果 | confirmed | todo |
| REQ-CO-002 | 目标字段：经营状况、社保人数、在职人数、注册时间、注册资金、相关案件（有则填，无则空） | confirmed | todo |
| REQ-CO-003 | 优先免费 API Provider（可插拔） | confirmed | todo |
| REQ-CO-004 | CLI `company` 与 Web 公司页均可查看 | confirmed | todo |

---

## H. 明确延期 / 不做（一期）

| ID | 需求 | 状态 | 实现 |
|----|------|------|------|
| REQ-DEFER-001 | 鱼泡岗位采集 | deferred | n/a |
| REQ-DEFER-002 | MCP Server | deferred | n/a |
| REQ-DEFER-003 | 自动投递 / 批量打招呼 | deferred | n/a |
| REQ-DEFER-004 | 多用户账号体系与云端部署 | deferred | n/a |

---

## 待用户确认项（当前为空）

> 你上一轮已确认：SQLite、优先全 TS、CLI 给 AI、文档先行。  
> 若有新提案，在此追加 `proposed` 行，确认后再改为 `confirmed`。

| ID | 提案 | 状态 |
|----|------|------|
| — | （无） | — |
