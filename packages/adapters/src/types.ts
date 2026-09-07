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

export interface PlatformAdapter {
  readonly platform: Platform;
  ensureAuth(): Promise<AuthStatus>;
  search(input: Omit<SearchInput, "platform">): Promise<RawJobListItem[]>;
  fetchDetail(ref: JobRef): Promise<RawJobDetail>;
  resolveCityCode(cityName: string): Promise<string>;
}
