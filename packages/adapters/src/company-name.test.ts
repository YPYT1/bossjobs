import { describe, expect, it } from "vitest";
import { pickCompanyFullName } from "./company-name.js";

describe("pickCompanyFullName", () => {
  it("prefers legal 全称 over brand short name", () => {
    expect(
      pickCompanyFullName("字节跳动", "北京字节跳动科技有限公司"),
    ).toBe("北京字节跳动科技有限公司");
  });

  it("falls back to longest when no legal marker", () => {
    expect(pickCompanyFullName("AB", "ABCDEF")).toBe("ABCDEF");
  });

  it("ignores empty", () => {
    expect(pickCompanyFullName("", null, "重庆某某有限公司")).toBe(
      "重庆某某有限公司",
    );
  });
});
