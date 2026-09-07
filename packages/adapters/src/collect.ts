import type {
  CollectProgress,
  Platform,
  SearchInput,
} from "@bossjobs/core";
import { JobStore } from "@bossjobs/core";
import { BrowserManager } from "./browser.js";
import { BossAdapter } from "./boss/adapter.js";
import { ZhilianAdapter } from "./zhilian/adapter.js";
import { politeDelay, sleep } from "./rate-limit.js";
import type { PlatformAdapter } from "./types.js";

export interface ApplyPort {
  apply(): Promise<never>;
}

export class ApplyNotImplemented implements ApplyPort {
  async apply(): Promise<never> {
    throw new Error("投递自动化一期未实现（REQ-DEFER-003），仅预留接口");
  }
}

export function createAdapter(
  platform: Platform,
  browser?: BrowserManager,
  delays?: { pageDelayMs?: number; jitterMs?: number },
): PlatformAdapter {
  if (platform === "boss")
    return new BossAdapter({
      browser,
      pageDelayMs: delays?.pageDelayMs,
      jitterMs: delays?.jitterMs,
    });
  if (platform === "zhilian")
    return new ZhilianAdapter({
      browser,
      pageDelayMs: delays?.pageDelayMs,
      jitterMs: delays?.jitterMs,
    });
  throw new Error(`Unsupported platform: ${platform}`);
}

export interface CollectResult {
  platform: Platform;
  keyword: string;
  city: string;
  listed: number;
  inserted: number;
  updated: number;
  skipped: number;
  jobIds: string[];
}

export type ProgressHandler = (p: CollectProgress) => void | Promise<void>;

/**
 * Full slow collect: exhaust pages, skip duplicates, optional detail, progress.
 */
export async function collectJobs(
  input: SearchInput & { keywords?: string[] },
  options: {
    browser?: BrowserManager;
    store?: JobStore;
    headless?: boolean;
    onProgress?: ProgressHandler;
    taskId?: string;
  } = {},
): Promise<CollectResult[]> {
  const browser =
    options.browser ??
    new BrowserManager({ headless: options.headless ?? false });
  const store = options.store ?? new JobStore();
  const ownsBrowser = !options.browser;
  const ownsStore = !options.store;
  const keywords = input.keywords?.length ? input.keywords : [input.keyword];
  const skipExisting = input.skipExisting !== false;
  /** JD / 公司全称依赖详情；默认始终抓详情。 */
  const withDetail = input.withDetail !== false;
  const delayMs = input.delayMs ?? 4500;
  const jitterMs = input.jitterMs ?? 3500;
  const detailDelayMs = input.detailDelayMs ?? 2800;
  const adapter = createAdapter(input.platform, browser, {
    pageDelayMs: delayMs,
    jitterMs,
  });
  const out: CollectResult[] = [];

  const emit = async (partial: Omit<CollectProgress, "at">) => {
    const progress: CollectProgress = {
      ...partial,
      at: new Date().toISOString(),
    };
    await options.onProgress?.(progress);
    if (options.taskId) {
      store.updateTask(options.taskId, {
        status: partial.phase === "error" ? "failed" : "running",
        progress,
      });
    }
  };

  try {
    if (options.taskId) {
      store.updateTask(options.taskId, { status: "running" });
    }

    for (const keyword of keywords) {
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const jobIds: string[] = [];

      await emit({
        phase: "list",
        platform: input.platform,
        city: input.city,
        keyword,
        message: `开始列表采集：${input.city} · ${keyword}`,
      });

      const list = await adapter.search({
        city: input.city,
        keyword,
        pages: input.pages ?? 1,
        exhaust: input.exhaust,
        delayMs,
        jitterMs,
        onPage: async (info) => {
          await emit({
            phase: "list",
            platform: input.platform,
            city: input.city,
            keyword,
            page: info.page,
            maxPages: info.maxPages,
            listed: info.total,
            inserted,
            updated,
            skipped,
            message: `列表第 ${info.page}/${info.maxPages} 页，本页新 ${info.batch}，累计 ${info.total}`,
          });
        },
      });

      for (const item of list) {
        const exists = store.hasJob(item.platform, item.platformJobId);
        if (skipExisting && exists) {
          const old = store.getByPlatformId(item.platform, item.platformJobId);
          if (old?.jd) {
            skipped++;
            continue;
          }
        }

        let detail;
        if (withDetail) {
          await emit({
            phase: "detail",
            platform: input.platform,
            city: input.city,
            keyword,
            listed: list.length,
            inserted,
            updated,
            skipped,
            message: `抓详情：${item.title}`,
          });
          try {
            detail = await adapter.fetchDetail({
              platform: input.platform,
              platformJobId: item.platformJobId,
              detailContext: item.detailContext,
              jobUrl: item.jobUrl,
            });
            if (detail.salaryRaw && !item.salaryRaw) {
              item.salaryRaw = detail.salaryRaw;
            }
            if (detail.location && !item.location) {
              item.location = detail.location;
            }
            if (detail.welfare?.length) item.welfare = detail.welfare;
            if (detail.companyName) {
              item.companyName = detail.companyName;
            }
          } catch (err) {
            await emit({
              phase: "detail",
              platform: input.platform,
              city: input.city,
              keyword,
              message: `详情失败（跳过）：${err instanceof Error ? err.message : String(err)}`,
            });
          }
          await sleep(detailDelayMs + Math.floor(Math.random() * 1500));
        }

        const { record, created } = store.upsertFromListItem(item, keyword, {
          jd: detail?.jd,
          restPolicy: detail?.restPolicy,
          isDoubleOff: detail?.isDoubleOff,
        });
        jobIds.push(record.id);
        if (created) inserted++;
        else updated++;
      }

      out.push({
        platform: input.platform,
        keyword,
        city: input.city,
        listed: list.length,
        inserted,
        updated,
        skipped,
        jobIds,
      });
    }

    await emit({
      phase: "done",
      platform: input.platform,
      city: input.city,
      keyword: keywords.join(","),
      message: "采集完成",
      inserted: out.reduce((a, r) => a + r.inserted, 0),
      updated: out.reduce((a, r) => a + r.updated, 0),
      skipped: out.reduce((a, r) => a + r.skipped, 0),
      listed: out.reduce((a, r) => a + r.listed, 0),
    });

    if (options.taskId) {
      store.updateTask(options.taskId, {
        status: "done",
        finished: true,
        progress: out,
      });
    }

    return out;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await emit({
      phase: "error",
      platform: input.platform,
      city: input.city,
      keyword: keywords.join(","),
      message,
    });
    if (options.taskId) {
      store.updateTask(options.taskId, {
        status: "failed",
        error: message,
        finished: true,
      });
    }
    throw err;
  } finally {
    if (ownsStore) store.close();
    if (ownsBrowser) await browser.close();
  }
}

// re-export for callers that import sleep from collect
export { sleep, politeDelay };
