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
  // local builds; the deploy script explicitly sets CF_BUILD=1.
  return process.env.CF_BUILD === '1'
}

export default defineConfig(async () => {
  const plugins: PluginOption[] = []

  if (shouldUseCloudflare()) {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    plugins.push(
      cloudflare({
        viteEnvironment: { name: 'ssr' },
        configPath: wranglerConfig,
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
      server: {
        deps: {
          inline: [/react/, /react-dom/],
        },
      },
    },
  }
})
