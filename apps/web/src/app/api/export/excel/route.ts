import { NextResponse } from "next/server";
import {
  JobStore,
  jobsToSheetRows,
  type Platform,
} from "@bossjobs/core";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = new JobStore();
  try {
    const jobs = store.list({
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
      limit: 20000,
    });
    const rows = jobsToSheetRows(jobs);
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "jobs");
    const buf = XLSX.write(book, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bossjobs-export.xlsx"`,
      },
    });
  } finally {
    store.close();
  }
}
