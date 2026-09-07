import { describe, expect, it } from "vitest";
import { parseRestPolicy, parseSalary } from "../src/salary.js";

describe("parseSalary", () => {
  it("parses K range with months", () => {
    expect(parseSalary("30-60K·15薪")).toEqual({
      min: 30000,
      max: 60000,
      months: 15,
    });
  });

  it("parses wan range", () => {
    expect(parseSalary("1-2万")).toEqual({
      min: 10000,
      max: 20000,
      months: null,
    });
  });

  it("handles 面议", () => {
    expect(parseSalary("面议")).toEqual({
      min: null,
      max: null,
      months: null,
    });
  });
});

describe("parseRestPolicy", () => {
  it("detects 双休", () => {
    expect(parseRestPolicy("福利：五险一金，周末双休")).toEqual({
      restPolicy: "双休",
      isDoubleOff: true,
    });
  });

  it("detects 大小周", () => {
    expect(parseRestPolicy("大小周，偶尔加班")).toEqual({
      restPolicy: "大小周",
      isDoubleOff: false,
    });
  });
});
