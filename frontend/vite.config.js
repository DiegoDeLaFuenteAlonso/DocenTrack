import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Necesario para acceder desde otra máquina / túnel (localhost.run, ngrok, etc.)
    host: true,
    port: 5173,
    strictPort: false,
    // Vite 6+ bloquea Host distinto de localhost: sin esto la URL pública devuelve error o página vacía
    allowedHosts: true,
    // HMR por HTTPS (túnel): sin esto el JS puede cargar pero el websocket de recarga falla
    hmr: {
      protocol: 'wss',
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
