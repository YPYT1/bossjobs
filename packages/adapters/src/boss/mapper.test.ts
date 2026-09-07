import { describe, expect, it } from "vitest";
import {
  assertBossApiOk,
  isBossJobListUrl,
  mapBossDetailResponse,
  mapBossListResponse,
} from "./mapper.js";

describe("Boss API contract", () => {
  it("detects joblist url", () => {
    expect(
      isBossJobListUrl(
        "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?city=101040100",
      ),
    ).toBe(true);
  });

  it("maps salaryDesc as plaintext", () => {
    const jobs = mapBossListResponse(
      {
        code: 0,
        zpData: {
          jobList: [
            {
              encryptJobId: "abc123",
              jobName: "AI开发工程师",
              cityName: "重庆",
              areaDistrict: "渝北区",
              businessDistrict: "两江新区",
              salaryDesc: "20-40K·15薪",
              brandName: "测试科技",
              companyFullName: "重庆测试科技有限公司",
              welfareList: ["五险一金", "年终奖"],
              jobExperience: "3-5年",
              jobDegree: "本科",
              securityId: "sec",
              lid: "lid1",
            },
          ],
        },
      },
      "重庆",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.salaryRaw).toBe("20-40K·15薪");
    expect(jobs[0]!.title).toBe("AI开发工程师");
    expect(jobs[0]!.companyName).toBe("重庆测试科技有限公司");
    expect(jobs[0]!.location).toBe("渝北区·两江新区");
    expect(jobs[0]!.detailContext?.securityId).toBe("sec");
  });

  it("prefers brandComInfo company 全称 from detail mapper", () => {
    const detail = mapBossDetailResponse(
      {
        code: 0,
        zpData: {
          jobInfo: {
            postDescription: "负责 Agent 研发，双休",
            salaryDesc: "25-40K",
            address: "重庆渝北",
            welfareList: ["五险一金"],
          },
          brandComInfo: {
            brandName: "某某",
            companyName: "重庆某某人工智能科技有限公司",
          },
        },
      },
      "jid1",
    );
    expect(detail.companyName).toBe("重庆某某人工智能科技有限公司");
    expect(detail.jd).toContain("Agent");
    expect(detail.isDoubleOff).toBe(true);
  });

  it("throws on risk-control codes", () => {
    expect(() =>
      assertBossApiOk({ code: 37, message: "您的环境存在异常" }),
    ).toThrow(/风控/);
  });
});
