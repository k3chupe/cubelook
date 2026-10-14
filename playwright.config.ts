import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const chrome = ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome"].find((p) => existsSync(p));

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4330",
    launchOptions: chrome ? { executablePath: chrome } : {},
  },
  webServer: {
    command: "npx vite --port 4330 --strictPort",
    url: "http://127.0.0.1:4330",
    reuseExistingServer: true,
    // separate dep cache, so e2e runs don't invalidate the dev server's
    env: { VITE_CACHE_DIR: "node_modules/.vite-e2e" },
  },
});
