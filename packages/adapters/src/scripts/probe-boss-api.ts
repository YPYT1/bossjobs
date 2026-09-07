/**
 * Probe Boss search page and print captured API URLs + sample fields.
 * Usage: pnpm --filter @bossjobs/adapters probe:boss
 */
import { BrowserManager } from "../browser.js";
import { buildBossSearchUrl } from "../boss/adapter.js";
import { isBossJobListUrl, mapBossListResponse } from "../boss/mapper.js";
import { resolveBossCityCode } from "../city-codes.js";

async function main() {
  const city = process.argv[2] ?? "重庆";
  const keyword = process.argv[3] ?? "AI开发";
  const browser = new BrowserManager({ headless: false });
  const page = await browser.newPage();

  const urls: string[] = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (u.includes("zhipin.com") && u.includes("/wapi/")) {
      urls.push(`${res.status()} ${u.slice(0, 180)}`);
    }
  });

  const searchUrl = buildBossSearchUrl({
    cityCode: resolveBossCityCode(city),
    keyword,
    page: 1,
  });
  console.log("goto", searchUrl);

  const responsePromise = page.waitForResponse(
    (res) => isBossJobListUrl(res.url()) && res.status() === 200,
    { timeout: 60_000 },
  );
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  try {
    const res = await responsePromise;
    const json = await res.json();
    const jobs = mapBossListResponse(json, city);
    console.log("captured", res.url());
    console.log("jobs", jobs.length);
    console.log("sample", jobs[0]);
  } catch (err) {
    console.error("failed to capture joblist.json", err);
    console.error("seen /wapi/ urls:\n", urls.join("\n"));
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
