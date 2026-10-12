import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE_PATH || './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'Sala · Inventário',
          short_name: 'Inventário',
          description: 'Gestão simples do inventário da sala',
          lang: 'pt',
          start_url: './',
          scope: './',
          display: 'standalone',
          background_color: '#f5f4ef',
          theme_color: '#176b5b',
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'], maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase')) return 'firebase'
            if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion') || id.includes('node_modules/react')) return 'ui'
            if (id.includes('node_modules/date-fns')) return 'dates'
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
