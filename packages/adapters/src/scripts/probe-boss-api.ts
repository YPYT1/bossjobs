/**
 * Probe Boss search page via CDP body capture.
 */
import { BrowserManager } from "../browser.js";
import { buildBossSearchUrl } from "../boss/adapter.js";
import {
  isBossJobListUrl,
  mapBossListResponse,
  type BossJobListApiResponse,
} from "../boss/mapper.js";
import { captureJsonViaCdp } from "../capture.js";
import { resolveBossCityCode } from "../city-codes.js";

async function main() {
  const city = process.argv[2] ?? "重庆";
  const keyword = process.argv[3] ?? "AI开发";
  const browser = new BrowserManager({ headless: false });
  const page = await browser.newPage();

  const searchUrl = buildBossSearchUrl({
    cityCode: resolveBossCityCode(city),
    keyword,
    page: 1,
  });
  console.log("goto", searchUrl);

  try {
    const { url, data } = await captureJsonViaCdp<BossJobListApiResponse>(
      page,
      isBossJobListUrl,
      {
        navigate: async () => {
          await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60_000,
          });
        },
      },
    );
    const jobs = mapBossListResponse(data, city);
    const withSalary = jobs.filter((j) => j.salaryRaw).length;
    console.log("captured", url);
    console.log("jobs", jobs.length, "withSalary", withSalary);
    console.log("sample", jobs[0]);
    console.log(
      "salaries",
      jobs.slice(0, 8).map((j) => [j.title, j.salaryRaw, j.companyName]),
    );
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
