import type { AuthStatus, RawJobDetail, RawJobListItem } from "@bossjobs/core";
import type { Page } from "playwright";
import { BrowserManager } from "../browser.js";
import { captureJsonViaCdp } from "../capture.js";
import { resolveBossCityCode } from "../city-codes.js";
import { pickCompanyFullName } from "../company-name.js";
import {
  ensureHostPage,
  pageFetchJson,
  readBossZpToken,
  safeEvaluate,
} from "../page-api.js";
import { BOSS_HARD_MAX_PAGES, politeDelay } from "../rate-limit.js";
import type { JobRef, PlatformAdapter } from "../types.js";
import {
  assertBossApiOk,
  isBossJobListUrl,
  mapBossDetailResponse,
  mapBossListResponse,
  type BossJobDetailApiResponse,
  type BossJobListApiResponse,
} from "./mapper.js";

const HOST = "https://www.zhipin.com/web/geek/job";
const LIST_PATH = "https://www.zhipin.com/wapi/zpgeek/search/joblist.json";
const DETAIL_PATH = "https://www.zhipin.com/wapi/zpgeek/job/detail.json";

export interface BossAdapterOptions {
  browser?: BrowserManager;
  pageDelayMs?: number;
  jitterMs?: number;
}

export class BossAdapter implements PlatformAdapter {
  readonly platform = "boss" as const;
  private readonly browser: BrowserManager;
  private readonly pageDelayMs: number;
  private readonly jitterMs: number;

  constructor(options: BossAdapterOptions = {}) {
    this.browser = options.browser ?? new BrowserManager();
    this.pageDelayMs = options.pageDelayMs ?? 4500;
    this.jitterMs = options.jitterMs ?? 3500;
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
    }
  }

  async search(input: {
    city: string;
    keyword: string;
    pages?: number;
    exhaust?: boolean;
    delayMs?: number;
    jitterMs?: number;
    onPage?: (info: {
      page: number;
      maxPages: number;
      batch: number;
      total: number;
    }) => void | Promise<void>;
  }): Promise<RawJobListItem[]> {
    const delay = input.delayMs ?? this.pageDelayMs;
    const jitter = input.jitterMs ?? this.jitterMs;
    const maxPages = input.exhaust
      ? BOSS_HARD_MAX_PAGES
      : Math.min(Math.max(input.pages ?? 1, 1), BOSS_HARD_MAX_PAGES);
    const page = await this.browser.newPage();
    const seen = new Set<string>();
    const results: RawJobListItem[] = [];

    for (let p = 1; p <= maxPages; p++) {
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
      let batchNew = 0;
      for (const item of mapped) {
        if (seen.has(item.platformJobId)) continue;
        seen.add(item.platformJobId);
        results.push(item);
        batchNew++;
      }
      await input.onPage?.({
        page: p,
        maxPages,
        batch: batchNew,
        total: results.length,
      });
      if (mapped.length === 0) break;
      if (batchNew === 0 && p > 1) break;
      if (p < maxPages) await politeDelay(page, delay, jitter);
    }
    return results;
  }

  async fetchDetail(ref: JobRef): Promise<RawJobDetail> {
    const page = await this.browser.newPage();
    await ensureHostPage(page, HOST);
    const token = await readBossZpToken(page);
    if (!ref.detailContext?.securityId) {
      return this.fetchDetailFromHtml(page, ref);
    }
    const params = new URLSearchParams({
      securityId: ref.detailContext.securityId,
      lid: ref.detailContext.lid ?? "",
      _: String(Date.now()),
    });
    const result = await pageFetchJson(
      page,
      `${DETAIL_PATH}?${params.toString()}`,
      {
        headers: {
          ...(token ? { Zp_token: token } : {}),
          Referer: HOST,
          Origin: "https://www.zhipin.com",
        },
        fallbackOrigin: "https://www.zhipin.com",
      },
    );
    if (result.error || result.httpStatus !== 200) {
      return this.fetchDetailFromHtml(page, ref);
    }
    const json = JSON.parse(result.body) as BossJobDetailApiResponse;
    if (json.code !== undefined && json.code !== 0) {
      return this.fetchDetailFromHtml(page, ref);
    }
    const mapped = mapBossDetailResponse(json, ref.platformJobId);
    if (!mapped.jd) {
      const html = await this.fetchDetailFromHtml(page, ref);
      return {
        ...mapped,
        jd: html.jd ?? mapped.jd,
        companyName: mapped.companyName ?? html.companyName,
      };
    }
    return mapped;
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

    const fetched = await pageFetchJson(page, `${LIST_PATH}?${qs}`, {
      headers: {
        ...(token ? { Zp_token: token } : {}),
        Referer: HOST,
        Origin: "https://www.zhipin.com",
      },
      fallbackOrigin: "https://www.zhipin.com",
    });

    if (!fetched.error && fetched.httpStatus === 200 && fetched.body) {
      try {
        const payload = JSON.parse(fetched.body) as BossJobListApiResponse;
        if (payload.code === 0 || payload.zpData?.jobList) return payload;
        if (
          payload.code !== undefined &&
          payload.code !== 0 &&
          payload.code !== 31 &&
          payload.code !== 37
        ) {
          assertBossApiOk(payload);
        }
      } catch {
        // fallback
      }
    }

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
    const extracted = await safeEvaluate(page, () => {
      const jd =
        (
          document.querySelector(
            ".job-sec-text, .job-detail-section .text, [class*='job-sec']",
          ) as HTMLElement | null
        )?.innerText?.trim() ?? "";
      const companyCandidates = [
        (
          document.querySelector(
            ".company-info .name, .sider-company .company-name, .job-company .name a",
          ) as HTMLElement | null
        )?.innerText?.trim(),
        (
          document.querySelector(
            "[class*='company-name'], .company-name",
          ) as HTMLElement | null
        )?.innerText?.trim(),
      ].filter(Boolean) as string[];
      return { jd, companyCandidates };
    });
    return {
      platformJobId: ref.platformJobId,
      jd: extracted.jd || undefined,
      companyName: pickCompanyFullName(...extracted.companyCandidates),
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
