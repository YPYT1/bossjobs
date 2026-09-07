import type {
  AuthStatus,
  Platform,
  RawJobDetail,
  RawJobListItem,
  SearchInput,
} from "@bossjobs/core";

export interface JobRef {
  platform: Platform;
  platformJobId: string;
  detailContext?: Record<string, string>;
  jobUrl?: string;
}

export interface SearchOpts {
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
}

export interface PlatformAdapter {
  readonly platform: Platform;
  ensureAuth(): Promise<AuthStatus>;
  search(input: SearchOpts): Promise<RawJobListItem[]>;
  fetchDetail(ref: JobRef): Promise<RawJobDetail>;
  resolveCityCode(cityName: string): Promise<string>;
}

// keep SearchInput import used for docs
export type { SearchInput };
