import type { Page, Response } from "playwright";

/**
 * Capture JSON bodies via CDP Network.getResponseBody.
 * More reliable than Playwright response.json() when the page navigates quickly.
 */
export async function captureJsonViaCdp<T = unknown>(
  page: Page,
  matchUrl: (url: string) => boolean,
  options: { timeoutMs?: number; navigate: () => Promise<void> },
): Promise<{ url: string; data: T }> {
  const timeoutMs = options.timeoutMs ?? 45_000;
  const client = await page.context().newCDPSession(page);
  await client.send("Network.enable");

  const pending = new Map<string, string>();
  let resolved: { url: string; data: T } | null = null;

  const onResponseReceived = (event: {
    requestId: string;
    response: { url: string; status: number; mimeType?: string };
  }) => {
    const { requestId, response } = event;
    if (response.status !== 200) return;
    if (!matchUrl(response.url)) return;
    pending.set(requestId, response.url);
  };

  const onLoadingFinished = async (event: { requestId: string }) => {
    const url = pending.get(event.requestId);
    if (!url || resolved) return;
    try {
      const result = (await client.send("Network.getResponseBody", {
        requestId: event.requestId,
      })) as { body: string; base64Encoded: boolean };
      const text = result.base64Encoded
        ? Buffer.from(result.body, "base64").toString("utf8")
        : result.body;
      resolved = { url, data: JSON.parse(text) as T };
    } catch {
      // body may be unavailable for some requests; wait for another match
    } finally {
      pending.delete(event.requestId);
    }
  };

  client.on("Network.responseReceived", onResponseReceived);
  client.on("Network.loadingFinished", onLoadingFinished);

  try {
    await options.navigate();
    const deadline = Date.now() + timeoutMs;
    while (!resolved && Date.now() < deadline) {
      await page.waitForTimeout(150);
    }
    if (!resolved) {
      throw new Error(
        `CDP 超时未捕获匹配接口（${timeoutMs}ms）。请确认登录态或 URL 匹配规则。`,
      );
    }
    return resolved;
  } finally {
    client.off("Network.responseReceived", onResponseReceived);
    client.off("Network.loadingFinished", onLoadingFinished);
    await client.detach().catch(() => undefined);
  }
}

/** Fallback: Playwright response listener that reads body immediately. */
export async function captureJsonViaPlaywright<T = unknown>(
  page: Page,
  matchUrl: (url: string) => boolean,
  options: { timeoutMs?: number; navigate: () => Promise<void> },
): Promise<{ url: string; data: T }> {
  const timeoutMs = options.timeoutMs ?? 45_000;
  let resolved: { url: string; data: T } | null = null;

  const onResponse = async (res: Response) => {
    if (resolved) return;
    if (res.status() !== 200 || !matchUrl(res.url())) return;
    try {
      const data = (await res.json()) as T;
      resolved = { url: res.url(), data };
    } catch {
      // ignore
    }
  };

  page.on("response", onResponse);
  try {
    await options.navigate();
    const deadline = Date.now() + timeoutMs;
    while (!resolved && Date.now() < deadline) {
      await page.waitForTimeout(150);
    }
    if (!resolved) {
      throw new Error("Playwright 超时未捕获匹配 JSON 响应");
    }
    return resolved;
  } finally {
    page.off("response", onResponse);
  }
}
