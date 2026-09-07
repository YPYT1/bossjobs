# 04 · 数据模型

## 1. 存储

- 引擎：SQLite
- 默认路径：`~/.bossjobs/data.db`
- 迁移：`packages/core` 内版本化 migration

## 2. 表：jobs

统一岗位表（Boss / 智联共用）。

| 列 | 类型 | 说明 | 对应需求 |
|----|------|------|----------|
| id | TEXT PK | 内部 UUID | — |
| platform | TEXT | `boss` \| `zhilian` | REQ-COLLECT-010 |
| platform_job_id | TEXT | 平台侧 ID | REQ-COLLECT-012 |
| title | TEXT | 岗位名称 | REQ-COLLECT-003 |
| city | TEXT | 城市（规范化中文） | REQ-COLLECT-002 |
| location | TEXT | 更细地址/商圈 | REQ-COLLECT-004 |
| salary_raw | TEXT | 原始薪资文案 | REQ-COLLECT-005 |
| salary_min | INTEGER NULL | 解析后下限（元/月，约定） | REQ-WEB-004 |
| salary_max | INTEGER NULL | 解析后上限 | REQ-WEB-004 |
| salary_months | INTEGER NULL | 如 15 薪 | — |
| welfare | TEXT NULL | 福利，JSON 数组或分隔文本 | REQ-COLLECT-006 |
| rest_policy | TEXT NULL | 休息制度原文/枚举 | REQ-COLLECT-007 |
| is_double_off | INTEGER NULL | 0/1/NULL | REQ-COLLECT-007 |
| jd | TEXT NULL | 岗位描述 | REQ-COLLECT-008 |
| company_name | TEXT | 公司名 | REQ-COLLECT-009 |
| company_id | TEXT NULL | 关联 companies.id | REQ-CO-001 |
| experience | TEXT NULL | 经验要求（若有） | — |
| degree | TEXT NULL | 学历（若有） | — |
| job_url | TEXT NULL | 原链接 | — |
| keyword | TEXT NULL | 触发采集的关键词 | REQ-COLLECT-001 |
| raw_json | TEXT NULL | 原始片段 | REQ-COLLECT-010 |
| collected_at | TEXT | ISO 时间 | REQ-COLLECT-010 |
| updated_at | TEXT | ISO 时间 | — |

唯一约束：`UNIQUE(platform, platform_job_id)`

## 3. 表：companies

| 列 | 类型 | 说明 |
|----|------|------|
| id | TEXT PK | |
| name | TEXT UNIQUE | 公司名称 |
| status | TEXT NULL | 经营状况 |
| social_insurance_count | INTEGER NULL | 社保人数 |
| employee_count | INTEGER NULL | 在职人数 |
| registered_at | TEXT NULL | 注册时间 |
| registered_capital | TEXT NULL | 注册资金 |
| lawsuits_summary | TEXT NULL | 案件摘要 JSON/文本 |
| provider | TEXT NULL | 数据来源 Provider |
| raw_json | TEXT NULL | |
| enriched_at | TEXT NULL | |

对应 REQ-CO-002；允许大量 NULL。

## 4. 表：collect_tasks

| 列 | 类型 | 说明 |
|----|------|------|
| id | TEXT PK | |
| platform | TEXT | |
| city | TEXT | |
| keyword | TEXT | |
| pages | INTEGER | |
| status | TEXT | pending/running/done/failed |
| error | TEXT NULL | |
| created_at | TEXT | |
| finished_at | TEXT NULL | |

## 5. 薪资解析约定

- Boss 常见：`30-60K·15薪` → min=30000, max=60000, months=15（单位：元/月）
- 智联字段以实现时实抓为准，写入 `salary_raw` 后再 parse
- 解析失败：保留 raw，min/max 置 NULL

## 6. 休息制度解析约定

优先级：

1. 平台结构化字段（若有）
2. JD 关键词：双休、大小周、单休、排班、不定时 等
3. 无法判断 → `is_double_off = NULL`
