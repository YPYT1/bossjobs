import { NextResponse } from "next/server";
import { startCollectTask, type Platform } from "@/lib/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 3600;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      platform: Platform;
      city: string;
      keyword: string;
      keywords?: string[];
      pages?: number;
      exhaust?: boolean;
      withDetail?: boolean;
      skipExisting?: boolean;
      delayMs?: number;
      jitterMs?: number;
    };
    if (!body.platform || !body.city || !body.keyword) {
      return NextResponse.json(
        { ok: false, error: { message: "platform/city/keyword required" } },
        { status: 400 },
      );
    }
    const taskId = startCollectTask({
      platform: body.platform,
      city: body.city,
      keyword: body.keyword,
      keywords: body.keywords,
      pages: body.pages ?? 3,
      exhaust: body.exhaust ?? true,
      withDetail: body.withDetail !== false,
      skipExisting: body.skipExisting !== false,
      delayMs: body.delayMs ?? 4500,
      jitterMs: body.jitterMs ?? 3500,
      detailDelayMs: 2800,
    });
    return NextResponse.json({ ok: true, data: { taskId } });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: e instanceof Error ? e.message : String(e) },
      },
      { status: 500 },
    );
  }
}
