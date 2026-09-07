import fs from "node:fs";
import path from "node:path";
import { getConfigPath } from "./paths.js";

export interface BossJobsConfig {
  company?: {
    provider?: "cnbizapi" | "null";
    apiKey?: string;
    baseUrl?: string;
  };
  browser?: {
    headless?: boolean;
    cdpUrl?: string;
  };
}

export function loadConfig(): BossJobsConfig {
  const p = getConfigPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as BossJobsConfig;
  } catch {
    return {};
  }
}

export function saveConfig(cfg: BossJobsConfig): void {
  const p = getConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2), "utf8");
}
