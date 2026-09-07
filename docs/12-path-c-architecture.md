# Path C 采集架构（已实现）

薄浏览器会话 + 页面内官方接口（credentials include）。

## Boss
1. 打开/复用 `~/.bossjobs/browser-profile`
2. Host: `https://www.zhipin.com/web/geek/job`
3. 页面内 `fetch /wapi/zpgeek/search/joblist.json?query&city&page`
4. Header: `Zp_token` ← Cookie `bst`（参考 boss-helper）
5. 失败/风控 → CDP 旁听导航触发的 joblist
6. 详情: `/wapi/zpgeek/job/detail.json?securityId&lid`

## 智联
1. Host: `https://www.zhaopin.com/`
2. 页面内 `fetch https://fe-api.zhaopin.com/c/i/sou?keyword&cityId&start&count`（参考 BossHunter）

## 复用来源
- city_codes.json ← boss-zhipin-scraper
- Zp_token / detail ← boss-helper requests.ts
- 智联 sou ← BossHunter zhilian.py API-fetch
- 公司背调 ← CNBizAPI HTTP
