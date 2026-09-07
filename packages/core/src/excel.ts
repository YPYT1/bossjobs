import type { JobRecord } from "./types.js";

/** Build Excel-friendly rows from jobs. */
export function jobsToSheetRows(jobs: JobRecord[]): Record<string, unknown>[] {
  return jobs.map((j) => {
    let welfare = "";
    try {
      welfare = j.welfare
        ? (JSON.parse(j.welfare) as string[]).join("、")
        : "";
    } catch {
      welfare = j.welfare ?? "";
    }
    return {
      平台: j.platform,
      岗位名称: j.title,
      城市: j.city,
      地点: j.location ?? "",
      薪资原文: j.salaryRaw ?? "",
      薪资下限: j.salaryMin ?? "",
      薪资上限: j.salaryMax ?? "",
      月数: j.salaryMonths ?? "",
      公司: j.companyName,
      经验: j.experience ?? "",
      学历: j.degree ?? "",
      福利: welfare,
      休息制度: j.restPolicy ?? "",
      是否双休:
        j.isDoubleOff === 1 ? "是" : j.isDoubleOff === 0 ? "否" : "",
      关键词: j.keyword ?? "",
      岗位链接: j.jobUrl ?? "",
      JD: j.jd ?? "",
      平台岗位ID: j.platformJobId,
      采集时间: j.collectedAt,
      更新时间: j.updatedAt,
    };
  });
}
