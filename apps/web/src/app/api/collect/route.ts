import { NextResponse } from "next/server";
import { collectJobs } from "@bossjobs/adapters";
import type { Platform } from "@bossjobs/core";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      platform: Platform;
      city: string;
      keyword: string;
      pages?: number;
      withDetail?: boolean;
    };
    const results = await collectJobs({
      platform: body.platform,
      city: body.city,
      keyword: body.keyword,
      pages: body.pages ?? 1,
      withDetail: body.withDetail,
    });
    return NextResponse.json({ ok: true, data: results });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "COLLECT_FAILED",
          message: e instanceof Error ? e.message : String(e),
        },
      },
      { status: 500 },
    );
  }
}
