import { defineConfig } from '@tanstack/react-start/config'
import tailwindcss from '@tailwindcss/vite'

const appConfig = defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
    ],
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
  },
})

// Register the custom /api HTTP router in Vinxi
appConfig.routers.push({
  name: 'api',
  type: 'http',
  base: '/api',
  handler: './src/api-handler.ts',
  target: 'server',
})

export default appConfig
