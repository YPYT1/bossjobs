import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata = {
  title: "BossJobs",
  description: "本地岗位情报台 · 慢速全量采集",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <AppNav />
          <div className="page">{children}</div>
        </div>
      </body>
    </html>
  );
}
