import {
  CompanyStore,
  JobStore,
  createCompanyProvider,
  loadConfig,
} from "@bossjobs/core";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const name = sp.name?.trim() ?? "";
  let row: Record<string, unknown> | null = null;
  let error: string | null = null;

  if (name) {
    const store = new JobStore();
    const companies = new CompanyStore(store.db);
    try {
      row = companies.getByName(name);
      if (!row) {
        const cfg = loadConfig();
        const provider = createCompanyProvider({
          provider:
            cfg.company?.provider ??
            (process.env.CNBIZAPI_KEY ? "cnbizapi" : "null"),
          apiKey: cfg.company?.apiKey ?? process.env.CNBIZAPI_KEY,
          baseUrl: cfg.company?.baseUrl,
        });
        const enrichment = await provider.lookup(name);
        companies.upsert(enrichment);
        row = companies.getByName(name);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      store.close();
    }
  }

  return (
    <main>
      <section className="hero">
        <p className="hero-kicker">Company</p>
        <h1>公司背调</h1>
        <p>查注册信息、社保与案件摘要（依赖已配置的公司数据源）。</p>
      </section>

      <div className="surface">
        <form method="get" className="row">
          <div>
            <label>公司名称</label>
            <input name="name" defaultValue={name} placeholder="公司全称" />
          </div>
          <button type="submit">查询</button>
        </form>
      </div>

      {error && (
        <div className="surface" style={{ marginTop: 14 }}>
          <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
        </div>
      )}

      {row && (
        <section className="section" style={{ marginTop: 28 }}>
          <div className="section-head">
            <h2>{String(row.name)}</h2>
            <span className="tag">{String(row.provider ?? "-")}</span>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>经营状况</dt>
              <dd>{String(row.status ?? "暂无")}</dd>
            </div>
            <div>
              <dt>注册时间</dt>
              <dd>{String(row.registered_at ?? "暂无")}</dd>
            </div>
            <div>
              <dt>注册资金</dt>
              <dd>{String(row.registered_capital ?? "暂无")}</dd>
            </div>
            <div>
              <dt>社保人数</dt>
              <dd>{String(row.social_insurance_count ?? "暂无")}</dd>
            </div>
            <div>
              <dt>在职人数</dt>
              <dd>{String(row.employee_count ?? "暂无")}</dd>
            </div>
          </dl>
          <div className="surface">
            <h3 style={{ marginTop: 0, fontFamily: "var(--display)" }}>
              案件摘要
            </h3>
            <pre className="jd">{String(row.lawsuits_summary ?? "暂无")}</pre>
          </div>
        </section>
      )}
    </main>
  );
}
