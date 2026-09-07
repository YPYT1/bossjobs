"use client";

import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";

type Report = {
  total: number;
  byCity: Array<{ city: string; count: number }>;
  salaryByCity: Array<{
    city: string;
    count: number;
    medianMin: number | null;
    medianMax: number | null;
  }>;
};

const ink = "#152033";
const muted = "#6b7789";
const line = "rgba(21, 32, 51, 0.08)";
const accent = "#0f766e";
const accent2 = "#1d4ed8";

export default function AnalyticsPage() {
  const [keyword, setKeyword] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  async function load(kw = keyword) {
    const p = new URLSearchParams({ analytics: "1", limit: "5000" });
    if (kw) p.set("keyword", kw);
    const res = await fetch(`/api/jobs?${p}`);
    const json = await res.json();
    if (json.ok) setReport(json.data as Report);
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cityOption = useMemo(() => {
    const data = report?.byCity.slice(0, 12) ?? [];
    return {
      backgroundColor: "transparent",
      textStyle: { color: ink, fontFamily: "Manrope, sans-serif" },
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 12, top: 28, bottom: 36 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.city),
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: line } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: line } },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => d.count),
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: accent },
                { offset: 1, color: accent2 },
              ],
            },
          },
          animationDuration: 800,
        },
      ],
    };
  }, [report]);

  const salaryOption = useMemo(() => {
    const data = report?.salaryByCity.slice(0, 12) ?? [];
    return {
      backgroundColor: "transparent",
      textStyle: { color: ink, fontFamily: "Manrope, sans-serif" },
      tooltip: { trigger: "axis" },
      legend: {
        data: ["中位下限", "中位上限"],
        textStyle: { color: muted },
      },
      grid: { left: 50, right: 12, top: 40, bottom: 36 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.city),
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: line } },
      },
      yAxis: {
        type: "value",
        name: "元/月",
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: line } },
      },
      series: [
        {
          name: "中位下限",
          type: "bar",
          data: data.map((d) => d.medianMin ?? 0),
          itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] },
          animationDuration: 900,
        },
        {
          name: "中位上限",
          type: "bar",
          data: data.map((d) => d.medianMax ?? 0),
          itemStyle: { color: accent2, borderRadius: [6, 6, 0, 0] },
          animationDuration: 1000,
        },
      ],
    };
  }, [report]);

  return (
    <main>
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="hero-kicker">Insights</p>
        <h1>数据分析</h1>
        <p>按城市看岗位密度与薪资中位，样本来自本地库。</p>
      </motion.section>

      <motion.div
        className="surface"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void load(keyword);
          }}
        >
          <div>
            <label>关键词过滤</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Agent开发"
            />
          </div>
          <button type="submit">分析</button>
        </form>
        <p className="muted" style={{ marginBottom: 0 }}>
          样本 {report?.total ?? 0} 条
        </p>
      </motion.div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <motion.div
          className="surface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <h2 className="page-title" style={{ fontSize: "1.25rem", marginBottom: 8 }}>
            岗位 × 城市
          </h2>
          <ReactECharts
            option={cityOption}
            style={{ height: 320 }}
            opts={{ renderer: "canvas" }}
          />
        </motion.div>
        <motion.div
          className="surface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="page-title" style={{ fontSize: "1.25rem", marginBottom: 8 }}>
            城市 × 薪资中位数
          </h2>
          <ReactECharts
            option={salaryOption}
            style={{ height: 320 }}
            opts={{ renderer: "canvas" }}
          />
          {!report?.salaryByCity.some((d) => d.medianMin || d.medianMax) && (
            <p className="muted">暂无解析薪资。重新采集后薪资会从列表/详情明文入库。</p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
