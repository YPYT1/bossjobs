import type { Platform, SearchInput } from "@bossjobs/core";
import { createCollectTask, markTaskFailed } from "./tasks";

type Runner = {
  promise: Promise<unknown>;
};

const g = globalThis as typeof globalThis & {
  __bossjobsRunners?: Map<string, Runner>;
};

function runners() {
  if (!g.__bossjobsRunners) g.__bossjobsRunners = new Map();
  return g.__bossjobsRunners;
}

/**
 * Start collect in background. Playwright is loaded only here (dynamic),
 * so status/list routes never pull browser deps into the webpack graph.
 */
export function startCollectTask(input: SearchInput & { keywords?: string[] }) {
  const taskId = createCollectTask({
    platform: input.platform,
    city: input.city,
    keyword: input.keywords?.join(",") ?? input.keyword,
    pages: input.exhaust ? 999 : (input.pages ?? 1),
  });

  const promise = (async () => {
    const { collectJobs } = await import("@bossjobs/adapters");
    await collectJobs(input, {
      taskId,
      headless: false,
    });
  })().catch((err) => {
    markTaskFailed(
      taskId,
      err instanceof Error ? err.message : String(err),
    );
  });

  runners().set(taskId, { promise });
  return taskId;
}

export type { Platform };
