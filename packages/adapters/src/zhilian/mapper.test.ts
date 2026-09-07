import { describe, expect, it } from "vitest";
import {
  extractZhilianList,
  isZhilianSearchUrl,
  mapZhilianListResponse,
} from "./mapper.js";

describe("Zhilian API contract", () => {
  it("detects search urls", () => {
    expect(
      isZhilianSearchUrl(
        "https://fe-api.zhaopin.com/c/i/sou?pageSize=20&cityId=551&kw=AI",
      ),
    ).toBe(true);
    expect(
      isZhilianSearchUrl(
        "https://cgate.zhaopin.com/positionbusiness/searchrecommend/searchPositions",
      ),
    ).toBe(true);
  });

  it("maps list payload with salary plaintext", () => {
    const jobs = mapZhilianListResponse(
      {
        code: 200,
        data: {
          list: [
            {
              number: "CC123J456",
              name: "Agent开发",
              salary60: "15-25K",
              city: { display: "重庆" },
              companyName: "某某网络",
              welfareTagList: ["双休", "餐补"],
              positionURL: "https://www.zhaopin.com/jobdetail/CC123J456.htm",
            },
          ],
        },
      },
      "重庆",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.platform).toBe("zhilian");
    expect(jobs[0]!.salaryRaw).toBe("15-25K");
    expect(jobs[0]!.welfare).toContain("双休");
  });

  it("extracts from results alias", () => {
    const list = extractZhilianList({
      results: [{ number: "1", name: "x", companyName: "y" }],
    });
    expect(list).toHaveLength(1);
  });
});
