import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDbPath } from "./paths.js";
import type { JobRecord, Platform, RawJobListItem } from "./types.js";
import { parseRestPolicy, parseSalary } from "./salary.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  platform_job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  location TEXT,
  salary_raw TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_months INTEGER,
  welfare TEXT,
  rest_policy TEXT,
  is_double_off INTEGER,
  jd TEXT,
  company_name TEXT NOT NULL,
  company_id TEXT,
  experience TEXT,
  degree TEXT,
  job_url TEXT,
  keyword TEXT,
  raw_json TEXT,
  collected_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(platform, platform_job_id)
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT,
  social_insurance_count INTEGER,
  employee_count INTEGER,
  registered_at TEXT,
  registered_capital TEXT,
  lawsuits_summary TEXT,
  provider TEXT,
  raw_json TEXT,
  enriched_at TEXT
);

CREATE TABLE IF NOT EXISTS collect_tasks (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  city TEXT NOT NULL,
  keyword TEXT NOT NULL,
  pages INTEGER NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT
);
`;

export class JobStore {
  readonly db: DatabaseSync;

  constructor(dbPath = getDbPath()) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(SCHEMA);
  }

  close(): void {
    this.db.close();
  }

  upsertFromListItem(
    item: RawJobListItem,
    keyword: string,
    detail?: { jd?: string; restPolicy?: string; isDoubleOff?: boolean | null },
  ): JobRecord {
    const now = new Date().toISOString();
    const salary = parseSalary(item.salaryRaw);
    const rest =
      detail?.restPolicy != null || detail?.isDoubleOff != null
        ? {
            restPolicy: detail.restPolicy ?? null,
            isDoubleOff: detail.isDoubleOff ?? null,
          }
        : parseRestPolicy(detail?.jd);

    const existing = this.db
      .prepare(
        `SELECT id, collected_at FROM jobs WHERE platform = ? AND platform_job_id = ?`,
      )
      .get(item.platform, item.platformJobId) as
      | { id: string; collected_at: string }
      | undefined;

    const id = existing?.id ?? randomUUID();
    const collectedAt = existing?.collected_at ?? now;

    this.db
      .prepare(
        `
      INSERT INTO jobs (
        id, platform, platform_job_id, title, city, location,
        salary_raw, salary_min, salary_max, salary_months,
        welfare, rest_policy, is_double_off, jd, company_name,
        company_id, experience, degree, job_url, keyword, raw_json,
        collected_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        NULL, ?, ?, ?, ?, ?,
        ?, ?
      )
      ON CONFLICT(platform, platform_job_id) DO UPDATE SET
        title = excluded.title,
        city = excluded.city,
        location = COALESCE(excluded.location, jobs.location),
        salary_raw = COALESCE(excluded.salary_raw, jobs.salary_raw),
        salary_min = COALESCE(excluded.salary_min, jobs.salary_min),
        salary_max = COALESCE(excluded.salary_max, jobs.salary_max),
        salary_months = COALESCE(excluded.salary_months, jobs.salary_months),
        welfare = COALESCE(excluded.welfare, jobs.welfare),
        rest_policy = COALESCE(excluded.rest_policy, jobs.rest_policy),
        is_double_off = COALESCE(excluded.is_double_off, jobs.is_double_off),
        jd = COALESCE(excluded.jd, jobs.jd),
        company_name = excluded.company_name,
        experience = COALESCE(excluded.experience, jobs.experience),
        degree = COALESCE(excluded.degree, jobs.degree),
        job_url = COALESCE(excluded.job_url, jobs.job_url),
        keyword = COALESCE(excluded.keyword, jobs.keyword),
        raw_json = COALESCE(excluded.raw_json, jobs.raw_json),
        updated_at = excluded.updated_at
      `,
      )
      .run(
        id,
        item.platform,
        item.platformJobId,
        item.title,
        item.city,
        item.location ?? null,
        item.salaryRaw ?? null,
        salary.min,
        salary.max,
        salary.months,
        item.welfare?.length ? JSON.stringify(item.welfare) : null,
        rest.restPolicy,
        rest.isDoubleOff === null || rest.isDoubleOff === undefined
          ? null
          : rest.isDoubleOff
            ? 1
            : 0,
        detail?.jd ?? null,
        item.companyName,
        item.experience ?? null,
        item.degree ?? null,
        item.jobUrl ?? null,
        keyword,
        item.raw ? JSON.stringify(item.raw) : null,
        collectedAt,
        now,
      );

    return this.getByPlatformId(item.platform, item.platformJobId)!;
  }

  getByPlatformId(
    platform: Platform,
    platformJobId: string,
  ): JobRecord | null {
    const row = this.db
      .prepare(
        `SELECT * FROM jobs WHERE platform = ? AND platform_job_id = ?`,
      )
      .get(platform, platformJobId) as Record<string, unknown> | undefined;
    return row ? mapJobRow(row) : null;
  }

  list(opts: {
    city?: string;
    keyword?: string;
    platform?: Platform;
    limit?: number;
  }): JobRecord[] {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (opts.city) {
      clauses.push("city = ?");
      params.push(opts.city);
    }
    if (opts.platform) {
      clauses.push("platform = ?");
      params.push(opts.platform);
    }
    if (opts.keyword) {
      clauses.push("(keyword LIKE ? OR title LIKE ?)");
      params.push(`%${opts.keyword}%`, `%${opts.keyword}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = opts.limit ?? 50;
    const bind = [...params, limit] as (string | number | null)[];
    const rows = this.db
      .prepare(
        `SELECT * FROM jobs ${where} ORDER BY updated_at DESC LIMIT ?`,
      )
      .all(...bind) as Record<string, unknown>[];
    return rows.map(mapJobRow);
  }
}

function mapJobRow(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    platform: row.platform as Platform,
    platformJobId: String(row.platform_job_id),
    title: String(row.title),
    city: String(row.city),
    location: (row.location as string) ?? null,
    salaryRaw: (row.salary_raw as string) ?? null,
    salaryMin: (row.salary_min as number) ?? null,
    salaryMax: (row.salary_max as number) ?? null,
    salaryMonths: (row.salary_months as number) ?? null,
    welfare: (row.welfare as string) ?? null,
    restPolicy: (row.rest_policy as string) ?? null,
    isDoubleOff: (row.is_double_off as number) ?? null,
    jd: (row.jd as string) ?? null,
    companyName: String(row.company_name),
    companyId: (row.company_id as string) ?? null,
    experience: (row.experience as string) ?? null,
    degree: (row.degree as string) ?? null,
    jobUrl: (row.job_url as string) ?? null,
    keyword: (row.keyword as string) ?? null,
    rawJson: (row.raw_json as string) ?? null,
    collectedAt: String(row.collected_at),
    updatedAt: String(row.updated_at),
  };
}
