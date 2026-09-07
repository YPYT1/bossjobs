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
    setMsg(JSON.stringify(json));
  }

  async function saveKey() {
    const res = await fetch("/api/settings/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cnbizApiKey: apiKey }),
    });
    const json = await res.json();
    setMsg(JSON.stringify(json));
  }

  return (
    <main>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>设置</h1>
        <h2>Cookie 粘贴导入</h2>
        <p className="muted">
          可用扩展 packages/extension 导出 JSON，或粘贴 Header 风格 cookie。
        </p>
        <label>平台</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="boss">Boss</option>
          <option value="zhilian">智联</option>
        </select>
        <label style={{ marginTop: 8 }}>Cookie 文本</label>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{"name":"bst","value":"...","domain":".zhipin.com"}]'
        />
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={saveCookie}>
            保存 Cookie
          </button>
        </div>
      </div>
      <div className="panel">
        <h2>公司背调 CNBizAPI Key</h2>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Bearer key"
        />
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={saveKey}>
            保存 Key
          </button>
        </div>
      </div>
      <div className="panel">
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg || "—"}</pre>
      </div>
    </main>
  );
}
