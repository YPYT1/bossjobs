import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "BossJobs",
  description: "本地岗位情报台",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <nav className="nav">
            <Link className="brand" href="/">
              BossJobs
            </Link>
            <Link href="/jobs">岗位</Link>
            <Link href="/tasks">采集</Link>
            <Link href="/analytics">分析</Link>
            <Link href="/companies">公司</Link>
            <Link href="/settings">设置</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
