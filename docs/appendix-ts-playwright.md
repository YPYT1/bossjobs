# 技术可行性：TypeScript + Playwright / CDP

> 附录文档，支撑 ADR-001。

## 结论

**可以全套 TypeScript。** 一期不需要 Python。

## Playwright 能力对照

| 需求 | Playwright API |
|------|----------------|
| 专用持久 Profile `bossjobs` | `chromium.launchPersistentContext(userDataDir)` |
| 连接已开调试端口的 Chrome | `chromium.connectOverCDP('http://127.0.0.1:9222')` |
| 旁听内部搜索 API | `page.on('response')` / `page.waitForResponse` |
| 底层 CDP | `context.newCDPSession(page)` → `Network.*` 等 |
| Cookie 注入 | `context.addCookies([...])` |

官方文档：[BrowserType.connectOverCDP](https://playwright.dev/docs/api/class-browsertype)、[Network](https://playwright.dev/docs/network)。

## 与 Python CDP 脚本的关系

[boss-zhipin-scraper](https://github.com/eatmoreduck/boss-zhipin-scraper) 等用 Python 调 CDP WebSocket；Playwright 是同一协议上的更高层封装，用 TS 可实现等价「真实 Chrome + 旁听 joblist API」路径。

## 何时才考虑 Python

仅当 ADR 修订：Playwright 路径在目标站点长期不可用，且已有稳定 Python 实现必须复用时。默认不引入。
