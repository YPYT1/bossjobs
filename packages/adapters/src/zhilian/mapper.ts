import type { RawJobListItem } from "@bossjobs/core";
import { pickCompanyFullName } from "../company-name.js";

/** Zhilian search API item — fields vary by endpoint generation. */
export interface ZhilianJobApiItem {
  number?: string;
  positionURL?: string;
  jobId?: string | number;
  name?: string;
  jobName?: string;
  title?: string;
  salary?: string;
  salary60?: string;
  salaryCount?: string;
  city?: { display?: string; name?: string } | string;
  cityName?: string;
  workingExp?: string | { name?: string };
  education?: string | { name?: string };
  company?: {
    name?: string;
    fullName?: string;
    companyName?: string;
    companyFullName?: string;
  };
  companyName?: string;
  companyNameFormat?: string;
  companyFullName?: string;
  jobSummary?: string;
  welfareTagList?: Array<string | { name?: string }>;
  jobTypeLevelName?: string;
  [key: string]: unknown;
}

export interface ZhilianSearchApiResponse {
  code?: number | string;
  status?: string | number;
  message?: string;
  data?: {
    list?: ZhilianJobApiItem[];
    results?: ZhilianJobApiItem[];
    [key: string]: unknown;
  };
  dataList?: ZhilianJobApiItem[];
  results?: ZhilianJobApiItem[];
  [key: string]: unknown;
}

export function isZhilianSearchUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("zhaopin.com") &&
    (u.includes("/c/i/sou") ||
      u.includes("searchposition") ||
      u.includes("searchpositions") ||
      u.includes("/search/") ||
      u.includes("positionbusiness"))
  );
}

export function extractZhilianList(
  payload: ZhilianSearchApiResponse,
): ZhilianJobApiItem[] {
  if (Array.isArray(payload.data?.list)) return payload.data!.list!;
  if (Array.isArray(payload.data?.results)) return payload.data!.results!;
  if (Array.isArray(payload.dataList)) return payload.dataList;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

export function mapZhilianListItem(
  item: ZhilianJobApiItem,
  fallbackCity: string,
): RawJobListItem | null {
  const platformJobId = String(
    item.number ?? item.jobId ?? extractIdFromUrl(item.positionURL) ?? "",
  );
  if (!platformJobId) return null;

  const title = item.name ?? item.jobName ?? item.title ?? "";
  const companyName =
    pickCompanyFullName(
      item.companyFullName,
      item.company?.companyFullName,
      item.company?.fullName,
      item.company?.companyName,
      item.companyName,
      item.companyNameFormat,
      item.company?.name,
    ) ?? "未知公司";

  const city =
    (typeof item.city === "string"
      ? item.city
      : item.city?.display ?? item.city?.name) ??
    item.cityName ??
    fallbackCity;

  const salaryRaw = item.salary60 ?? item.salary ?? undefined;
  const welfare = (item.welfareTagList ?? [])
    .map((w) => (typeof w === "string" ? w : w.name))
    .filter((x): x is string => Boolean(x));

  const experience =
    typeof item.workingExp === "string"
      ? item.workingExp
      : item.workingExp?.name;
  const degree =
    typeof item.education === "string" ? item.education : item.education?.name;

  return {
    platform: "zhilian",
    platformJobId,
    title,
    city,
    salaryRaw,
    welfare: welfare.length ? welfare : undefined,
    companyName,
    experience,
    degree,
    jobUrl: item.positionURL,
    raw: item,
  };
}

export function mapZhilianListResponse(
  payload: ZhilianSearchApiResponse,
  fallbackCity: string,
): RawJobListItem[] {
  return extractZhilianList(payload)
    .map((item) => mapZhilianListItem(item, fallbackCity))
    .filter((x): x is RawJobListItem => x != null);
}

function extractIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/\/jobs?\/([^/?#]+)/i) ?? url.match(/CC\d+J\d+/i);
  return m?.[1] ?? m?.[0];
}
