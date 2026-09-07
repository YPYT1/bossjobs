import type { JobRecord, Platform } from "./types.js";
import type { JobStore } from "./store.js";

export interface CityCountRow {
  city: string;
  count: number;
}

export interface CitySalaryRow {
  city: string;
  count: number;
  medianMin: number | null;
  medianMax: number | null;
  avgMin: number | null;
  avgMax: number | null;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function analyzeCityCounts(
  jobs: JobRecord[],
  keyword?: string,
): CityCountRow[] {
  const filtered = keyword
    ? jobs.filter(
        (j) =>
          (j.keyword && j.keyword.includes(keyword)) ||
          j.title.includes(keyword),
      )
    : jobs;
  const map = new Map<string, number>();
  for (const j of filtered) {
    map.set(j.city, (map.get(j.city) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);
}

export function analyzeCitySalary(
  jobs: JobRecord[],
  keyword?: string,
): CitySalaryRow[] {
  const filtered = keyword
    ? jobs.filter(
        (j) =>
          (j.keyword && j.keyword.includes(keyword)) ||
          j.title.includes(keyword),
      )
    : jobs;
  const byCity = new Map<string, JobRecord[]>();
  for (const j of filtered) {
    const arr = byCity.get(j.city) ?? [];
    arr.push(j);
    byCity.set(j.city, arr);
  }
  const rows: CitySalaryRow[] = [];
  for (const [city, list] of byCity) {
    const mins = list
      .map((j) => j.salaryMin)
      .filter((n): n is number => n != null);
    const maxs = list
      .map((j) => j.salaryMax)
      .filter((n): n is number => n != null);
    rows.push({
      city,
      count: list.length,
      medianMin: median(mins),
      medianMax: median(maxs),
      avgMin: mins.length
        ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
        : null,
      avgMax: maxs.length
        ? Math.round(maxs.reduce((a, b) => a + b, 0) / maxs.length)
        : null,
    });
  }
  return rows.sort((a, b) => b.count - a.count);
}

export function analyzeFromStore(
  store: JobStore,
  opts: { keyword?: string; platform?: Platform; limit?: number } = {},
) {
  const jobs = store.list({
    keyword: opts.keyword,
    platform: opts.platform,
    limit: opts.limit ?? 5000,
  });
  return {
    total: jobs.length,
    byCity: analyzeCityCounts(jobs, opts.keyword),
    salaryByCity: analyzeCitySalary(jobs, opts.keyword),
  };
}
