import type { Page } from "playwright";

export type CollectSpeed = "safe" | "normal" | "fast";

export interface SpeedProfile {
  pageDelayMs: number;
  jitterMs: number;
  detailDelayMs: number;
  keywordDelayMs: number;
  maxRetries: number;
}

/** Presets tuned for personal scraping (avoid aggressive defaults). */
export const SPEED_PROFILES: Record<CollectSpeed, SpeedProfile> = {
  safe: {
    pageDelayMs: 6500,
    jitterMs: 4500,
    detailDelayMs: 4000,
    keywordDelayMs: 8000,
    maxRetries: 3,
  },
  normal: {
    pageDelayMs: 4500,
    jitterMs: 3500,
    detailDelayMs: 2800,
    keywordDelayMs: 5000,
    maxRetries: 2,
  },
  fast: {
    pageDelayMs: 2800,
    jitterMs: 1800,
    detailDelayMs: 1600,
    keywordDelayMs: 3000,
    maxRetries: 1,
  },
};

export function resolveSpeedProfile(
  speed?: CollectSpeed,
  overrides?: Partial<SpeedProfile>,
): SpeedProfile {
  const base = SPEED_PROFILES[speed ?? "normal"];
  return { ...base, ...overrides };
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/** Uniform random integer in [min, max] inclusive. */
export function randInt(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** Base delay + random jitter in [0, jitterMs]. */
export function computeJitteredMs(baseMs: number, jitterMs: number): number {
  return Math.max(0, baseMs) + Math.floor(Math.random() * Math.max(0, jitterMs));
}

/** Slow delay with random jitter to reduce风控. */
export async function politeDelay(
  page: Page | null,
  baseMs: number,
  jitterMs: number,
): Promise<number> {
  const wait = computeJitteredMs(baseMs, jitterMs);
  if (page) await page.waitForTimeout(wait);
  else await sleep(wait);
  return wait;
}

/**
 * Exponential backoff with full jitter.
 * attempt is 1-based; wait = random(0, min(cap, base * 2^(attempt-1)))
 */
export function computeBackoffMs(
  attempt: number,
  baseMs = 1200,
  capMs = 20_000,
): number {
  const exp = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(Math.random() * Math.max(1, exp));
}

export interface RetryOptions {
  maxRetries?: number;
  baseMs?: number;
  capMs?: number;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, waitMs: number) => void | Promise<void>;
  signal?: AbortSignal;
}

export function isRetryableCollectError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/风控|code=31|code=37|CAPTCHA|验证码|人机/i.test(msg)) return false;
  if (/Unsupported platform|missing job id|NO_KEYWORD/i.test(msg)) return false;
  if (/timeout|ETIMEDOUT|ECONNRESET|net::|HTTP 5|HTTP 429|空列表|无列表|失败/i.test(msg)) {
    return true;
  }
  return true;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    if (options.signal?.aborted) {
      throw new Error("采集已取消");
    }
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const canRetry =
        attempt <= maxRetries &&
        (options.shouldRetry ?? isRetryableCollectError)(err, attempt);
      if (!canRetry) throw err;
      const waitMs = computeBackoffMs(
        attempt,
        options.baseMs ?? 1200,
        options.capMs ?? 20_000,
      );
      await options.onRetry?.(err, attempt, waitMs);
      await sleep(waitMs);
    }
  }
  throw lastErr;
}

/** Light page activity between API calls (scroll + tiny wait). */
export async function humanPause(page: Page | null): Promise<void> {
  if (!page) {
    await sleep(randInt(200, 800));
    return;
  }
  try {
    await page.mouse.wheel(0, randInt(120, 480));
  } catch {
    // ignore
  }
  await page.waitForTimeout(randInt(250, 900));
}

export const BOSS_HARD_MAX_PAGES = 30;
export const ZHILIAN_HARD_MAX_PAGES = 50;
