import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/app/',
  plugins: [react()],
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