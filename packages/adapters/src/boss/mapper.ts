import type { RawJobListItem } from "@bossjobs/core";

/** Minimal shape of Boss joblist.json list item (fields may evolve). */
export interface BossJobListApiItem {
  encryptJobId?: string;
  jobId?: number | string;
  jobName?: string;
  cityName?: string;
  areaDistrict?: string;
  businessDistrict?: string;
  salaryDesc?: string;
  jobLabels?: string[];
  welfareList?: string[];
  brandName?: string;
  brandId?: number | string;
  skills?: string[];
  jobExperience?: string;
  jobDegree?: string;
  securityId?: string;
  lid?: string;
  [key: string]: unknown;
}

export interface BossJobListApiResponse {
  code?: number;
  message?: string;
  zpData?: {
    jobList?: BossJobListApiItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function isBossJobListUrl(url: string): boolean {
  return (
    url.includes("/wapi/zpgeek/search/joblist.json") ||
    url.includes("/wapi/zpgeek/search/joblist")
  );
}

export function assertBossApiOk(payload: BossJobListApiResponse): void {
  if (payload.code === 0 || payload.code === undefined) return;
  const msg = payload.message ?? `Boss API code=${payload.code}`;
  // Known risk-control codes from public scrapers
  if (payload.code === 31 || payload.code === 37) {
    throw new Error(`Boss 风控: ${msg} (code=${payload.code})`);
  }
  throw new Error(`Boss API 错误: ${msg} (code=${payload.code})`);
}

export function mapBossListItem(
  item: BossJobListApiItem,
  fallbackCity: string,
): RawJobListItem {
  const platformJobId = String(
    item.encryptJobId ?? item.jobId ?? "",
  );
  if (!platformJobId) {
    throw new Error("Boss list item missing job id");
  }

  const locationParts = [item.areaDistrict, item.businessDistrict].filter(
    Boolean,
  ) as string[];

  const welfare = [
    ...(item.welfareList ?? []),
    ...(item.jobLabels ?? []),
  ].filter(Boolean);

  return {
    platform: "boss",
    platformJobId,
    title: item.jobName ?? "",
    city: item.cityName ?? fallbackCity,
    location: locationParts.join("·") || undefined,
    salaryRaw: item.salaryDesc || undefined,
    welfare: welfare.length ? welfare : undefined,
    companyName: item.brandName ?? "未知公司",
    experience: item.jobExperience,
    degree: item.jobDegree,
    jobUrl: item.encryptJobId
      ? `https://www.zhipin.com/job_detail/${item.encryptJobId}.html`
      : undefined,
    detailContext: {
      ...(item.securityId ? { securityId: item.securityId } : {}),
      ...(item.lid ? { lid: item.lid } : {}),
    },
    raw: item,
  };
}

export function mapBossListResponse(
  payload: BossJobListApiResponse,
  fallbackCity: string,
): RawJobListItem[] {
  assertBossApiOk(payload);
  const list = payload.zpData?.jobList ?? [];
  return list
    .filter((item) => item.encryptJobId || item.jobId)
    .map((item) => mapBossListItem(item, fallbackCity));
}
