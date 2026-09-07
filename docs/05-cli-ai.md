# 05 · CLI 与 AI 工具

## 1. 目标

提供可安装命令行工具 **`bossjobs`**，作为：

- 人类日常操作入口
- **AI Agent 的标准工具**（安装后即可在终端调用）

对应：REQ-CLI-001 ~ REQ-CLI-005。

## 2. 安装方式（一期约定）

Monorepo 内：

```bash
pnpm install
pnpm --filter @bossjobs/cli build
pnpm --filter @bossjobs/cli link --global
# 或: pnpm exec bossjobs ...
```

发布后（远期）：

```bash
npm i -g @bossjobs/cli
# bossjobs --help
```

`package.json` 需声明：

```json
{
  "name": "@bossjobs/cli",
  "bin": {
    "bossjobs": "./dist/index.js"
  }
}
```

## 3. 命令一览

| 命令 | 作用 | 示例 |
|------|------|------|
| `bossjobs auth setup` | 启动/准备 Profile `bossjobs`，引导登录 | `bossjobs auth setup` |
| `bossjobs auth status` | 检查 Boss/智联登录是否可用 | `bossjobs auth status --json` |
| `bossjobs auth import-cookie` | 粘贴/文件导入 Cookie | `bossjobs auth import-cookie --platform boss --file cookies.txt` |
| `bossjobs collect` | 采集入库 | `bossjobs collect --platform boss --city 重庆 --keyword "AI开发" --pages 3` |
| `bossjobs jobs` | 查询本地岗位 | `bossjobs jobs --city 重庆 --keyword agent --json` |
| `bossjobs analyze` | 城市/薪资等分析 | `bossjobs analyze salary --keyword "AI开发" --json` |
| `bossjobs company` | 公司背调 | `bossjobs company "某某科技有限公司" --json` |
| `bossjobs db path` | 打印 SQLite 路径 | `bossjobs db path` |

## 4. AI 调用约定

1. **优先使用 `--json`**，stdout 仅输出 JSON（日志走 stderr）
2. 成功：`{ "ok": true, "data": ... }`
3. 失败：`{ "ok": false, "error": { "code": "...", "message": "..." } }`，进程 exit code ≠ 0
4. AI 系统提示可写明：先 `auth status`，未登录则提示用户运行 `auth setup` 或导入 Cookie
5. 一期不强制 MCP；若二期加 MCP，每个 tool 应对应上表一条命令

### AI 最小工具集（给 Skill / Agent 配置用）

```text
bossjobs auth status --json
bossjobs collect --platform <boss|zhilian> --city <城市> --keyword <词> --pages <n> --json
bossjobs jobs --city <城市> --keyword <词> --limit <n> --json
bossjobs analyze salary --keyword <词> --json
bossjobs company <公司名> --json
```

## 5. 与 Web 的关系

- CLI 不依赖 Web 进程
- Web 不依赖 CLI 进程
- 两者只共享 `~/.bossjobs/data.db` 与配置目录
