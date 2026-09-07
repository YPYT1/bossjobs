import type { Page } from "playwright";

export interface PageFetchResult {
  httpStatus: number;
  body: string;
  error?: string;
}

/**
 * Call an official API from inside the browser page (credentials + cookies).
 * Path C: thin browser session + official interface.
 */
export async function pageFetchJson(
  page: Page,
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<PageFetchResult> {
  return page.evaluate(
    async ({ url, method, headers, body }) => {
      try {
        const resp = await fetch(url, {
          method: method ?? "GET",
          headers: {
            Accept: "application/json, text/plain, */*",
            ...(headers ?? {}),
          },
          credentials: "include",
          body,
        });
        const text = await resp.text();
        return { httpStatus: resp.status, body: text };
      } catch (e) {
        return {
          httpStatus: 0,
          body: "",
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    {
      url,
      method: init?.method,
      headers: init?.headers,
      body: init?.body,
    },
  );
}

/** Read bst cookie for Boss Zp_token header (from boss-helper). */
export async function readBossZpToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const part = document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("bst="));
    if (!part) return null;
    try {
      return decodeURIComponent(part.slice(4));
    } catch {
      return part.slice(4);
    }
  });
}

export async function ensureHostPage(
  page: Page,
  originUrl: string,
): Promise<void> {
  const current = page.url();
  if (current.startsWith(originUrl) || current.includes(new URL(originUrl).host)) {
    return;
  }
  await page.goto(originUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(800);
}
