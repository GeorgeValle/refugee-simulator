import path from "node:path";
import { sites } from "@openai/sites-vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react({ compiler: true }), tailwindcss(), sites()],
  build: {
    // Phaser is intentionally isolated in a lazy chunk (~1.2 MB minified, ~322 KB gzip).
    chunkSizeWarningLimit: 1_250,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
