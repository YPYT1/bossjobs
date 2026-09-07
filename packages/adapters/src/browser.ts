import fs from "node:fs";
import path from "node:path";
import {
  getBrowserProfileDir,
  getCredentialsDir,
} from "@bossjobs/core";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

export interface BrowserManagerOptions {
  /** Persistent profile directory. Default: ~/.bossjobs/browser-profile */
  userDataDir?: string;
  /** If set, connect to existing Chrome instead of launching. */
  cdpUrl?: string;
  headless?: boolean;
  /** Remote debugging port when launching (for later CDP reconnect). */
  debuggingPort?: number;
}

/**
 * Manages the dedicated "bossjobs" Chrome profile via Playwright.
 * REQ-AUTH-001 / REQ-AUTH-002 / REQ-TECH-004
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private readonly opts: Required<
    Pick<BrowserManagerOptions, "userDataDir" | "headless" | "debuggingPort">
  > &
    Pick<BrowserManagerOptions, "cdpUrl">;

  constructor(options: BrowserManagerOptions = {}) {
    this.opts = {
      userDataDir: options.userDataDir ?? getBrowserProfileDir(),
      cdpUrl: options.cdpUrl ?? process.env.BOSSJOBS_CDP_URL,
      headless: options.headless ?? false,
      debuggingPort: options.debuggingPort ?? 9222,
    };
  }

  get userDataDir(): string {
    return this.opts.userDataDir;
  }

  async launch(): Promise<BrowserContext> {
    if (this.context) return this.context;

    fs.mkdirSync(this.opts.userDataDir, { recursive: true });

    if (this.opts.cdpUrl) {
      this.browser = await chromium.connectOverCDP(this.opts.cdpUrl);
      const existing = this.browser.contexts()[0];
      if (!existing) {
        throw new Error(`No browser context on CDP ${this.opts.cdpUrl}`);
      }
      this.context = existing;
      return this.context;
    }

    this.context = await chromium.launchPersistentContext(this.opts.userDataDir, {
      headless: this.opts.headless,
      channel: "chrome",
      args: [
        `--remote-debugging-port=${this.opts.debuggingPort}`,
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
      viewport: { width: 1440, height: 900 },
      locale: "zh-CN",
      // Avoid starting stuck on a dead blank tab with no navigation target.
      ignoreHTTPSErrors: true,
    });

    return this.context;
  }

  /**
   * Reuse an existing tab when possible (persistent Chrome already opens about:blank).
   * Avoids piling up empty tabs that look like a “黑白屏”.
   */
  async getPage(): Promise<Page> {
    const ctx = await this.launch();
    for (const p of ctx.pages()) {
      if (!p.isClosed()) return p;
    }
    return ctx.newPage();
  }

  async newPage(): Promise<Page> {
    return this.getPage();
  }

  async importCookiesFromFile(
    platform: "boss" | "zhilian",
    filePath?: string,
  ): Promise<number> {
    const credPath =
      filePath ?? path.join(getCredentialsDir(), `${platform}.json`);
    if (!fs.existsSync(credPath)) {
      throw new Error(`Cookie file not found: ${credPath}`);
    }
    const raw = fs.readFileSync(credPath, "utf8").trim();
    const cookies = parseCookiePayload(raw, platform);
    const ctx = await this.launch();
    await ctx.addCookies(cookies);
    return cookies.length;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      return;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}

function defaultDomain(platform: "boss" | "zhilian"): string {
  return platform === "boss" ? ".zhipin.com" : ".zhaopin.com";
}

type CookieInput = Parameters<BrowserContext["addCookies"]>[0][number];

export function parseCookiePayload(
  raw: string,
  platform: "boss" | "zhilian",
): CookieInput[] {
  const domain = defaultDomain(platform);
  if (raw.startsWith("[")) {
    const arr = JSON.parse(raw) as Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
    }>;
    return arr.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain ?? domain,
      path: c.path ?? "/",
    }));
  }

  // Header style: a=b; c=d
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq <= 0) throw new Error(`Invalid cookie pair: ${part}`);
      return {
        name: part.slice(0, eq).trim(),
        value: part.slice(eq + 1).trim(),
        domain,
        path: "/",
      };
    });
}
