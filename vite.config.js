import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ 
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/cloudflare': {
        target: 'https://blog.cloudflare.com/rss/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/cloudflare/, ''),
      },
      '/api/zscaler': {
        target: 'https://trust.zscaler.com/blog-feed',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/zscaler/, ''),
      },
    },
  },
})
