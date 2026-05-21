import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const resolvePath = (relativePath: string) =>
  new URL(relativePath, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/conversations': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/chat': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/user-profiles': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/notifications': { 
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/api/friends': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@components': resolvePath('./src/components'),
      '@pages': resolvePath('./src/pages'),
      '@services': resolvePath('./src/services'),
      '@context': resolvePath('./src/context'),
      '@types': resolvePath('./src/types'),
      '@utils': resolvePath('./src/utils'),
    },
  },
})
