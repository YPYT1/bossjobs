#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import {
  BossAdapter,
  BrowserManager,
  ZhilianAdapter,
} from "@bossjobs/adapters";
import {
  getBrowserProfileDir,
  getCredentialsDir,
  getDbPath,
  JobStore,
  type Platform,
} from "@bossjobs/core";

const program = new Command();
program.name("bossjobs").description("BossJobs CLI — 岗位采集 / 分析 / AI 工具").version("0.1.0");

function printJson(ok: boolean, data: unknown, error?: { code: string; message: string }) {
  if (ok) {
    process.stdout.write(JSON.stringify({ ok: true, data }, null, 2) + "\n");
  } else {
    process.stdout.write(
      JSON.stringify({ ok: false, error }, null, 2) + "\n",
    );
    process.exitCode = 1;
  }
}

program
  .command("db")
  .command("path")
  .description("打印本地 SQLite 路径")
  .option("--json", "JSON 输出")
  .action((opts: { json?: boolean }) => {
    const p = getDbPath();
    if (opts.json) printJson(true, { path: p });
    else console.log(p);
  });

const auth = program.command("auth").description("登录态 / Cookie");

auth
  .command("setup")
  .description("启动 bossjobs Chrome Profile，请手动登录 Boss/智联")
  .action(async () => {
    const dir = getBrowserProfileDir();
    fs.mkdirSync(dir, { recursive: true });
    console.error(`Profile 目录: ${dir}`);
    console.error("正在启动 Chrome，请在打开的浏览器中登录 zhipin.com 与 zhaopin.com …");
    const browser = new BrowserManager({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://www.zhipin.com/web/user/?ka=header-login", {
      waitUntil: "domcontentloaded",
    });
    console.error("登录完成后按 Ctrl+C 结束（登录态会保留在 Profile 中）");
    // Keep process alive until user stops
    await new Promise(() => undefined);
  });

auth
  .command("status")
  .description("检查 Boss/智联登录是否可用")
  .option("--json", "JSON 输出")
  .action(async (opts: { json?: boolean }) => {
    const browser = new BrowserManager({ headless: false });
    try {
      const boss = new BossAdapter({ browser });
      const zl = new ZhilianAdapter({ browser });
      const [bossStatus, zlStatus] = await Promise.all([
        boss.ensureAuth(),
        zl.ensureAuth(),
      ]);
      const data = { boss: bossStatus, zhilian: zlStatus };
      if (opts.json) printJson(true, data);
      else console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (opts.json) printJson(false, null, { code: "AUTH_STATUS_FAILED", message });
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
  .description("导入 Cookie 文本或 JSON 文件")
  .requiredOption("--platform <platform>", "boss | zhilian")
  .option("--file <path>", "Cookie 文件路径")
  .option("--text <cookie>", "直接粘贴 Cookie 字符串")
  .option("--json", "JSON 输出")
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
          message: "platform must be boss|zhilian",
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
          message: "Provide --file or --text",
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
  .description("采集岗位并写入本地库")
  .requiredOption("--platform <platform>", "boss | zhilian")
  .requiredOption("--city <city>", "城市，如 重庆")
  .requiredOption("--keyword <keyword>", "关键词")
  .option("--pages <n>", "页数", "1")
  .option("--detail", "抓取详情 JD")
  .option("--json", "JSON 输出")
  .action(
    async (opts: {
      platform: string;
      city: string;
      keyword: string;
      pages: string;
      detail?: boolean;
      json?: boolean;
    }) => {
      const platform = opts.platform as Platform;
      const browser = new BrowserManager({ headless: false });
      const store = new JobStore();
      try {
        const adapter =
          platform === "boss"
            ? new BossAdapter({ browser })
            : platform === "zhilian"
              ? new ZhilianAdapter({ browser })
              : null;
        if (!adapter) {
          printJson(false, null, {
            code: "INVALID_PLATFORM",
            message: "platform must be boss|zhilian",
          });
          return;
        }
        const list = await adapter.search({
          city: opts.city,
          keyword: opts.keyword,
          pages: Number(opts.pages) || 1,
        });
        const saved = [];
        for (const item of list) {
          let detail;
          if (opts.detail) {
            detail = await adapter.fetchDetail({
              platform,
              platformJobId: item.platformJobId,
              detailContext: item.detailContext,
              jobUrl: item.jobUrl,
            });
          }
          saved.push(
            store.upsertFromListItem(item, opts.keyword, {
              jd: detail?.jd,
              restPolicy: detail?.restPolicy,
              isDoubleOff: detail?.isDoubleOff,
            }),
          );
        }
        const data = { count: saved.length, jobs: saved };
        if (opts.json) printJson(true, data);
        else console.log(`Saved ${saved.length} jobs -> ${getDbPath()}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (opts.json) printJson(false, null, { code: "COLLECT_FAILED", message });
        else {
          console.error(message);
          process.exitCode = 1;
        }
      } finally {
        store.close();
        await browser.close();
      }
    },
  );

program
  .command("jobs")
  .description("查询本地岗位")
  .option("--city <city>")
  .option("--keyword <keyword>")
  .option("--platform <platform>")
  .option("--limit <n>", "50")
  .option("--json", "JSON 输出")
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

await program.parseAsync(process.argv);
