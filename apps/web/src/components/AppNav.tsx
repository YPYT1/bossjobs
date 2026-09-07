"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tasks", label: "采集" },
  { href: "/jobs", label: "岗位" },
  { href: "/analytics", label: "分析" },
  { href: "/companies", label: "公司" },
  { href: "/settings", label: "设置" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden />
          <span className="logo-text">BossJobs</span>
        </Link>
        <nav className="nav-links" aria-label="主导航">
          {LINKS.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "nav-link is-active" : "nav-link"}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
