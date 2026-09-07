import { NextResponse } from "next/server";
import { getTask, listTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const task = getTask(id);
    if (!task) {
      return NextResponse.json(
        { ok: false, error: { message: "not found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, data: task });
  }
  return NextResponse.json({ ok: true, data: listTasks(30) });
}
