import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'https://zohodatathon-60074947232.development.catalystserverless.in/server/zohodatathon_function'
  const apiOrigin = new URL(apiBaseUrl).origin

  return {
    base: '/',
    plugins: [react()],
    build: {
      assetsDir: '',
      rollupOptions: {
        output: {
          entryFileNames: 'index-[hash].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash][extname]'
        }
      }
    },
    server: {
      proxy: {
        '/server/zohodatathon_function': {
          target: apiOrigin,
          changeOrigin: true,
          secure: true
        }
      }
    }
  }
})