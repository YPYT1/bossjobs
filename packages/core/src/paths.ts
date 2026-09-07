import os from "node:os";
import path from "node:path";

export function getBossJobsHome(): string {
  const override = process.env.BOSSJOBS_HOME;
  if (override) return path.resolve(override);
  return path.join(os.homedir(), ".bossjobs");
}

export function getDbPath(): string {
  return path.join(getBossJobsHome(), "data.db");
}

export function getBrowserProfileDir(): string {
  return path.join(getBossJobsHome(), "browser-profile");
}

export function getCredentialsDir(): string {
  return path.join(getBossJobsHome(), "credentials");
}

export function getConfigPath(): string {
  return path.join(getBossJobsHome(), "config.json");
}
