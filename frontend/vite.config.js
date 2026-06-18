import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces so Docker and dev containers can expose the port
    host: '0.0.0.0',
    // Read port from env var — must match FRONTEND_PORT in .env
    port: parseInt(process.env.FRONTEND_PORT || '5173'),
    strictPort: true,
    proxy: {
      // Proxy /api/* → backend during local dev and Docker.
      // In production (Vercel/Netlify), VITE_API_URL is set and there is
      // no dev server, so this proxy block is never used.
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    // Generate source maps for easier production debugging
    sourcemap: false,
    // Increase chunk warning limit slightly (recharts is large)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor bundles for better caching
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          charts:   ['recharts'],
          ui:       ['lucide-react', 'react-hot-toast'],
          network:  ['axios'],
        },
      },
    },
  },
})
