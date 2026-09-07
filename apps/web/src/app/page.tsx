import { JobStore, getDbPath } from "@bossjobs/core";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const store = new JobStore();
  let total = 0;
  let recent: ReturnType<JobStore["list"]> = [];
  try {
    recent = store.list({ limit: 8 });
    total = recent.length;
    // rough total
    total = store.list({ limit: 10000 }).length;
  } finally {
    store.close();
  }

  return (
    <main>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>本地岗位情报台</h1>
        <p className="muted">
          薄浏览器会话 + 官方接口采集 · 数据文件{" "}
          <code>{getDbPath()}</code>
        </p>
        <p>
          已入库岗位约 <strong>{total}</strong> 条
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link href="/tasks">
            <button type="button">去采集</button>
          </Link>
          <Link href="/analytics">
            <button type="button" className="secondary">
              看分析
            </button>
          </Link>
        </div>
      </div>
      <div className="panel">
        <h2>最近岗位</h2>
        <table>
          <thead>
            <tr>
              <th>岗位</th>
              <th>城市</th>
              <th>薪资</th>
              <th>公司</th>
              <th>平台</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((j) => (
              <tr key={j.id}>
                <td>
                  <Link href={`/jobs/${j.id}`}>{j.title}</Link>
                </td>
                <td>{j.city}</td>
                <td>{j.salaryRaw ?? "-"}</td>
                <td>
                  <Link href={`/companies?name=${encodeURIComponent(j.companyName)}`}>
                    {j.companyName}
                  </Link>
                </td>
                <td>{j.platform}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
