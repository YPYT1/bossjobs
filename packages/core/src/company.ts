import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { CompanyEnrichment } from "./types.js";

export class CompanyStore {
  constructor(private readonly db: DatabaseSync) {}

  upsert(enrichment: CompanyEnrichment): string {
    const now = new Date().toISOString();
    const existing = this.db
      .prepare(`SELECT id FROM companies WHERE name = ?`)
      .get(enrichment.name) as { id: string } | undefined;
    const id = existing?.id ?? randomUUID();

    this.db
      .prepare(
        `
      INSERT INTO companies (
        id, name, status, social_insurance_count, employee_count,
        registered_at, registered_capital, lawsuits_summary,
        provider, raw_json, enriched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        status = COALESCE(excluded.status, companies.status),
        social_insurance_count = COALESCE(excluded.social_insurance_count, companies.social_insurance_count),
        employee_count = COALESCE(excluded.employee_count, companies.employee_count),
        registered_at = COALESCE(excluded.registered_at, companies.registered_at),
        registered_capital = COALESCE(excluded.registered_capital, companies.registered_capital),
        lawsuits_summary = COALESCE(excluded.lawsuits_summary, companies.lawsuits_summary),
        provider = COALESCE(excluded.provider, companies.provider),
        raw_json = COALESCE(excluded.raw_json, companies.raw_json),
        enriched_at = excluded.enriched_at
      `,
      )
      .run(
        id,
        enrichment.name,
        enrichment.status ?? null,
        enrichment.socialInsuranceCount ?? null,
        enrichment.employeeCount ?? null,
        enrichment.registeredAt ?? null,
        enrichment.registeredCapital ?? null,
        enrichment.lawsuitsSummary ?? null,
        enrichment.provider ?? null,
        enrichment.raw ? JSON.stringify(enrichment.raw) : null,
        now,
      );
    return id;
  }

  getByName(name: string): Record<string, unknown> | null {
    return (
      (this.db
        .prepare(`SELECT * FROM companies WHERE name = ?`)
        .get(name) as Record<string, unknown> | undefined) ?? null
    );
  }
}

export interface CompanyProvider {
  readonly name: string;
  lookup(companyName: string): Promise<CompanyEnrichment>;
}

/** Null provider — always empty (offline / no key). */
export class NullCompanyProvider implements CompanyProvider {
  readonly name = "null";
  async lookup(companyName: string): Promise<CompanyEnrichment> {
    return { name: companyName, provider: this.name };
  }
}

/**
 * CNBizAPI free-tier basic info.
 * https://api.cnbizapi.com/v1/company/basic?q=
 */
export class CnBizApiProvider implements CompanyProvider {
  readonly name = "cnbizapi";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.cnbizapi.com",
  ) {}

  async lookup(companyName: string): Promise<CompanyEnrichment> {
    const url = `${this.baseUrl}/v1/company/basic?q=${encodeURIComponent(companyName)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CNBizAPI HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      success?: boolean;
      data?: Record<string, unknown>;
    };
    const d = json.data ?? {};
    return {
      name: companyName,
      status: str(d.status ?? d.regStatus ?? d.business_status),
      registeredAt: str(d.establishTime ?? d.start_date ?? d.registered_at),
      registeredCapital: str(
        d.regCapital ?? d.registered_capital ?? d.capital,
      ),
      socialInsuranceCount: num(
        d.socialSecurityNum ?? d.social_insurance_count,
      ),
      employeeCount: num(d.staffNumRange ?? d.employee_count ?? d.person_scope),
      lawsuitsSummary: d.legalRisks
        ? JSON.stringify(d.legalRisks)
        : str(d.lawsuits_summary),
      provider: this.name,
      raw: d,
    };
  }
}

export function createCompanyProvider(opts: {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
}): CompanyProvider {
  if (opts.provider === "cnbizapi" && opts.apiKey) {
    return new CnBizApiProvider(opts.apiKey, opts.baseUrl);
  }
  return new NullCompanyProvider();
}

function str(v: unknown): string | null {
  if (v == null) return null;
  return String(v);
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
