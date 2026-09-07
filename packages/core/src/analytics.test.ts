import { describe, expect, it } from "vitest";
import { analyzeCityCounts, analyzeCitySalary } from "../src/analytics.js";
import type { JobRecord } from "../src/types.js";

function job(partial: Partial<JobRecord> & Pick<JobRecord, "id" | "city" | "title">): JobRecord {
  return {
    platform: "boss",
    platformJobId: partial.id,
    companyName: "C",
    location: null,
    salaryRaw: null,
    salaryMin: null,
    salaryMax: null,
    salaryMonths: null,
    welfare: null,
    restPolicy: null,
    isDoubleOff: null,
    jd: null,
    companyId: null,
    experience: null,
    degree: null,
    jobUrl: null,
    keyword: "AI",
    rawJson: null,
    collectedAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("analytics", () => {
  it("counts by city", () => {
    const rows = analyzeCityCounts([
      job({ id: "1", city: "重庆", title: "AI" }),
      job({ id: "2", city: "重庆", title: "AI" }),
      job({ id: "3", city: "上海", title: "AI" }),
    ]);
    expect(rows[0]).toEqual({ city: "重庆", count: 2 });
  });

  it("salary medians", () => {
    const rows = analyzeCitySalary([
      job({ id: "1", city: "重庆", title: "AI", salaryMin: 10, salaryMax: 20 }),
      job({ id: "2", city: "重庆", title: "AI", salaryMin: 30, salaryMax: 40 }),
    ]);
    expect(rows[0]!.medianMin).toBe(20);
    expect(rows[0]!.medianMax).toBe(30);
  });
});
