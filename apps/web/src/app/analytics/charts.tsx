"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsCharts({
  byCity,
  salaryByCity,
}: {
  byCity: Array<{ city: string; count: number }>;
  salaryByCity: Array<{
    city: string;
    count: number;
    medianMin: number | null;
    medianMax: number | null;
  }>;
}) {
  const salaryData = salaryByCity.map((r) => ({
    city: r.city,
    medianMin: r.medianMin ?? 0,
    medianMax: r.medianMax ?? 0,
    count: r.count,
  }));

  return (
    <div className="grid grid-2">
      <div className="panel">
        <h2>岗位 × 城市数量</h2>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={byCity.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" />
              <XAxis dataKey="city" stroke="#8b9bb4" />
              <YAxis stroke="#8b9bb4" />
              <Tooltip />
              <Bar dataKey="count" fill="#3d9cf0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel">
        <h2>城市 × 薪资中位数（元/月）</h2>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={salaryData.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" />
              <XAxis dataKey="city" stroke="#8b9bb4" />
              <YAxis stroke="#8b9bb4" />
              <Tooltip />
              <Bar dataKey="medianMin" fill="#3ecf8e" name="中位下限" />
              <Bar dataKey="medianMax" fill="#f0a03d" name="中位上限" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!salaryData.some((d) => d.medianMin || d.medianMax) && (
          <p className="muted">
            暂无解析到薪资数值。列表 salaryDesc
            为空时请用详情接口（--detail）补全。
          </p>
        )}
      </div>
    </div>
  );
}
