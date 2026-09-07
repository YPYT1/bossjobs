import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/live.smoke.test.ts"],
  },
});
