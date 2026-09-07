export type Platform = "boss" | "zhilian";

/** Collect aggressiveness preset. */
export type CollectSpeed = "safe" | "normal" | "fast";

export interface SearchFilters {
  /** Platform experience label, e.g. "1-3年" / "应届生" */
  experience?: string;
  /** Degree label, e.g. "本科" */
  degree?: string;
  /** Prefer jobs with salary_min >= this (CNY / month), best-effort filter */
  salaryMin?: number;
  /** Prefer jobs with salary_max <= this (CNY / month), best-effort filter */
  salaryMax?: number;
}

export interface SearchInput {
  platform: Platform;
  city: string;
  keyword: string;
  /** Max pages. Ignored when exhaust=true (uses platform hard cap). */
  pages?: number;
  /** Keep paging until empty or hard cap. */
  exhaust?: boolean;
  withDetail?: boolean;
  /** Only fetch detail for jobs missing JD. Implies withDetail. */
  onlyMissingDetail?: boolean;
  /** Skip jobs already in DB (by platform+jobId). Default true. */
  skipExisting?: boolean;
  /** Still upsert list fields even when skipping detail for existing jobs. */
  refreshExisting?: boolean;
  /** Base delay between pages (ms). Default from speed profile. */
  delayMs?: number;
  /** Extra random jitter 0..jitterMs. Default from speed profile. */
  jitterMs?: number;
  /** Delay between detail fetches (ms). */
  detailDelayMs?: number;
  /** Delay between keywords (ms). */
  keywordDelayMs?: number;
  /** safe | normal | fast — sets default delays / retries. */
  speed?: CollectSpeed;
  /** Stop after this many newly listed unique jobs (per keyword). */
  maxJobs?: number;
  /** Retry count for transient list/detail failures. */
  maxRetries?: number;
  /** Platform search filters (mapped to API where possible). */
  filters?: SearchFilters;
  /** Abort in-flight collect. */
  signal?: AbortSignal;
}

export interface CollectProgress {
  phase: "list" | "detail" | "done" | "error";
  platform: Platform;
  city: string;
  keyword: string;
  page?: number;
  maxPages?: number;
  listed?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  message: string;
  at: string;
}

export interface RawJobListItem {
  platform: Platform;
  platformJobId: string;
  title: string;
  city: string;
  location?: string;
  salaryRaw?: string;
  welfare?: string[];
  companyName: string;
  experience?: string;
  degree?: string;
  jobUrl?: string;
  detailContext?: Record<string, string>;
  raw?: unknown;
}

export interface RawJobDetail {
  platformJobId: string;
  jd?: string;
  welfare?: string[];
  restPolicy?: string;
  isDoubleOff?: boolean | null;
  location?: string;
  salaryRaw?: string;
  /** Prefer legal/full company name when detail exposes it. */
  companyName?: string;
  raw?: unknown;
}

export interface JobRecord {
  id: string;
  platform: Platform;
  platformJobId: string;
  title: string;
  city: string;
  location: string | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryMonths: number | null;
  welfare: string | null;
  restPolicy: string | null;
  isDoubleOff: number | null;
  jd: string | null;
  companyName: string;
  companyId: string | null;
  experience: string | null;
  degree: string | null;
  jobUrl: string | null;
  keyword: string | null;
  rawJson: string | null;
  collectedAt: string;
  updatedAt: string;
}

export interface AuthStatus {
  platform: Platform;
  ok: boolean;
  message: string;
}

export interface CompanyEnrichment {
  name: string;
  status?: string | null;
  socialInsuranceCount?: number | null;
  employeeCount?: number | null;
  registeredAt?: string | null;
  registeredCapital?: string | null;
  lawsuitsSummary?: string | null;
  provider?: string;
  raw?: unknown;
}

export interface JobListFilter {
  city?: string;
  keyword?: string;
  platform?: Platform;
  company?: string;
  salaryMin?: number;
  salaryMax?: number;
  hasJd?: boolean;
  limit?: number;
  offset?: number;
}
