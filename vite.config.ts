import { defineConfig, type PluginOption } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wranglerConfig = path.resolve(__dirname, 'wrangler.jsonc')

function shouldUseCloudflare() {
  // workerd has no Android/Termux binary. Keep the Cloudflare plugin out of
  // local Android builds unless CF_BUILD=1 is explicitly set.
  if (process.platform === 'android') {
    return process.env.CF_BUILD === '1'
  }
  return true
}

export default defineConfig(async () => {
  const plugins: PluginOption[] = []

  if (shouldUseCloudflare()) {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    plugins.push(
      cloudflare({
        viteEnvironment: { name: 'ssr' },
        configPath: wranglerConfig,
        config: {
          main: '@tanstack/react-start/server-entry',
        },
      }),
    )
  }

  plugins.push(tanstackStart(), viteReact(), tailwindcss())

  return {
    plugins,
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      pool: 'threads',
      maxWorkers: 1,
      server: {
        deps: {
          inline: [/react/, /react-dom/],
        },
      },
    },
  }
})
