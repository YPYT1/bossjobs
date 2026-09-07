import Link from "next/link";
import { JobStore } from "@bossjobs/core";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = new JobStore();
  let job;
  try {
    job = store.getById(id);
  } finally {
    store.close();
  }
  if (!job) notFound();

  let welfare: string[] = [];
  try {
    welfare = job.welfare ? (JSON.parse(job.welfare) as string[]) : [];
  } catch {
    welfare = job.welfare ? [job.welfare] : [];
  }

  return (
    <main>
      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/jobs">← 岗位库</Link>
      </p>

      <section className="hero" style={{ paddingTop: 8 }}>
        <p className="hero-kicker">{job.platform}</p>
        <h1>{job.title}</h1>
        <p>
          {job.companyName}
          {job.city ? ` · ${job.city}` : ""}
          {job.location ? ` · ${job.location}` : ""}
        </p>
      </section>

      <dl className="detail-grid">
        <div>
          <dt>薪资</dt>
          <dd className="salary">{job.salaryRaw ?? "暂无"}</dd>
        </div>
        <div>
          <dt>休息</dt>
          <dd>{job.restPolicy ?? "未知"}</dd>
        </div>
        <div>
          <dt>经验</dt>
          <dd>{job.experience ?? "—"}</dd>
        </div>
        <div>
          <dt>福利</dt>
          <dd>{welfare.length ? welfare.join("、") : "—"}</dd>
        </div>
      </dl>

      <div className="actions" style={{ marginBottom: 28 }}>
        {job.jobUrl && (
          <a className="btn ghost" href={job.jobUrl} target="_blank" rel="noreferrer">
            打开原链接
          </a>
        )}
        <Link
          className="btn"
          href={`/companies?name=${encodeURIComponent(job.companyName)}`}
        >
          公司背调
        </Link>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>岗位 JD</h2>
        </div>
        <div className="surface">
          <pre className="jd">
            {job.jd || "（详情采集失败或岗位无 JD，可重新采集该岗位）"}
          </pre>
        </div>
      </section>
    </main>
  );
}
