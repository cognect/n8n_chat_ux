import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy n8n API requests to bypass CORS
      // Use /n8n-api/ (with trailing slash) to avoid intercepting /n8n-api-key.json static file
      '/n8n-api/': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, '/api'),
      },
    },
  },
})
