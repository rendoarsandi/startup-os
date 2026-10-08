import { defineConfig, type PluginOption } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wranglerConfig = path.resolve(__dirname, "wrangler.jsonc");

function shouldUseCloudflare() {
  return process.env.CF_BUILD === "1";
}

export default defineConfig(async () => {
  const plugins: PluginOption[] = [];

  if (shouldUseCloudflare()) {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.push(
      cloudflare({
        viteEnvironment: { name: "ssr" },
        configPath: wranglerConfig,
        config: {
          main: "./src/worker.ts",
        },
      }),
    );
  }

  plugins.push(tanstackStart(), viteReact(), tailwindcss());

  return {
    plugins,
    resolve: {
      alias: {
        "#runtime-env": path.resolve(
          __dirname,
          shouldUseCloudflare()
            ? "src/server/env.cloudflare.ts"
            : "src/server/env.node.ts",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
