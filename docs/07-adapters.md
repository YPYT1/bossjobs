# 07 · 采集适配器（Boss / 智联）

对应：REQ-COLLECT-*、REQ-SCOPE-001、ADR-003。

## 1. 共同策略

1. 使用 Playwright 打开**真实搜索结果页**（带城市与关键词）
2. 通过 `page.on('response')` / `waitForResponse` **旁听** XHR/Fetch JSON
3. 解析为目标字段；薪资用 API 明文，不用 DOM 字体文本
4. 详情页同样优先接口；必要时再解析详情区 JD
5. 城市名 → 平台 city code：本地码表 + 可更新

实现时接口 path 以**本机实抓**为准；下文为已知公开实践，可能变更。

## 2. Boss 直聘

### 已知列表接口（参考）

- Path 形态：`/wapi/zpgeek/search/joblist.json`
- 价值：响应含 `salaryDesc` 等明文薪资
- 鉴权：需有效登录 Cookie / 页面上下文

### 推荐实现顺序

1. `auth setup` 保证 Profile 已登录
2. `goto` 搜索 URL（或站内搜索操作）
3. 监听包含 `joblist` 的响应，`response.json()`
4. 映射字段 → `RawJobListItem`
5. 详情：带列表返回的 `securityId` / `lid` 等上下文打开详情或调详情接口
6. 风控码（如环境异常）→ 任务失败并明确错误码，避免死循环重试

### 开源参考（学习，非直接依赖）

- [eatmoreduck/boss-zhipin-scraper](https://github.com/eatmoreduck/boss-zhipin-scraper) — CDP + API 旁听
- [jackwener/boss-cli](https://github.com/jackwener/boss-cli) — Cookie/API CLI 思路

## 3. 智联招聘

### 策略

- 打开智联搜索页，旁听职位搜索 JSON（历史实践中出现过 `fe-api.zhaopin.com`、`cgate.zhaopin.com` 等，**以当前站点为准**）
- 提取：职位名、公司、薪资、城市、详情 URL、福利标签等
- 详情页/接口补 JD

### 注意

- 可能存在 `at` / `rt` 等头或 query；在页面上下文中旁听可减少手造签名
- Cookie 导入后若仍 401/空列表，提示重新登录 Profile

## 4. 字段映射原则

| 统一字段 | Boss | 智联 |
|----------|------|------|
| title | 列表职位名 | 列表职位名 |
| salary_raw | salaryDesc 等 | 平台薪资字段 |
| company_name | 公司名 | 公司名 |
| location | 商圈/地址 | 工作地点 |
| welfare | 福利标签数组 | 福利标签 |
| jd | 详情描述 | 详情描述 |
| rest / 双休 | 字段或 JD 解析 | 同左 |

映射表作为代码内 `mappers/boss.ts`、`mappers/zhilian.ts`，接口变更只改 mapper。

## 5. 验收标准（适配器）

- [ ] 重庆 +「AI开发」Boss 可入库 ≥1 条（账号有效前提下）
- [ ] 同条件智联可入库 ≥1 条
- [ ] `salary_raw` 非乱码字体字符
- [ ] 详情开启时 `jd` 非空（若岗位需登录才能看全，应失败提示而非写残缺当完整）

## 6. 鱼泡

一期：**不实现 Adapter**。仅扩展可导出 Cookie（REQ-SCOPE-002）。
