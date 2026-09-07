"use client";

import { useState } from "react";

export default function TasksPage() {
  const [platform, setPlatform] = useState("boss");
  const [city, setCity] = useState("重庆");
  const [keyword, setKeyword] = useState("AI开发");
  const [pages, setPages] = useState("1");
  const [detail, setDetail] = useState(false);
  const [log, setLog] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setLog("采集中（会拉起本机 Chrome Profile）…");
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform,
          city,
          keyword,
          pages: Number(pages) || 1,
          withDetail: detail,
        }),
      });
      const json = await res.json();
      setLog(JSON.stringify(json, null, 2));
    } catch (e) {
      setLog(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>采集任务</h1>
        <p className="muted">
          Path C：薄浏览器会话 + 页面内调用官方搜索接口。需本机已登录 Profile。
        </p>
        <div className="grid grid-2">
          <div>
            <label>平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="boss">Boss</option>
              <option value="zhilian">智联</option>
            </select>
          </div>
          <div>
            <label>城市</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label>关键词</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <label>页数</label>
            <input value={pages} onChange={(e) => setPages(e.target.value)} />
          </div>
        </div>
        <label style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            type="checkbox"
            checked={detail}
            onChange={(e) => setDetail(e.target.checked)}
          />
          抓取详情 JD
        </label>
        <div style={{ marginTop: 14 }}>
          <button type="button" disabled={loading} onClick={run}>
            {loading ? "运行中…" : "开始采集"}
          </button>
        </div>
      </div>
      <div className="panel">
        <h2>结果</h2>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{log || "—"}</pre>
      </div>
    </main>
  );
}
