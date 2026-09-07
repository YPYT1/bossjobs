#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import {
  BrowserManager,
  collectJobs,
  createAdapter,
} from "@bossjobs/adapters";
import {
  analyzeFromStore,
  CompanyStore,
  createCompanyProvider,
  getBrowserProfileDir,
  getCredentialsDir,
  getDbPath,
  JobStore,
  loadConfig,
  saveConfig,
  type Platform,
} from "@bossjobs/core";

const program = new Command();
program
  .name("bossjobs")
  .description("BossJobs CLI — 薄浏览器会话 + 官方接口采集 / 分析 / AI")
  .version("0.1.0");

function printJson(
  ok: boolean,
  data: unknown,
  error?: { code: string; message: string },
) {
  if (ok) {
    process.stdout.write(JSON.stringify({ ok: true, data }, null, 2) + "\n");
  } else {
    process.stdout.write(
      JSON.stringify({ ok: false, error }, null, 2) + "\n",
    );
    process.exitCode = 1;
  }
}

const dbCmd = program.command("db").description("数据库");
dbCmd
  .command("path")
  .description("打印本地 SQLite 路径")
  .option("--json", "JSON 输出")
  .action((opts: { json?: boolean }) => {
    const p = getDbPath();
    if (opts.json) printJson(true, { path: p });
    else console.log(p);
  });

const auth = program.command("auth").description("登录态 / Cookie / Profile");

auth
  .command("setup")
  .description("启动 bossjobs Chrome Profile，手动登录 Boss/智联")
  .action(async () => {
    const dir = getBrowserProfileDir();
    fs.mkdirSync(dir, { recursive: true });
    console.error(`Profile: ${dir}`);
    console.error("请在打开的浏览器登录 zhipin.com 与 zhaopin.com，完成后 Ctrl+C");
    const browser = new BrowserManager({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://www.zhipin.com/web/user/?ka=header-login", {
      waitUntil: "domcontentloaded",
    });
    await new Promise(() => undefined);
  });

auth
  .command("status")
  .description("检查 Boss/智联 API 是否可用")
  .option("--json")
  .action(async (opts: { json?: boolean }) => {
    const browser = new BrowserManager({ headless: false });
    try {
      const boss = createAdapter("boss", browser);
      const zl = createAdapter("zhilian", browser);
      const data = {
        boss: await boss.ensureAuth(),
        zhilian: await zl.ensureAuth(),
        profile: getBrowserProfileDir(),
      };
      if (opts.json) printJson(true, data);
      else console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (opts.json)
        printJson(false, null, { code: "AUTH_STATUS_FAILED", message });
      else {
        console.error(message);
        process.exitCode = 1;
      }
    } finally {
      await browser.close();
    }
  });

auth
  .command("import-cookie")
  .requiredOption("--platform <platform>", "boss | zhilian")
  .option("--file <path>")
  .option("--text <cookie>")
  .option("--json")
  .action(
    async (opts: {
      platform: string;
      file?: string;
      text?: string;
      json?: boolean;
    }) => {
      const platform = opts.platform as Platform;
      if (platform !== "boss" && platform !== "zhilian") {
        printJson(false, null, {
          code: "INVALID_PLATFORM",
          message: "boss|zhilian",
        });
        return;
      }
      fs.mkdirSync(getCredentialsDir(), { recursive: true });
      const target = path.join(getCredentialsDir(), `${platform}.json`);
      let raw = opts.text;
      if (!raw && opts.file) raw = fs.readFileSync(opts.file, "utf8");
      if (!raw) {
        printJson(false, null, {
          code: "NO_COOKIE",
          message: "--file or --text required",
        });
        return;
      }
      fs.writeFileSync(target, raw.trim(), "utf8");
      const browser = new BrowserManager({ headless: true });
      try {
        const count = await browser.importCookiesFromFile(platform, target);
        if (opts.json) printJson(true, { saved: target, cookies: count });
        else console.log(`Saved ${count} cookies -> ${target}`);
      } finally {
        await browser.close();
      }
    },
  );

program
  .command("collect")
  .description("采集岗位（薄浏览器 + 官方接口）")
  .requiredOption("--platform <platform>", "boss | zhilian")
  .requiredOption("--city <city>", "城市")
  .option("--keyword <keyword>", "单个关键词")
  .option("--keywords <list>", "多关键词，逗号分隔")
  .option("--pages <n>", "页数", "1")
  .option("--detail", "抓详情 JD/薪资")
  .option("--json")
  .action(
    async (opts: {
      platform: string;
      city: string;
      keyword?: string;
      keywords?: string;
      pages: string;
      detail?: boolean;
      json?: boolean;
    }) => {
      const platform = opts.platform as Platform;
      const keywords = opts.keywords
        ? opts.keywords.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
        : opts.keyword
          ? [opts.keyword]
          : [];
      if (!keywords.length) {
        printJson(false, null, {
          code: "NO_KEYWORD",
          message: "--keyword or --keywords required",
        });
        return;
      }
      try {
        const results = await collectJobs({
          platform,
          city: opts.city,
          keyword: keywords[0]!,
          keywords,
          pages: Number(opts.pages) || 1,
          withDetail: Boolean(opts.detail),
        });
        const data = {
          db: getDbPath(),
          results,
          total: results.reduce((a, r) => a + r.count, 0),
        };
        if (opts.json) printJson(true, data);
        else console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (opts.json)
          printJson(false, null, { code: "COLLECT_FAILED", message });
        else {
          console.error(message);
          process.exitCode = 1;
        }
      }
    },
  );

