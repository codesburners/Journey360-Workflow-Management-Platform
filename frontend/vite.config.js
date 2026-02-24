import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Expose on LAN so phones can connect via 192.168.x.x:5173
    allowedHosts: true, // Allow tunnel hosts like localtunnel
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/trip': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/trips': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/test-auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/debug': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/saved-places': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/api/transport': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
