/**
 * Probe Zhilian — dump all JSON API hits to discover search endpoint.
 */
import { BrowserManager } from "../browser.js";
import { buildZhilianSearchUrl } from "../zhilian/adapter.js";
import { resolveZhilianCityCode } from "../city-codes.js";
import type { Response } from "playwright";

async function main() {
  const city = process.argv[2] ?? "重庆";
  const keyword = process.argv[3] ?? "AI开发";
  const browser = new BrowserManager({ headless: false });
  const page = await browser.newPage();

  const hits: Array<{ url: string; keys: string; preview: string }> = [];

  page.on("response", async (res: Response) => {
    try {
      const u = res.url();
      if (!u.includes("zhaopin.com") && !u.includes("zhaopin.cn")) return;
      if (res.status() !== 200) return;
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      const json = (await res.json()) as Record<string, unknown>;
      const keys = Object.keys(json).slice(0, 12).join(",");
      const text = JSON.stringify(json).slice(0, 180);
      hits.push({ url: u.slice(0, 220), keys, preview: text });
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
  await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(4000);

  // Try clicking search if still on homepage-ish
  console.log("title", await page.title());
  console.log("finalUrl", page.url());
  console.log("json hits", hits.length);
  for (const h of hits) {
    console.log("---");
    console.log(h.url);
    console.log("keys:", h.keys);
    console.log(h.preview);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
