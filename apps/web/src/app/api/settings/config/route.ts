import { NextResponse } from "next/server";
import { loadConfig, saveConfig } from "@bossjobs/core";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { cnbizApiKey?: string };
    const cfg = loadConfig();
    if (body.cnbizApiKey) {
      cfg.company = {
        ...(cfg.company ?? {}),
        provider: "cnbizapi",
        apiKey: body.cnbizApiKey,
      };
    }
    saveConfig(cfg);
    return NextResponse.json({
      ok: true,
      data: { saved: true, provider: cfg.company?.provider },
    });
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
