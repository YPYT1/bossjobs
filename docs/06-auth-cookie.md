# 06 · 认证与 Cookie

对应需求：REQ-AUTH-001 ~ REQ-AUTH-007。

## 1. Profile「bossjobs」

| 项 | 约定 |
|----|------|
| 文档/CLI 名称 | `bossjobs` |
| 磁盘目录 | `~/.bossjobs/browser-profile`（可用配置覆盖） |
| 启动方式 | Playwright `launchPersistentContext`；或用户自启 Chrome + CDP 端口后 `connectOverCDP` |
| 首次使用 | `bossjobs auth setup` 打开浏览器，用户手动登录 Boss / 智联 |
| 隔离 | 不默认复制系统主 Chrome 的完整用户数据 |

## 2. Cookie 文本导入

### 格式（一期支持两种）

**A. Header 风格单行**

```text
name1=value1; name2=value2
```

**B. JSON 数组（扩展导出）**

```json
[
  { "name": "wt2", "value": "...", "domain": ".zhipin.com", "path": "/" }
]
```

### 流程

1. 用户从扩展复制，或从 DevTools 复制
2. CLI：`auth import-cookie --platform boss|zhilian`
3. Web：设置页粘贴保存
4. 存入 `~/.bossjobs/credentials/<platform>.json`（本地权限尽量收紧）
5. 采集前注入到 Browser Context

## 3. Cookie 导出扩展

| 项 | 约定 |
|----|------|
| 形态 | Chrome MV3 扩展（`packages/extension`） |
| 域名 | Boss（zhipin.com）、智联（zhaopin.com）、鱼泡（预留 yupao 相关域名） |
| 功能 | 一键复制 Cookie 文本（JSON 优先）；不负责采集 |
| 安装 | 开发者模式加载 `dist`；文档说明步骤 |

## 4. 「AI 免登录」操作说明（用户文档口径）

1. 人执行一次：`bossjobs auth setup` 或导入 Cookie  
2. AI 只跑 `collect` / `jobs` / `analyze`  
3. `auth status` 失败时，AI 应提示用户更新登录态，而不是自己完成登录  

## 5. 安全

- `.gitignore` 必须忽略 `credentials/`、本地 profile、`.env`
- 不把 Cookie 写入默认导出的岗位 CSV（除非用户显式要求）
