import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devApiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    // sockjs-client (STOMP/SockJS) expects Node's `global` in the browser bundle
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['sockjs-client', '@stomp/stompjs'],
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: devApiTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@context': fileURLToPath(new URL('./src/context', import.meta.url)),
        '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      },
    },
  }
})
