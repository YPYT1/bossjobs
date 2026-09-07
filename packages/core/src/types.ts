export type Platform = "boss" | "zhilian";

export interface SearchInput {
  platform: Platform;
  city: string;
  keyword: string;
  pages?: number;
  withDetail?: boolean;
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
  /** Platform-specific tokens needed for detail fetch */
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
