import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { BrowserManager } from "@bossjobs/adapters";
import { getCredentialsDir, type Platform } from "@bossjobs/core";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { platform: Platform; text: string };
    if (body.platform !== "boss" && body.platform !== "zhilian") {
      return NextResponse.json(
        { ok: false, error: { message: "invalid platform" } },
        { status: 400 },
      );
    }
    fs.mkdirSync(getCredentialsDir(), { recursive: true });
    const target = path.join(getCredentialsDir(), `${body.platform}.json`);
    fs.writeFileSync(target, body.text.trim(), "utf8");
    const browser = new BrowserManager({ headless: true });
    try {
      const count = await browser.importCookiesFromFile(body.platform, target);
      return NextResponse.json({ ok: true, data: { saved: target, count } });
    } finally {
      await browser.close();
    }
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
