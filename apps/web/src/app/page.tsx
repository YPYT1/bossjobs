import Link from "next/link";
import { JobStore, getDbPath } from "@bossjobs/core";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const store = new JobStore();
  let total = 0;
  let cities = 0;
  let recent: ReturnType<JobStore["list"]> = [];
  try {
    total = store.count({});
    recent = store.list({ limit: 8 });
    const set = new Set(store.list({ limit: 5000 }).map((j) => j.city));
    cities = set.size;
  } finally {
    store.close();
  }

  return (
    <main>
      <section className="hero">
        <p className="hero-kicker">Personal job intelligence</p>
        <h1>BossJobs</h1>
        <p>
          本地岗位情报台。慢速采集 Boss / 智联，自动去重入库，筛选分析，一键导出
          Excel。
        </p>
        <div className="actions">
          <Link className="btn" href="/tasks">
            开始采集
          </Link>
          <Link className="btn ghost" href="/jobs">
            浏览岗位库
          </Link>
        </div>
      </section>

      <div className="metrics">
        <div className="metric">
          <span>岗位总量</span>
          <strong>{total}</strong>
        </div>
        <div className="metric">
          <span>覆盖城市</span>
          <strong>{cities}</strong>
        </div>
        <div className="metric">
          <span>数据文件</span>
          <strong style={{ fontSize: "0.95rem", fontFamily: "var(--font)" }}>
            本地 SQLite
          </strong>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>最近入库</h2>
          <Link href="/jobs">查看全部</Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted">还没有岗位。先去采集一波重庆 · Agent开发。</p>
        ) : (
          <div className="job-list">
            {recent.map((j) => (
              <div className="job-row" key={j.id}>
                <Link className="job-title" href={`/jobs/${j.id}`}>
                  {j.title}
                </Link>
                <span className="muted">{j.city}</span>
                <span className="salary">{j.salaryRaw ?? "面议"}</span>
                <span className="muted">{j.companyName}</span>
                <span className="tag">{j.platform}</span>
              </div>
            ))}
          </div>
        )}
        <p className="muted" style={{ marginTop: 18, fontSize: "0.82rem" }}>
          {getDbPath()}
        </p>
      </section>
    </main>
  );
}
