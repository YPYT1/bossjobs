import Link from "next/link";
import { JobStore, type Platform } from "@bossjobs/core";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const store = new JobStore();
  let jobs: ReturnType<JobStore["list"]> = [];
  try {
    jobs = store.list({
      city: sp.city,
      keyword: sp.keyword,
      platform: sp.platform as Platform | undefined,
      limit: Number(sp.limit) || 100,
    });
  } finally {
    store.close();
  }

  return (
    <main>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>岗位列表</h1>
        <form className="row" method="get">
          <div>
            <label>城市</label>
            <input name="city" defaultValue={sp.city ?? ""} placeholder="重庆" />
          </div>
          <div>
            <label>关键词</label>
            <input
              name="keyword"
              defaultValue={sp.keyword ?? ""}
              placeholder="AI"
            />
          </div>
          <div>
            <label>平台</label>
            <select name="platform" defaultValue={sp.platform ?? ""}>
              <option value="">全部</option>
              <option value="boss">Boss</option>
              <option value="zhilian">智联</option>
            </select>
          </div>
          <button type="submit">筛选</button>
        </form>
      </div>
      <div className="panel">
        <p className="muted">{jobs.length} 条</p>
        <table>
          <thead>
            <tr>
              <th>岗位</th>
              <th>城市</th>
              <th>地点</th>
              <th>薪资</th>
              <th>公司</th>
              <th>双休</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>
                  <Link href={`/jobs/${j.id}`}>{j.title}</Link>
                </td>
                <td>{j.city}</td>
                <td>{j.location ?? "-"}</td>
                <td>{j.salaryRaw ?? "-"}</td>
                <td>{j.companyName}</td>
                <td>
                  {j.isDoubleOff === 1
                    ? "是"
                    : j.isDoubleOff === 0
                      ? "否"
                      : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
