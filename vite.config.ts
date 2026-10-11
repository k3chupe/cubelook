import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  server: { host: "0.0.0.0", port: 4317, strictPort: true },
  preview: { host: "0.0.0.0", port: 4318, strictPort: true },
});
