import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "#runtime-env": path.resolve("src/server/env.node.ts") },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    maxWorkers: 1,
    testTimeout: 15000,
  },
});
