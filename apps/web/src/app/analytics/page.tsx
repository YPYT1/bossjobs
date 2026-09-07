import { JobStore, analyzeFromStore } from "@bossjobs/core";
import { AnalyticsCharts } from "./charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const keyword = sp.keyword ?? "";
  const store = new JobStore();
  let report;
  try {
    report = analyzeFromStore(store, {
      keyword: keyword || undefined,
      limit: 5000,
    });
  } finally {
    store.close();
  }

  return (
    <main>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>数据分析</h1>
        <form className="row" method="get">
          <div>
            <label>关键词过滤</label>
            <input
              name="keyword"
              defaultValue={keyword}
              placeholder="AI开发"
            />
          </div>
          <button type="submit">分析</button>
        </form>
        <p className="muted">样本 {report.total} 条</p>
      </div>
      <AnalyticsCharts
        byCity={report.byCity}
        salaryByCity={report.salaryByCity}
      />
    </main>
  );
}
