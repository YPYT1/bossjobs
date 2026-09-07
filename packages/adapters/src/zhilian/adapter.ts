import type { AuthStatus, RawJobDetail, RawJobListItem } from "@bossjobs/core";
import type { Page } from "playwright";
import { BrowserManager } from "../browser.js";
import { captureJsonViaCdp } from "../capture.js";
import { resolveZhilianCityCode } from "../city-codes.js";
import { ensureHostPage, pageFetchJson } from "../page-api.js";
import type { JobRef, PlatformAdapter } from "../types.js";
import {
  extractZhilianList,
  isZhilianSearchUrl,
  mapZhilianListResponse,
  type ZhilianSearchApiResponse,
} from "./mapper.js";

/** From BossHunter zhilian.py API-fetch mode */
const API_SEARCH_URL = "https://fe-api.zhaopin.com/c/i/sou";
const API_PAGE_SIZE = 20;
const HOST = "https://www.zhaopin.com/";

export interface ZhilianAdapterOptions {
  browser?: BrowserManager;
  pageDelayMs?: number;
}

/**
 * Zhilian adapter — Path C: thin browser + fe-api.zhaopin.com/c/i/sou
 */
export class ZhilianAdapter implements PlatformAdapter {
  readonly platform = "zhilian" as const;
  private readonly browser: BrowserManager;
  private readonly pageDelayMs: number;

  constructor(options: ZhilianAdapterOptions = {}) {
    this.browser = options.browser ?? new BrowserManager();
    this.pageDelayMs = options.pageDelayMs ?? 1500;
  }

  async resolveCityCode(cityName: string): Promise<string> {
    return resolveZhilianCityCode(cityName);
  }

  async ensureAuth(): Promise<AuthStatus> {
    const page = await this.browser.newPage();
    try {
      const payload = await this.fetchSou(page, {
        city: "重庆",
        keyword: "工程师",
        page: 1,
      });
      const count = extractZhilianList(payload).length;
      return {
        platform: "zhilian",
        ok: count > 0,
        message:
          count > 0
            ? `sou API 可用，列表 ${count} 条`
            : "sou 无数据，请先登录智联求职者账号",
      };
    } catch (err) {
      return {
        platform: "zhilian",
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
    const pages = Math.min(Math.max(input.pages ?? 1, 1), 50);
    const page = await this.browser.newPage();
    const seen = new Set<string>();
    const results: RawJobListItem[] = [];

    try {
      for (let p = 1; p <= pages; p++) {
        const payload = await this.fetchSou(page, {
          city: input.city,
          keyword: input.keyword,
          page: p,
        });
        const mapped = mapZhilianListResponse(payload, input.city);
        if (mapped.length === 0 && p === 1) {
          throw new Error(
            "智联 sou 无列表。请 `bossjobs auth setup` 登录 zhaopin.com。",
          );
        }
        for (const item of mapped) {
          if (seen.has(item.platformJobId)) continue;
          seen.add(item.platformJobId);
          results.push(item);
        }
        if (mapped.length < API_PAGE_SIZE) break;
        if (p < pages) await page.waitForTimeout(this.pageDelayMs);
      }
      return results;
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async fetchDetail(ref: JobRef): Promise<RawJobDetail> {
    if (!ref.jobUrl) {
      return { platformJobId: ref.platformJobId };
    }
    const page = await this.browser.newPage();
    try {
      await page.goto(ref.jobUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForTimeout(1200);
      const jd = await page
        .locator(
          ".describtion__detail-content, .job-detail, [class*='description']",
        )
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

  private async fetchSou(
    page: Page,
    opts: { city: string; keyword: string; page: number },
  ): Promise<ZhilianSearchApiResponse> {
    await ensureHostPage(page, HOST);
    const cityId = resolveZhilianCityCode(opts.city);
    const start = (opts.page - 1) * API_PAGE_SIZE;
    const url =
      `${API_SEARCH_URL}?keyword=${encodeURIComponent(opts.keyword)}` +
      `&cityId=${cityId}&start=${start}&count=${API_PAGE_SIZE}`;

    const result = await pageFetchJson(page, url);
    if (!result.error && result.httpStatus === 200 && result.body) {
      try {
        const payload = JSON.parse(result.body) as ZhilianSearchApiResponse;
        if (extractZhilianList(payload).length > 0) return payload;
      } catch {
        // fallback
      }
    }

    const searchUrl = buildZhilianSearchUrl({
      cityCode: cityId,
      keyword: opts.keyword,
      page: opts.page,
    });
    try {
      const { data } = await captureJsonViaCdp<ZhilianSearchApiResponse>(
        page,
        (u) => isZhilianSearchUrl(u) || u.includes("/c/i/sou"),
        {
          timeoutMs: 30_000,
          navigate: async () => {
            await page.goto(searchUrl, {
              waitUntil: "domcontentloaded",
              timeout: 60_000,
            });
          },
        },
      );
      return data;
    } catch {
      if (result.error) throw new Error(`智联 sou 请求失败: ${result.error}`);
      if (result.httpStatus && result.httpStatus !== 200) {
        throw new Error(`智联 sou HTTP ${result.httpStatus}`);
      }
      try {
        return JSON.parse(result.body || "{}") as ZhilianSearchApiResponse;
      } catch {
        throw new Error("智联 sou 返回非 JSON（可能需登录或触发验证码）");
      }
    }
  }
}

export function buildZhilianSearchUrl(opts: {
  cityCode: string;
  keyword: string;
  page: number;
}): string {
  const kw = encodeURIComponent(opts.keyword);
  return `https://www.zhaopin.com/sou/jl${opts.cityCode}/kw${kw}/p${opts.page}`;
}
