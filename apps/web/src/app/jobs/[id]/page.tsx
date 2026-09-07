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
      <div className="panel">
        <p className="muted">
          <Link href="/jobs">← 返回</Link> · {job.platform}
        </p>
        <h1 style={{ marginTop: 0 }}>{job.title}</h1>
        <p>
          {job.companyName} · {job.city}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        <p>
          薪资：<strong>{job.salaryRaw ?? "暂无"}</strong>
        </p>
        <p>休息：{job.restPolicy ?? "未知"}</p>
        {welfare.length > 0 && (
          <p>福利：{welfare.join("、")}</p>
        )}
        {job.jobUrl && (
          <p>
            <a href={job.jobUrl} target="_blank" rel="noreferrer">
              原链接
            </a>
          </p>
        )}
        <p>
          <Link
            href={`/companies?name=${encodeURIComponent(job.companyName)}`}
          >
            查看公司背调 →
          </Link>
        </p>
      </div>
      <div className="panel">
        <h2>岗位 JD</h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {job.jd || "（未采集详情，请在采集时勾选 --detail）"}
        </pre>
      </div>
    </main>
  );
}
