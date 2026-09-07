import type { AuthStatus, RawJobDetail, RawJobListItem } from "@bossjobs/core";
import type { Page, Response } from "playwright";
import { BrowserManager } from "../browser.js";
import { resolveBossCityCode } from "../city-codes.js";
import type { JobRef, PlatformAdapter } from "../types.js";
import {
  assertBossApiOk,
  isBossJobListUrl,
  mapBossListResponse,
  type BossJobListApiResponse,
} from "./mapper.js";

export interface BossAdapterOptions {
  browser?: BrowserManager;
  pageDelayMs?: number;
}

/**
 * Boss Zhipin adapter: navigate real search pages and capture joblist.json.
 * REQ-COLLECT-011, REQ-SCOPE-001
 */
export class BossAdapter implements PlatformAdapter {
  readonly platform = "boss" as const;
  private readonly browser: BrowserManager;
  private readonly pageDelayMs: number;

  constructor(options: BossAdapterOptions = {}) {
    this.browser = options.browser ?? new BrowserManager();
    this.pageDelayMs = options.pageDelayMs ?? 1200;
  }

  async resolveCityCode(cityName: string): Promise<string> {
    return resolveBossCityCode(cityName);
  }

  async ensureAuth(): Promise<AuthStatus> {
    const page = await this.browser.newPage();
    try {
      const city = resolveBossCityCode("重庆");
      const url = buildBossSearchUrl({
        cityCode: city,
        keyword: "测试",
        page: 1,
      });

      const payload = await captureJobList(page, url);
      assertBossApiOk(payload);
      const count = payload.zpData?.jobList?.length ?? 0;
      return {
        platform: "boss",
        ok: true,
        message: `登录态可用，探测列表 ${count} 条`,
      };
    } catch (err) {
      return {
        platform: "boss",
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      };
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async search(input: {
    city: string;
    keyword: string;
    pages?: number;
  }): Promise<RawJobListItem[]> {
    const cityCode = resolveBossCityCode(input.city);
    const pages = Math.min(Math.max(input.pages ?? 1, 1), 10);
    const page = await this.browser.newPage();
    const seen = new Set<string>();
    const results: RawJobListItem[] = [];

    try {
      for (let p = 1; p <= pages; p++) {
        const url = buildBossSearchUrl({
          cityCode,
          keyword: input.keyword,
          page: p,
        });
        const payload = await captureJobList(page, url);
        const mapped = mapBossListResponse(payload, input.city);
        for (const item of mapped) {
          if (seen.has(item.platformJobId)) continue;
          seen.add(item.platformJobId);
          results.push(item);
        }
        if (p < pages) {
          await page.waitForTimeout(this.pageDelayMs);
        }
      }
      return results;
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async fetchDetail(ref: JobRef): Promise<RawJobDetail> {
    const page = await this.browser.newPage();
    try {
      const url =
        ref.jobUrl ??
        `https://www.zhipin.com/job_detail/${ref.platformJobId}.html`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(1500);

      const loginWall = await page
        .locator("text=登录查看完整内容")
        .first()
        .isVisible()
        .catch(() => false);
      if (loginWall) {
        throw new Error("Boss 详情需要登录后查看完整 JD");
      }

      const jd = await page
        .locator(".job-sec-text, .job-detail-section .text, [class*='job-sec']")
        .first()
        .innerText()
        .catch(() => "");

      return {
        platformJobId: ref.platformJobId,
        jd: jd.trim() || undefined,
      };
    } finally {
      await page.close().catch(() => undefined);
    }
  }
}

export function buildBossSearchUrl(opts: {
  cityCode: string;
  keyword: string;
  page: number;
}): string {
  const query = new URLSearchParams({
    query: opts.keyword,
    city: opts.cityCode,
    page: String(opts.page),
  });
  // Web geek job search page triggers joblist.json
  return `https://www.zhipin.com/web/geek/job?${query.toString()}`;
}

async function captureJobList(
  page: Page,
  url: string,
): Promise<BossJobListApiResponse> {
  const responsePromise = page.waitForResponse(
    (res: Response) => isBossJobListUrl(res.url()) && res.status() === 200,
    { timeout: 45_000 },
  );

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const res = await responsePromise;
  const payload = (await res.json()) as BossJobListApiResponse;
  return payload;
}
