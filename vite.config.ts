import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  // lazy import() of cubing/twisty would otherwise trigger a re-optimize that breaks already-open pages
  optimizeDeps: { include: ["cubing/twisty"] },
  cacheDir: process.env.VITE_CACHE_DIR,
  server: { host: "0.0.0.0", port: 4317, strictPort: true },
  preview: { host: "0.0.0.0", port: 4318, strictPort: true },
});
