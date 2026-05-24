import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/ecotrack-sjma/',
  plugins: [react()],
  server: {
    host: 'localhost',
    port: parseInt(process.env.VITE_PORT || '5173'),
    strictPort: false,
    cors: true,
  },
  optimizeDeps: {
    include: ['leaflet', 'leaflet-draw', 'html5-qrcode', 'react-easy-crop', 'axios', 'jwt-decode'],
  },
})
