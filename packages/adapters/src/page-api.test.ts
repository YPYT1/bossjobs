import { describe, expect, it } from "vitest";
import { isUsablePageUrl } from "./page-api.js";

describe("isUsablePageUrl", () => {
  it("accepts https job sites", () => {
    expect(isUsablePageUrl("https://www.zhipin.com/web/geek/job")).toBe(true);
    expect(isUsablePageUrl("https://www.zhaopin.com/")).toBe(true);
  });

  it("rejects blank / chrome error pages", () => {
    expect(isUsablePageUrl("about:blank")).toBe(false);
    expect(isUsablePageUrl("chrome-error://chromewebdata/")).toBe(false);
    expect(isUsablePageUrl("")).toBe(false);
  });
});
