"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type TaskRow = {
  id: string;
  platform: string;
  city: string;
  keyword: string;
  status: string;
  progress_json?: string | null;
  error?: string | null;
  created_at: string;
  finished_at?: string | null;
};

export default function TasksPage() {
  const [platform, setPlatform] = useState("boss");
  const [city, setCity] = useState("重庆");
  const [keyword, setKeyword] = useState("Agent开发");
  const [pages, setPages] = useState("10");
  const [exhaust, setExhaust] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);
  const [delayMs, setDelayMs] = useState("4500");
  const [jitterMs, setJitterMs] = useState("3500");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<TaskRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("准备就绪");

  const progress = useMemo(() => {
    if (!task?.progress_json) return null;
    try {
      return JSON.parse(task.progress_json) as {
        phase?: string;
        message?: string;
        page?: number;
        maxPages?: number;
        listed?: number;
        inserted?: number;
        skipped?: number;
      };
    } catch {
      return null;
    }
  }, [task?.progress_json]);

  const pct = useMemo(() => {
    if (!progress?.page || !progress?.maxPages) {
      if (task?.status === "done") return 100;
      if (task?.status === "running") return 12;
      return 0;
    }
    return Math.min(99, Math.round((progress.page / progress.maxPages) * 100));
  }, [progress, task?.status]);

  const refreshTasks = useCallback(async () => {
    const res = await fetch("/api/collect/status");
    const json = await res.json();
    if (json.ok) setTasks(json.data as TaskRow[]);
  }, []);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    if (!taskId) return;
    let stop = false;
    const tick = async () => {
      const res = await fetch(`/api/collect/status?id=${taskId}`);
      const json = await res.json();
      if (stop) return;
      if (json.ok) {
        const t = json.data as TaskRow;
        setTask(t);
        if (t.progress_json) {
          try {
            const p = JSON.parse(t.progress_json) as { message?: string };
            if (p.message) setLog(p.message);
          } catch {
            /* ignore */
          }
        }
        if (t.status === "done" || t.status === "failed") {
          setLoading(false);
          void refreshTasks();
          return;
        }
      }
      setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [taskId, refreshTasks]);

  async function start() {
    setLoading(true);
    setLog("正在启动采集任务…");
    setTask(null);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform,
          city,
          keyword,
          pages: Number(pages) || 10,
          exhaust,
          withDetail: true,
          skipExisting,
          delayMs: Number(delayMs) || 4500,
          jitterMs: Number(jitterMs) || 3500,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setLog(json.error?.message || "启动失败");
        setLoading(false);
        return;
      }
      setTaskId(json.data.taskId as string);
      setLog(`任务已创建：${json.data.taskId}`);
      void refreshTasks();
    } catch (e) {
      setLog(String(e));
      setLoading(false);
    }
  }

  const statusClass =
    task?.status === "done"
      ? "done"
      : task?.status === "failed"
        ? "failed"
        : loading
          ? "running"
          : "";

  return (
    <main>
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="hero-kicker">Collect</p>
        <h1>慢速全量采集</h1>
        <p>
          驱动本机 Chrome Profile 调用官方接口。默认慢翻页、抖动间隔、自动跳过已入库岗位。
        </p>
      </motion.section>

      <motion.div
        className="surface"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="grid grid-3">
          <div>
            <label>平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="boss">Boss 直聘</option>
              <option value="zhilian">智联招聘</option>
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
              placeholder="Agent开发"
            />
          </div>
          <div>
            <label>页数上限</label>
            <input value={pages} onChange={(e) => setPages(e.target.value)} />
          </div>
          <div>
            <label>页间隔 ms</label>
            <input
              value={delayMs}
              onChange={(e) => setDelayMs(e.target.value)}
            />
          </div>
          <div>
            <label>随机抖动 ms</label>
            <input
              value={jitterMs}
              onChange={(e) => setJitterMs(e.target.value)}
            />
          </div>
        </div>

        <div className="check-row">
          <label className="check">
            <input
              type="checkbox"
              checked={exhaust}
              onChange={(e) => setExhaust(e.target.checked)}
            />
            翻页直到无新岗位
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={skipExisting}
              onChange={(e) => setSkipExisting(e.target.checked)}
            />
            跳过库中已有
          </label>
          <span className="muted">默认抓取岗位 JD 与公司全称</span>
        </div>

        <div className="actions">
          <button type="button" disabled={loading} onClick={start}>
            {loading ? "采集进行中…" : "开始采集"}
          </button>
          <Link className="btn ghost" href="/jobs">
            查看岗位库
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {(loading || task) && (
          <motion.div
            className="surface"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 14 }}
          >
            <div className="toolbar">
              <span
                className={`status ${statusClass} ${loading ? "live" : ""}`}
              >
                {task?.status === "done"
                  ? "已完成"
                  : task?.status === "failed"
                    ? "失败"
                    : "采集中"}
              </span>
              <span className="tag">{taskId || "-"}</span>
            </div>
            <div className="progress">
              <i style={{ width: `${pct}%` }} />
            </div>
            <p style={{ margin: 0 }}>{log}</p>
            {progress && (
              <p className="muted" style={{ marginBottom: 0 }}>
                页 {progress.page ?? "-"}/{progress.maxPages ?? "-"} · 列表{" "}
                {progress.listed ?? 0} · 新增 {progress.inserted ?? 0} · 跳过{" "}
                {progress.skipped ?? 0}
              </p>
            )}
            {task?.error && (
              <p style={{ color: "var(--danger)", marginBottom: 0 }}>
                {task.error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="section" style={{ marginTop: 32 }}>
        <div className="section-head">
          <h2>最近任务</h2>
        </div>
        <div className="surface" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <table className="data">
            <thead>
              <tr>
                <th>时间</th>
                <th>平台</th>
                <th>城市</th>
                <th>关键词</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="muted">{t.created_at}</td>
                  <td>{t.platform}</td>
                  <td>{t.city}</td>
                  <td>{t.keyword}</td>
                  <td>
                    <span className={`status ${t.status}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    暂无任务记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
