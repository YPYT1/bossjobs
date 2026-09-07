"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [platform, setPlatform] = useState("boss");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [apiKey, setApiKey] = useState("");

  async function saveCookie() {
    const res = await fetch("/api/settings/cookie", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform, text }),
    });
    const json = await res.json();
    setMsg(JSON.stringify(json, null, 2));
  }

  async function saveKey() {
    const res = await fetch("/api/settings/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cnbizApiKey: apiKey }),
    });
    const json = await res.json();
    setMsg(JSON.stringify(json, null, 2));
  }

  return (
    <main>
      <section className="hero">
        <p className="hero-kicker">Settings</p>
        <h1>设置</h1>
        <p>导入 Cookie，或配置公司背调 API Key。日常采集更推荐 auth setup 登录 Profile。</p>
      </section>

      <div className="surface">
        <h2 className="page-title" style={{ fontSize: "1.25rem", marginTop: 0 }}>
          Cookie 导入
        </h2>
        <p className="muted">
          可用扩展 packages/extension 导出 JSON，或粘贴 Header 风格 cookie。
        </p>
        <label>平台</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="boss">Boss</option>
          <option value="zhilian">智联</option>
        </select>
        <label style={{ marginTop: 12 }}>Cookie 文本</label>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{"name":"bst","value":"...","domain":".zhipin.com"}]'
        />
        <div className="actions">
          <button type="button" onClick={saveCookie}>
            保存 Cookie
          </button>
        </div>
      </div>

      <div className="surface" style={{ marginTop: 14 }}>
        <h2 className="page-title" style={{ fontSize: "1.25rem", marginTop: 0 }}>
          公司背调 Key
        </h2>
        <label>CNBizAPI Key</label>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Bearer key"
        />
        <div className="actions">
          <button type="button" onClick={saveKey}>
            保存 Key
          </button>
        </div>
      </div>

      {msg && <div className="flash">{msg}</div>}
    </main>
  );
}
