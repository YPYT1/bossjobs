import type { RawJobDetail, RawJobListItem } from "@bossjobs/core";
import { parseRestPolicy } from "@bossjobs/core";
import { pickCompanyFullName } from "../company-name.js";

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
  /** Legal / full company name when present on list payload. */
  companyFullName?: string;
  brandComName?: string;
  comName?: string;
  companyName?: string;
  brandId?: number | string;
  skills?: string[];
  jobExperience?: string;
  jobDegree?: string;
  securityId?: string;
  lid?: string;
  brandComInfo?: BossBrandComInfo;
  [key: string]: unknown;
}

export interface BossBrandComInfo {
  brandName?: string;
  companyName?: string;
  companyFullName?: string;
  comName?: string;
  brandComName?: string;
  [key: string]: unknown;
}

export interface BossJobDetailApiResponse {
  code?: number;
  message?: string;
  zpData?: {
    jobInfo?: {
      postDescription?: string;
      salaryDesc?: string;
      address?: string;
      jobLabels?: string[];
      welfareList?: string[];
    };
    brandComInfo?: BossBrandComInfo;
    [key: string]: unknown;
  };
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

  const companyName =
    pickCompanyFullName(
      item.companyFullName,
      item.brandComName,
      item.comName,
      item.companyName,
      item.brandComInfo?.companyFullName,
      item.brandComInfo?.companyName,
      item.brandComInfo?.comName,
      item.brandComInfo?.brandComName,
      item.brandComInfo?.brandName,
      item.brandName,
    ) ?? "未知公司";

  return {
    platform: "boss",
    platformJobId,
    title: item.jobName ?? "",
    city: item.cityName ?? fallbackCity,
    location: locationParts.join("·") || undefined,
    salaryRaw: item.salaryDesc || undefined,
    welfare: welfare.length ? welfare : undefined,
    companyName,
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

/** Map Boss detail.json → fields including company 全称 when available. */
export function mapBossDetailResponse(
  payload: BossJobDetailApiResponse,
  platformJobId: string,
): RawJobDetail {
  const info = payload.zpData?.jobInfo;
  const brand = payload.zpData?.brandComInfo;
  const welfare = [
    ...(info?.welfareList ?? []),
    ...(info?.jobLabels ?? []),
  ].filter(Boolean);
  const jd = info?.postDescription;
  const fromJd = parseRestPolicy(jd);
  const fromTags = parseRestPolicy(welfare.join(" "));
  return {
    platformJobId,
    jd: jd?.trim() || undefined,
    salaryRaw: info?.salaryDesc || undefined,
    location: info?.address,
    welfare: welfare.length ? welfare : undefined,
    companyName: pickCompanyFullName(
      brand?.companyFullName,
      brand?.companyName,
      brand?.comName,
      brand?.brandComName,
      brand?.brandName,
    ),
    restPolicy: fromJd.restPolicy ?? fromTags.restPolicy ?? undefined,
    isDoubleOff: fromJd.isDoubleOff ?? fromTags.isDoubleOff,
    raw: payload.zpData,
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
