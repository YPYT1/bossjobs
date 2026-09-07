import { JobStore } from "@bossjobs/core";

export function getTask(taskId: string) {
  const store = new JobStore();
  try {
    return store.getTask(taskId);
  } finally {
    store.close();
  }
}

export function listTasks(limit = 20) {
  const store = new JobStore();
  try {
    return store.listTasks(limit);
  } finally {
    store.close();
  }
}

export function createCollectTask(input: {
  platform: string;
  city: string;
  keyword: string;
  pages: number;
}) {
  const store = new JobStore();
  try {
    return store.createTask({
      platform: input.platform as "boss" | "zhilian" | "yupao",
      city: input.city,
      keyword: input.keyword,
      pages: input.pages,
    });
  } finally {
    store.close();
  }
}

export function markTaskFailed(taskId: string, error: string) {
  const store = new JobStore();
  try {
    store.updateTask(taskId, {
      status: "failed",
      error,
      finished: true,
    });
  } finally {
    store.close();
  }
}
