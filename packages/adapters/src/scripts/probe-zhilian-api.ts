/**
 * Probe Zhilian search page and print captured JSON API URLs.
 * Usage: pnpm --filter @bossjobs/adapters probe:zhilian
 */
import { BrowserManager } from "../browser.js";
import { buildZhilianSearchUrl } from "../zhilian/adapter.js";
import {
  extractZhilianList,
  isZhilianSearchUrl,
  mapZhilianListResponse,
} from "../zhilian/mapper.js";
import { resolveZhilianCityCode } from "../city-codes.js";

async function main() {
  const city = process.argv[2] ?? "重庆";
  const keyword = process.argv[3] ?? "AI开发";
  const browser = new BrowserManager({ headless: false });
  const page = await browser.newPage();

  const hits: Array<{ url: string; count: number }> = [];

  page.on("response", async (res) => {
    try {
      const u = res.url();
      if (!u.includes("zhaopin.com")) return;
      if (res.status() !== 200) return;
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      if (!isZhilianSearchUrl(u) && !u.includes("sou") && !u.includes("position"))
        return;
      const json = await res.json();
      const list = extractZhilianList(json);
      hits.push({ url: u.slice(0, 200), count: list.length });
      if (list.length > 0) {
        const mapped = mapZhilianListResponse(json, city);
        console.log("HIT", u);
        console.log("count", mapped.length, "sample", mapped[0]);
      }
    } catch {
      // ignore
    }
  });

  const url = buildZhilianSearchUrl({
    cityCode: resolveZhilianCityCode(city),
    keyword,
    page: 1,
  });
  console.log("goto", url);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(3000);
  console.log("all json hits", hits);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