program
  .command("jobs")
  .option("--city <city>")
  .option("--keyword <keyword>")
  .option("--platform <platform>")
  .option("--limit <n>", "50")
  .option("--json")
  .action(
    (opts: {
      city?: string;
      keyword?: string;
      platform?: string;
      limit?: string;
      json?: boolean;
    }) => {
      const store = new JobStore();
      try {
        const rows = store.list({
          city: opts.city,
          keyword: opts.keyword,
          platform: opts.platform as Platform | undefined,
          limit: Number(opts.limit) || 50,
        });
        if (opts.json) printJson(true, { count: rows.length, jobs: rows });
        else console.log(JSON.stringify(rows, null, 2));
      } finally {
        store.close();
      }
    },
  );

program
  .command("analyze")
  .description("城市数量 / 薪资分析")
  .argument("[kind]", "salary | city", "salary")
  .option("--keyword <keyword>")
  .option("--platform <platform>")
  .option("--json")
  .action(
    (
      kind: string,
      opts: { keyword?: string; platform?: string; json?: boolean },
    ) => {
      const store = new JobStore();
      try {
        const report = analyzeFromStore(store, {
          keyword: opts.keyword,
          platform: opts.platform as Platform | undefined,
        });
        const data =
          kind === "city"
            ? { total: report.total, byCity: report.byCity }
            : report;
        if (opts.json) printJson(true, data);
        else console.log(JSON.stringify(data, null, 2));
      } finally {
        store.close();
      }
    },
  );

program
  .command("company")
  .description("公司背调（CNBizAPI / null）")
  .argument("<name>", "公司名称")
  .option("--refresh", "强制刷新")
  .option("--json")
  .action(
    async (name: string, opts: { refresh?: boolean; json?: boolean }) => {
      const store = new JobStore();
      const companies = new CompanyStore(store.db);
      try {
        if (!opts.refresh) {
          const cached = companies.getByName(name);
          if (cached?.enriched_at) {
            if (opts.json) printJson(true, { source: "cache", company: cached });
            else console.log(JSON.stringify(cached, null, 2));
            return;
          }
        }
        const cfg = loadConfig();
        const provider = createCompanyProvider({
          provider: cfg.company?.provider ?? (process.env.CNBIZAPI_KEY ? "cnbizapi" : "null"),
          apiKey: cfg.company?.apiKey ?? process.env.CNBIZAPI_KEY,
          baseUrl: cfg.company?.baseUrl,
        });
        const enrichment = await provider.lookup(name);
        companies.upsert(enrichment);
        const row = companies.getByName(name);
        if (opts.json)
          printJson(true, {
            source: provider.name,
            company: row,
            enrichment,
          });
        else console.log(JSON.stringify({ enrichment, row }, null, 2));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (opts.json)
          printJson(false, null, { code: "COMPANY_FAILED", message });
        else {
          console.error(message);
          process.exitCode = 1;
        }
      } finally {
        store.close();
      }
    },
  );

program
  .command("config")
  .description("写入本地配置")
  .option("--set-cnbiz-key <key>", "设置 CNBizAPI Key")
  .option("--json")
  .action((opts: { setCnbizKey?: string; json?: boolean }) => {
    const cfg = loadConfig();
    if (opts.setCnbizKey) {
      cfg.company = {
        ...(cfg.company ?? {}),
        provider: "cnbizapi",
        apiKey: opts.setCnbizKey,
      };
      saveConfig(cfg);
    }
    if (opts.json) printJson(true, { path: getConfigPathSafe(), config: mask(cfg) });
    else console.log(JSON.stringify(mask(cfg), null, 2));
  });

function getConfigPathSafe() {
  return path.join(
    process.env.BOSSJOBS_HOME ??
      path.join(
        process.env.USERPROFILE ?? process.env.HOME ?? ".",
        ".bossjobs",
      ),
    "config.json",
  );
}

function mask(cfg: ReturnType<typeof loadConfig>) {
  const c = structuredClone(cfg);
  if (c.company?.apiKey) c.company.apiKey = "***";
  return c;
}

await program.parseAsync(process.argv);
