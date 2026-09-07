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
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>公司背调</h1>
        <form method="get" className="row">
          <div>
            <label>公司名称</label>
            <input name="name" defaultValue={name} placeholder="公司全称" />
          </div>
          <button type="submit">查询</button>
        </form>
      </div>
      {error && (
        <div className="panel">
          <p>{error}</p>
        </div>
      )}
      {row && (
        <div className="panel">
          <h2>{String(row.name)}</h2>
          <table>
            <tbody>
              <tr>
                <th>经营状况</th>
                <td>{String(row.status ?? "暂无")}</td>
              </tr>
              <tr>
                <th>注册时间</th>
                <td>{String(row.registered_at ?? "暂无")}</td>
              </tr>
              <tr>
                <th>注册资金</th>
                <td>{String(row.registered_capital ?? "暂无")}</td>
              </tr>
              <tr>
                <th>社保人数</th>
                <td>{String(row.social_insurance_count ?? "暂无")}</td>
              </tr>
              <tr>
                <th>在职人数</th>
                <td>{String(row.employee_count ?? "暂无")}</td>
              </tr>
              <tr>
                <th>案件摘要</th>
                <td>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {String(row.lawsuits_summary ?? "暂无")}
                  </pre>
                </td>
              </tr>
              <tr>
                <th>来源</th>
                <td>{String(row.provider ?? "-")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
