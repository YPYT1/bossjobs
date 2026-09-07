# 08 · 公司背调

对应：REQ-CO-001 ~ REQ-CO-004、ADR-007。

## 1. 目标字段

| 字段 | 说明 | 免费源可能缺失 |
|------|------|----------------|
| 经营状况 | 存续/注销等 | 较少 |
| 注册时间 | | 较少 |
| 注册资金 | | 较少 |
| 社保人数 | 常来自年报 | **常见缺失** |
| 在职人数 | 推算或招聘披露 | **常见缺失** |
| 相关案件 | 司法风险摘要 | 可能需额外额度 |

产品口径：**有则展示，无则显示「暂无」**，不阻塞岗位采集。

## 2. Provider 接口

```ts
interface CompanyProvider {
  readonly name: string;
  lookup(companyName: string): Promise<CompanyEnrichment>;
}
```

`CompanyEnrichment` 与 `companies` 表字段对齐；全部可选。

## 3. 一期默认 Provider 候选

| Provider | 费用 | 说明 |
|----------|------|------|
| CNBizAPI | 约 200 次/月免费 | 有 REST + MCP，适合个人；作默认候选 |
| 天眼查/企查查开放平台 | 试用/付费 | 作为可选第二 Provider |
| 手工/空 Provider | 免费 | 无 Key 时返回空，保证系统可跑 |

配置：`~/.bossjobs/config.json` → `company.provider` + API Key。

## 4. 缓存策略

- 按公司名规范化后查 `companies` 表
- `enriched_at` 在 TTL 内（如 7 天）不重复请求
- CLI/Web 提供 `--refresh` 强制刷新

## 5. 不做（一期）

- 直接硬爬国家企业信用信息公示系统（反爬重、不稳定）
- 保证 100% 字段齐全
