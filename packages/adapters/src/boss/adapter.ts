import type { AuthStatus, RawJobDetail, RawJobListItem } from "@bossjobs/core";
import type { Page } from "playwright";
import { BrowserManager } from "../browser.js";
import { captureJsonViaCdp } from "../capture.js";
import { resolveBossCityCode } from "../city-codes.js";
import {
  ensureHostPage,
  pageFetchJson,
  readBossZpToken,
} from "../page-api.js";
import type { JobRef, PlatformAdapter } from "../types.js";
import {
  assertBossApiOk,
  isBossJobListUrl,
  mapBossListResponse,
  type BossJobListApiResponse,
} from "./mapper.js";

const HOST = "https://www.zhipin.com/web/geek/job";
const LIST_PATH = "/wapi/zpgeek/search/joblist.json";
const DETAIL_PATH = "/wapi/zpgeek/job/detail.json";

export interface BossAdapterOptions {
  browser?: BrowserManager;
  pageDelayMs?: number;
}

/**
 * Boss adapter — Path C: thin browser + official API (page-context fetch).
 * Fallback: CDP passive capture of joblist.json.
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
      const payload = await this.fetchListPage(page, {
        city: "重庆",
        keyword: "工程师",
        page: 1,
      });
      assertBossApiOk(payload);
      const list = payload.zpData?.jobList ?? [];
      const withSalary = list.filter((j) => Boolean(j.salaryDesc)).length;
      return {
        platform: "boss",
        ok: true,
        message: `API 可用，列表 ${list.length} 条，明文薪资 ${withSalary} 条`,
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
    const pages = Math.min(Math.max(input.pages ?? 1, 1), 10);
    const page = await this.browser.newPage();
    const seen = new Set<string>();
    const results: RawJobListItem[] = [];

    try {
      for (let p = 1; p <= pages; p++) {
        const payload = await this.fetchListPage(page, {
          city: input.city,
          keyword: input.keyword,
          page: p,
        });
        const mapped = mapBossListResponse(payload, input.city);
        if (mapped.length === 0 && p === 1) {
          throw new Error(
            "Boss 列表为空。请先 `bossjobs auth setup` 登录求职者账号。",
          );
        }
        for (const item of mapped) {
          if (seen.has(item.platformJobId)) continue;
          seen.add(item.platformJobId);
          results.push(item);
        }
        if (mapped.length === 0) break;
        if (p < pages) await page.waitForTimeout(this.pageDelayMs);
      }
      return results;
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async fetchDetail(ref: JobRef): Promise<RawJobDetail> {
    const page = await this.browser.newPage();
    try {
      await ensureHostPage(page, HOST);
      const token = await readBossZpToken(page);
      const params = new URLSearchParams({
        securityId: ref.detailContext?.securityId ?? "",
        lid: ref.detailContext?.lid ?? "",
        _: String(Date.now()),
      });
      if (!ref.detailContext?.securityId) {
        return this.fetchDetailFromHtml(page, ref);
      }

      const result = await pageFetchJson(
        page,
        `${DETAIL_PATH}?${params.toString()}`,
        {
          headers: token ? { Zp_token: token } : {},
        },
      );
      if (result.error || result.httpStatus !== 200) {
        return this.fetchDetailFromHtml(page, ref);
      }
      const json = JSON.parse(result.body) as {
        code?: number;
        zpData?: {
          jobInfo?: {
            postDescription?: string;
            salaryDesc?: string;
            address?: string;
          };
          brandComInfo?: { brandName?: string };
        };
      };
      const info = json.zpData?.jobInfo;
      return {
        platformJobId: ref.platformJobId,
        jd: info?.postDescription,
        salaryRaw: info?.salaryDesc || undefined,
        location: info?.address,
      };
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  private async fetchListPage(
    page: Page,
    opts: { city: string; keyword: string; page: number },
  ): Promise<BossJobListApiResponse> {
    await ensureHostPage(page, HOST);
    const cityCode = resolveBossCityCode(opts.city);
    const token = await readBossZpToken(page);
    const qs = new URLSearchParams({
      query: opts.keyword,
      city: cityCode,
      page: String(opts.page),
      pageSize: "15",
      _: String(Date.now()),
    });

    // Primary: page-context official API
    const fetched = await pageFetchJson(page, `${LIST_PATH}?${qs}`, {
      headers: token ? { Zp_token: token } : {},
    });

    if (!fetched.error && fetched.httpStatus === 200 && fetched.body) {
      try {
        const payload = JSON.parse(fetched.body) as BossJobListApiResponse;
        if (payload.code === 0 || payload.zpData?.jobList) {
          return payload;
        }
        // risk control → fall through to CDP navigate capture
        if (payload.code === 31 || payload.code === 37) {
          // continue fallback
        } else if (payload.code !== undefined && payload.code !== 0) {
          assertBossApiOk(payload);
        }
      } catch {
        // fallback
      }
    }

    // Fallback: navigate real search URL + CDP body capture
    const searchUrl = buildBossSearchUrl({
      cityCode,
      keyword: opts.keyword,
      page: opts.page,
    });
    const { data } = await captureJsonViaCdp<BossJobListApiResponse>(
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
    return data;
  }

  private async fetchDetailFromHtml(
    page: Page,
    ref: JobRef,
  ): Promise<RawJobDetail> {
    const url =
      ref.jobUrl ??
      `https://www.zhipin.com/job_detail/${ref.platformJobId}.html`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(1200);
    const jd = await page
      .locator(".job-sec-text, .job-detail-section .text, [class*='job-sec']")
      .first()
      .innerText()
      .catch(() => "");
    return {
      platformJobId: ref.platformJobId,
      jd: jd.trim() || undefined,
    };
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
  return `https://www.zhipin.com/web/geek/job?${query.toString()}`;
}
