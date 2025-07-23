import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ 
export default defineConfig({
  plugins: [react()],
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

      // For development, disable API proxying to prevent DNS errors
      // The API functions will need to be tested with `vercel dev` instead
      // Uncomment the line below if you want to proxy to production
      // '/api': {
      //   target: 'https://your-production-domain.vercel.app',
      //   changeOrigin: true,
      //   secure: true,
      // },
    },
  },
})
