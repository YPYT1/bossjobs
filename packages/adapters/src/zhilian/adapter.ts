import type { AuthStatus, RawJobDetail, RawJobListItem } from "@bossjobs/core";
import type { Page, Response } from "playwright";
import { BrowserManager } from "../browser.js";
import { resolveZhilianCityCode } from "../city-codes.js";
import type { JobRef, PlatformAdapter } from "../types.js";
import {
  extractZhilianList,
  isZhilianSearchUrl,
  mapZhilianListResponse,
  type ZhilianSearchApiResponse,
} from "./mapper.js";

export interface ZhilianAdapterOptions {
  browser?: BrowserManager;
  pageDelayMs?: number;
}

/**
 * Zhilian adapter: capture search JSON from real pages.
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
      const payload = await captureZhilianSearch(page, {
        cityCode: resolveZhilianCityCode("重庆"),
        keyword: "测试",
        page: 1,
      });
      const count = extractZhilianList(payload).length;
      return {
        platform: "zhilian",
        ok: count > 0 || payload != null,
        message:
          count > 0
            ? `探测到搜索接口，列表 ${count} 条`
            : "已打开智联搜索页，但未解析到列表（可能需登录或接口变更）",
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
    const cityCode = resolveZhilianCityCode(input.city);
    const pages = Math.min(Math.max(input.pages ?? 1, 1), 10);
    const page = await this.browser.newPage();
    const seen = new Set<string>();
    const results: RawJobListItem[] = [];

    try {
      for (let p = 1; p <= pages; p++) {
        const payload = await captureZhilianSearch(page, {
          cityCode,
          keyword: input.keyword,
          page: p,
        });
        const mapped = mapZhilianListResponse(payload, input.city);
        for (const item of mapped) {
          if (seen.has(item.platformJobId)) continue;
          seen.add(item.platformJobId);
          results.push(item);
        }
        if (mapped.length === 0 && p === 1) {
          throw new Error(
            "智联搜索接口未返回列表。请先 bossjobs auth setup 登录，或更新 Adapter URL 匹配规则。",
          );
        }
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
      await page.waitForTimeout(1500);
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
}

export function buildZhilianSearchUrl(opts: {
  cityCode: string;
  keyword: string;
  page: number;
}): string {
  const kw = encodeURIComponent(opts.keyword);
  // Public search URL; page triggers XHR that we capture.
  return `https://www.zhaopin.com/sou/jl${opts.cityCode}/kw${kw}/p${opts.page}`;
}

async function captureZhilianSearch(
  page: Page,
  opts: { cityCode: string; keyword: string; page: number },
): Promise<ZhilianSearchApiResponse> {
  const captured: ZhilianSearchApiResponse[] = [];

  const onResponse = async (res: Response) => {
    try {
      if (!isZhilianSearchUrl(res.url())) return;
      if (res.status() !== 200) return;
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("json") && !ct.includes("javascript")) return;
      const json = (await res.json()) as ZhilianSearchApiResponse;
      if (extractZhilianList(json).length > 0 || json.data || json.results) {
        captured.push(json);
      }
    } catch {
      // ignore non-json
    }
  };

  page.on("response", onResponse);
  try {
    const url = buildZhilianSearchUrl(opts);
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2000);

    if (captured.length === 0) {
      // Fallback: wait explicitly once more
      try {
        const res = await page.waitForResponse(
          (r) => isZhilianSearchUrl(r.url()) && r.status() === 200,
          { timeout: 15_000 },
        );
        return (await res.json()) as ZhilianSearchApiResponse;
      } catch {
        return {};
      }
    }
    // Prefer payload with the most items
    captured.sort(
      (a, b) => extractZhilianList(b).length - extractZhilianList(a).length,
    );
    return captured[0]!;
  } finally {
    page.off("response", onResponse);
  }
}
