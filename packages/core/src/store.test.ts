import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JobStore } from "../src/store.js";

describe("JobStore", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  it("upserts by platform + job id", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bossjobs-"));
    dirs.push(dir);
    const store = new JobStore(path.join(dir, "t.db"));

    const a = store.upsertFromListItem(
      {
        platform: "boss",
        platformJobId: "j1",
        title: "AI开发",
        city: "重庆",
        companyName: "A公司",
        salaryRaw: "20-40K·14薪",
      },
      "AI开发",
    );
    expect(a.created).toBe(true);

    const b = store.upsertFromListItem(
      {
        platform: "boss",
        platformJobId: "j1",
        title: "AI开发工程师",
        city: "重庆",
        companyName: "A公司",
        salaryRaw: "25-45K·14薪",
        location: "渝北",
      },
      "AI开发",
    );
    expect(b.created).toBe(false);

    const list = store.list({ city: "重庆" });
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe("AI开发工程师");
    expect(list[0]!.salaryMin).toBe(25000);
    expect(list[0]!.location).toBe("渝北");
    expect(store.hasJob("boss", "j1")).toBe(true);
    store.close();
  });
});
