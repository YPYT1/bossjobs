import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDbPath } from "./paths.js";
import type {
  JobListFilter,
  JobRecord,
  Platform,
  RawJobListItem,
} from "./types.js";
import {
  mergeKeywords,
  parseRestFromTags,
  parseRestPolicy,
  parseSalary,
} from "./salary.js";

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
  progress_json TEXT,
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
    try {
      this.db.exec(
        `ALTER TABLE collect_tasks ADD COLUMN progress_json TEXT`,
      );
    } catch {
      // column may already exist
    }
  }

  close(): void {
    this.db.close();
  }

  hasJob(platform: Platform, platformJobId: string): boolean {
    const row = this.db
      .prepare(
        `SELECT 1 AS ok FROM jobs WHERE platform = ? AND platform_job_id = ?`,
      )
      .get(platform, platformJobId) as { ok: number } | undefined;
    return Boolean(row);
  }

  upsertFromListItem(
    item: RawJobListItem,
    keyword: string,
    detail?: { jd?: string; restPolicy?: string; isDoubleOff?: boolean | null },
  ): { record: JobRecord; created: boolean } {
    const now = new Date().toISOString();
    const salary = parseSalary(item.salaryRaw);
    const fromJd = parseRestPolicy(detail?.jd);
    const fromTags = parseRestFromTags(item.welfare);
    const rest = {
      restPolicy:
        detail?.restPolicy ??
        fromJd.restPolicy ??
        fromTags.restPolicy ??
        null,
      isDoubleOff:
        detail?.isDoubleOff !== undefined && detail?.isDoubleOff !== null
          ? detail.isDoubleOff
          : (fromJd.isDoubleOff ?? fromTags.isDoubleOff),
    };

    const existing = this.db
      .prepare(
        `SELECT id, collected_at, keyword FROM jobs WHERE platform = ? AND platform_job_id = ?`,
      )
      .get(item.platform, item.platformJobId) as
      | { id: string; collected_at: string; keyword: string | null }
      | undefined;

    const created = !existing;
    const id = existing?.id ?? randomUUID();
    const collectedAt = existing?.collected_at ?? now;
    const mergedKeyword = mergeKeywords(existing?.keyword, keyword);

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
        keyword = excluded.keyword,
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
        mergedKeyword,
        item.raw ? JSON.stringify(item.raw) : null,
        collectedAt,
        now,
      );

    return {
      record: this.getByPlatformId(item.platform, item.platformJobId)!,
      created,
    };
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

  getById(id: string): JobRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM jobs WHERE id = ?`)
      .get(id) as Record<string, unknown> | undefined;
    return row ? mapJobRow(row) : null;
  }

  count(filter: JobListFilter = {}): number {
    const { where, params } = buildWhere(filter);
    const row = this.db
      .prepare(`SELECT COUNT(*) AS c FROM jobs ${where}`)
      .get(...params) as { c: number };
    return Number(row.c);
  }

  list(opts: JobListFilter = {}): JobRecord[] {
    const { where, params } = buildWhere(opts);
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const bind = [...params, limit, offset] as (string | number | null)[];
    const rows = this.db
      .prepare(
        `SELECT * FROM jobs ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...bind) as Record<string, unknown>[];
    return rows.map(mapJobRow);
  }

  createTask(input: {
    platform: Platform;
    city: string;
    keyword: string;
    pages: number;
  }): string {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO collect_tasks (id, platform, city, keyword, pages, status, progress_json, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?)`,
      )
      .run(id, input.platform, input.city, input.keyword, input.pages, now);
    return id;
  }

  updateTask(
    id: string,
    patch: {
      status?: string;
      progress?: unknown;
      error?: string | null;
      finished?: boolean;
    },
  ): void {
    const finishedAt = patch.finished ? new Date().toISOString() : null;
    this.db
      .prepare(
        `UPDATE collect_tasks SET
          status = COALESCE(?, status),
          progress_json = COALESCE(?, progress_json),
          error = COALESCE(?, error),
          finished_at = COALESCE(?, finished_at)
         WHERE id = ?`,
      )
      .run(
        patch.status ?? null,
        patch.progress ? JSON.stringify(patch.progress) : null,
        patch.error ?? null,
        finishedAt,
        id,
      );
  }

  getTask(id: string): Record<string, unknown> | null {
    return (
      (this.db
        .prepare(`SELECT * FROM collect_tasks WHERE id = ?`)
        .get(id) as Record<string, unknown> | undefined) ?? null
    );
  }

  listTasks(limit = 20): Record<string, unknown>[] {
    return this.db
      .prepare(
        `SELECT * FROM collect_tasks ORDER BY created_at DESC LIMIT ?`,
      )
      .all(limit) as Record<string, unknown>[];
  }
}

function buildWhere(opts: JobListFilter): {
  where: string;
  params: (string | number | null)[];
} {
  const clauses: string[] = [];
  const params: (string | number | null)[] = [];
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
  if (opts.company) {
    clauses.push("company_name LIKE ?");
    params.push(`%${opts.company}%`);
  }
  if (opts.salaryMin != null) {
    clauses.push("salary_max >= ?");
    params.push(opts.salaryMin);
  }
  if (opts.salaryMax != null) {
    clauses.push("salary_min <= ?");
    params.push(opts.salaryMax);
  }
  if (opts.hasJd === true) {
    clauses.push("jd IS NOT NULL AND length(jd) > 0");
  }
  if (opts.hasJd === false) {
    clauses.push("(jd IS NULL OR length(jd) = 0)");
  }
  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
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
