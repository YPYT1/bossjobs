/**
 * Live smoke tests — require real Chrome + login in ~/.bossjobs/browser-profile.
 * Skip automatically when BOSSJOBS_LIVE !== '1'
 *
 * Run: BOSSJOBS_LIVE=1 pnpm test:live
 */
import { afterAll, describe, expect, it } from "vitest";
import { BrowserManager } from "./browser.js";
import { BossAdapter } from "./boss/adapter.js";
import { ZhilianAdapter } from "./zhilian/adapter.js";

const live = process.env.BOSSJOBS_LIVE === "1";

describe.skipIf(!live)("live crawler smoke", () => {
  const browser = new BrowserManager({ headless: false });

  afterAll(async () => {
    await browser.close();
  });

  it(
    "Boss: capture joblist API for 重庆 + AI开发",
    async () => {
      const adapter = new BossAdapter({ browser });
      const jobs = await adapter.search({
        city: "重庆",
        keyword: "AI开发",
        pages: 1,
      });
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0]!.salaryRaw).toBeTruthy();
      expect(jobs[0]!.companyName).toBeTruthy();
      console.error(
        `[live] Boss got ${jobs.length} jobs, sample:`,
        jobs[0]!.title,
        jobs[0]!.salaryRaw,
      );
    },
    120_000,
  );

  it(
    "Zhilian: capture search API for 重庆 + AI开发",
    async () => {
      const adapter = new ZhilianAdapter({ browser });
      const jobs = await adapter.search({
        city: "重庆",
        keyword: "AI开发",
        pages: 1,
      });
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0]!.companyName).toBeTruthy();
      console.error(
        `[live] Zhilian got ${jobs.length} jobs, sample:`,
        jobs[0]!.title,
        jobs[0]!.salaryRaw,
      );
    },
    120_000,
  );
});
