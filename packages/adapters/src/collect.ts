import type { Platform, SearchInput } from "@bossjobs/core";
import { JobStore } from "@bossjobs/core";
import { BrowserManager } from "./browser.js";
import { BossAdapter } from "./boss/adapter.js";
import { ZhilianAdapter } from "./zhilian/adapter.js";
import type { PlatformAdapter } from "./types.js";

/** Apply automation stub — REQ-SCOPE-003 / REQ-DEFER-003 */
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
): PlatformAdapter {
  if (platform === "boss") return new BossAdapter({ browser });
  if (platform === "zhilian") return new ZhilianAdapter({ browser });
  throw new Error(`Unsupported platform: ${platform}`);
}

export interface CollectResult {
  platform: Platform;
  keyword: string;
  city: string;
  count: number;
  jobIds: string[];
}

/**
 * Orchestrate search → optional detail → upsert SQLite.
 */
export async function collectJobs(
  input: SearchInput & { keywords?: string[] },
  options: {
    browser?: BrowserManager;
    store?: JobStore;
    headless?: boolean;
  } = {},
): Promise<CollectResult[]> {
  const browser =
    options.browser ?? new BrowserManager({ headless: options.headless ?? false });
  const store = options.store ?? new JobStore();
  const ownsBrowser = !options.browser;
  const ownsStore = !options.store;
  const keywords = input.keywords?.length
    ? input.keywords
    : [input.keyword];
  const adapter = createAdapter(input.platform, browser);
  const out: CollectResult[] = [];

  try {
    for (const keyword of keywords) {
      const list = await adapter.search({
        city: input.city,
        keyword,
        pages: input.pages ?? 1,
      });
      const jobIds: string[] = [];
      for (const item of list) {
        let detail;
        if (input.withDetail) {
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
          if (detail.welfare?.length) {
            item.welfare = detail.welfare;
          }
        }
        const row = store.upsertFromListItem(item, keyword, {
          jd: detail?.jd,
          restPolicy: detail?.restPolicy,
          isDoubleOff: detail?.isDoubleOff,
        });
        jobIds.push(row.id);
      }
      out.push({
        platform: input.platform,
        keyword,
        city: input.city,
        count: jobIds.length,
        jobIds,
      });
    }
    return out;
  } finally {
    if (ownsStore) store.close();
    if (ownsBrowser) await browser.close();
  }
}
