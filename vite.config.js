import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/server\/zohodatathon_function/, '')
      }
    }
  }
})