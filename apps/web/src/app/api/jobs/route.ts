import { NextResponse } from "next/server";
import {
  JobStore,
  analyzeFromStore,
  type Platform,
} from "@bossjobs/core";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = new JobStore();
  try {
    const filter = {
      city: url.searchParams.get("city") || undefined,
      keyword: url.searchParams.get("keyword") || undefined,
      platform: (url.searchParams.get("platform") as Platform) || undefined,
      company: url.searchParams.get("company") || undefined,
      salaryMin: url.searchParams.get("salaryMin")
        ? Number(url.searchParams.get("salaryMin"))
        : undefined,
      salaryMax: url.searchParams.get("salaryMax")
        ? Number(url.searchParams.get("salaryMax"))
        : undefined,
      limit: Number(url.searchParams.get("limit") || 200),
      offset: Number(url.searchParams.get("offset") || 0),
    };
    if (url.searchParams.get("analytics") === "1") {
      const report = analyzeFromStore(store, {
        keyword: filter.keyword,
        platform: filter.platform,
        limit: 5000,
      });
      return NextResponse.json({
        ok: true,
        data: { ...report, totalAll: store.count(filter) },
      });
    }
    const jobs = store.list(filter);
    const total = store.count(filter);
    return NextResponse.json({ ok: true, data: { jobs, total } });
  } finally {
    store.close();
  }
}
