import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ 
export default defineConfig({
  plugins: [react()],
  
  // Performance optimizations
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          vendor: ['react', 'react-dom'],
          // Separate large components
          charts: ['./src/components/charts/ServiceTimeline.jsx'],
          feeds: ['./src/components/feeds/UnifiedLiveFeedPanel.jsx'],
        }
      }
    },
    // Compress assets
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging but keep them separate
    sourcemap: true
  },
  
  // Optimize dev server
  optimizeDeps: {
    include: ['react', 'react-dom', '@vercel/analytics', '@vercel/speed-insights']
  },
  
  server: {
    proxy: {
      // Cloudflare API proxy - specific route must come first
      '^/api/cloudflare': {
        target: 'https://www.cloudflarestatus.com/api/v2',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // Parse the endpoint parameter from the URL
          const url = new URL(`http://localhost${path}`);
          const endpoint = url.searchParams.get('endpoint') || 'status';
          return `/${endpoint}.json`;
        }
      },

      // All other API requests go to external server
      '/api': {
        target: 'https://www.stack-status.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
