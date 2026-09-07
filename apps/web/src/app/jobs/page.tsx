"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Job = {
  id: string;
  title: string;
  city: string;
  location: string | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  companyName: string;
  platform: string;
  keyword: string | null;
  isDoubleOff: number | null;
  experience: string | null;
};

export default function JobsPage() {
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("");
  const [company, setCompany] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (keyword) p.set("keyword", keyword);
    if (platform) p.set("platform", platform);
    if (company) p.set("company", company);
    if (salaryMin) p.set("salaryMin", salaryMin);
    if (salaryMax) p.set("salaryMax", salaryMax);
    p.set("limit", "200");
    return p.toString();
  }, [city, keyword, platform, company, salaryMin, salaryMax]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?${query}`);
      const json = await res.json();
      if (json.ok) {
        setJobs(json.data.jobs);
        setTotal(json.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportExcel() {
    window.location.href = `/api/export/excel?${query}`;
  }

  return (
    <main>
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="hero-kicker">Library</p>
        <h1>岗位库</h1>
        <p>筛选本地入库岗位，并导出当前条件下的全部匹配结果（最多 2 万条）。</p>
      </motion.section>

      <motion.div
        className="surface"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
      >
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <span className="muted grow">
            显示 {jobs.length} / 共 {total} 条
          </span>
          <button type="button" className="ghost" onClick={load} disabled={loading}>
            {loading ? "刷新中…" : "刷新"}
          </button>
          <button type="button" onClick={exportExcel}>
            导出 Excel
          </button>
        </div>

        <div className="grid grid-3">
          <div>
            <label>城市</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="重庆"
            />
          </div>
          <div>
            <label>关键词</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Agent"
            />
          </div>
          <div>
            <label>公司</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="公司名"
            />
          </div>
          <div>
            <label>平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">全部</option>
              <option value="boss">Boss</option>
              <option value="zhilian">智联</option>
            </select>
          </div>
          <div>
            <label>薪资下限 ≥</label>
            <input
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="15000"
            />
          </div>
          <div>
            <label>薪资上限 ≤</label>
            <input
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="40000"
            />
          </div>
        </div>
      </motion.div>

      <section className="section" style={{ marginTop: 28 }}>
        <div className="job-list">
          {jobs.map((j, i) => (
            <motion.div
              className="job-row"
              key={j.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.012, 0.35) }}
            >
              <div>
                <Link className="job-title" href={`/jobs/${j.id}`}>
                  {j.title}
                </Link>
                <div className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                  {j.location ?? j.city}
                  {j.experience ? ` · ${j.experience}` : ""}
                </div>
              </div>
              <span className="muted">{j.city}</span>
              <span className="salary">{j.salaryRaw ?? "面议"}</span>
              <Link
                href={`/companies?name=${encodeURIComponent(j.companyName)}`}
                className="muted"
              >
                {j.companyName}
              </Link>
              <span className="tag">{j.platform}</span>
            </motion.div>
          ))}
          {!loading && jobs.length === 0 && (
            <p className="muted">没有匹配岗位，换个筛选条件试试。</p>
          )}
        </div>
      </section>
    </main>
  );
}
