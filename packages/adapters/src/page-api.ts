import type { Page } from "playwright";

export interface PageFetchResult {
  httpStatus: number;
  body: string;
  error?: string;
}

function toAbsoluteUrl(page: Page, url: string, fallbackOrigin?: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  try {
    const base = page.url();
    if (/^https?:\/\//i.test(base)) return new URL(url, base).toString();
  } catch {
    // fall through
  }
  if (fallbackOrigin) return new URL(url, fallbackOrigin).toString();
  return url;
}

/**
 * Call official APIs using Playwright's request context (shares Cookie jar).
 * Avoids page.evaluate — which breaks on about:blank / mid-navigation
 * (SecurityError / "Execution context was destroyed").
 */
export async function pageFetchJson(
  page: Page,
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    fallbackOrigin?: string;
  },
): Promise<PageFetchResult> {
  const absolute = toAbsoluteUrl(page, url, init?.fallbackOrigin);
  if (!/^https?:\/\//i.test(absolute)) {
    return {
      httpStatus: 0,
      body: "",
      error: `无法解析请求 URL（页面仍是 ${page.url() || "about:blank"}）: ${url}`,
    };
  }

  try {
    const resp = await page.request.fetch(absolute, {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        ...(init?.headers ?? {}),
      },
      data: init?.body,
      timeout: 60_000,
      failOnStatusCode: false,
      maxRedirects: 5,
    });
    return {
      httpStatus: resp.status(),
      body: await resp.text(),
    };
  } catch (e) {
    return {
      httpStatus: 0,
      body: "",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Read Boss `bst` cookie as Zp_token from the Cookie jar (no DOM access).
 */
export async function readBossZpToken(page: Page): Promise<string | null> {
  try {
    const cookies = await page.context().cookies([
      "https://www.zhipin.com",
      "https://zhipin.com",
    ]);
    const bst = cookies.find((c) => c.name === "bst");
    if (!bst?.value) return null;
    try {
      return decodeURIComponent(bst.value);
    } catch {
      return bst.value;
    }
  } catch {
    return null;
  }
}

/** True when the main frame is a normal http(s) page. */
export function isUsablePageUrl(url: string): boolean {
  return (
    /^https?:\/\//i.test(url) &&
    !/chrome-error:|chrome:|devtools:/i.test(url)
  );
}

/**
 * Navigate to host so the session is warm / redirects settle.
 * Soft-fail: Cookie jar API calls can still work even if UI stays blank.
 */
export async function ensureHostPage(
  page: Page,
  originUrl: string,
): Promise<void> {
  const host = new URL(originUrl).host;
  const current = page.url();
  if (isUsablePageUrl(current) && current.includes(host)) {
    return;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(originUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      // Let soft redirects finish without racing evaluate.
      await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(
        () => undefined,
      );
      await page.waitForTimeout(400 + attempt * 200);
      const after = page.url();
      if (isUsablePageUrl(after) && after.includes(host)) return;
      lastError = new Error(`导航后仍在 ${after || "about:blank"}`);
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(800 * attempt);
    }
  }

  // Soft warn only — pageFetchJson uses request context + cookies.
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(
    `[bossjobs] ensureHostPage: 未能稳定打开 ${host}（${msg}）。将继续用 Cookie 直请求接口。`,
  );
}

export async function assertUsableDocument(page: Page): Promise<void> {
  const url = page.url();
  if (!isUsablePageUrl(url)) {
    throw new Error(
      `页面未就绪（当前 ${url || "about:blank"}）。请先 bossjobs auth setup 登录招聘站。`,
    );
  }
}

/** Safe evaluate with one retry after navigation settles. */
export async function safeEvaluate<T>(
  page: Page,
  fn: () => T | Promise<T>,
): Promise<T> {
  try {
    return await page.evaluate(fn);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/Execution context was destroyed|Target closed|navigation/i.test(msg)) {
      throw err;
    }
    await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(
      () => undefined,
    );
    await page.waitForTimeout(500);
    return page.evaluate(fn);
  }
}
