import { describe, expect, it } from "vitest";
import { parseCookiePayload } from "./browser.js";
import {
  resolveBossCityCode,
  resolveZhilianCityCode,
} from "./city-codes.js";
import { buildBossSearchUrl } from "./boss/adapter.js";
import { buildZhilianSearchUrl } from "./zhilian/adapter.js";
import { isBossJobListUrl } from "./boss/mapper.js";
import { isZhilianSearchUrl } from "./zhilian/mapper.js";

describe("API URL builders & cookie parse", () => {
  it("builds Boss search URL with city+keyword", () => {
    const url = buildBossSearchUrl({
      cityCode: resolveBossCityCode("重庆"),
      keyword: "AI开发",
      page: 1,
    });
    expect(url).toContain("zhipin.com/web/geek/job");
    expect(url).toContain("city=101040100");
    expect(url).toContain("query=");
  });

  it("builds Zhilian search URL", () => {
    const url = buildZhilianSearchUrl({
      cityCode: resolveZhilianCityCode("重庆"),
      keyword: "Agent",
      page: 2,
    });
    expect(url).toContain("zhaopin.com/sou/");
    expect(url).toContain("jl551");
    expect(url).toContain("p2");
  });

  it("parses header-style cookies", () => {
    const cookies = parseCookiePayload("a=1; b=2", "boss");
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toMatchObject({
      name: "a",
      value: "1",
      domain: ".zhipin.com",
    });
  });

  it("parses JSON cookies", () => {
    const cookies = parseCookiePayload(
      JSON.stringify([
        { name: "wt2", value: "xxx", domain: ".zhipin.com", path: "/" },
      ]),
      "boss",
    );
    expect(cookies[0]!.name).toBe("wt2");
  });

  it("keeps API url matchers aligned with docs", () => {
    expect(isBossJobListUrl("/wapi/zpgeek/search/joblist.json")).toBe(true);
    expect(isZhilianSearchUrl("https://www.zhaopin.com/c/i/sou?x=1")).toBe(
      true,
    );
  });
});
