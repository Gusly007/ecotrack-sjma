import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/ecotrack-sjma/',
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime — petit chunk critique, chargé en premier
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Leaflet — 140 KiB, chargé uniquement sur les vues cartographiques
          'vendor-leaflet': ['leaflet', 'leaflet-draw'],
          // QR scanner — 200 KiB, chargé uniquement sur la vue scanner
          'vendor-qr': ['html5-qrcode'],
          // Charting et utilitaires
          'vendor-misc': ['axios', 'jwt-decode', 'react-easy-crop'],
        },
      },
    },
    // Activer la minification CSS (incluse dans Vite par défaut avec esbuild)
    cssCodeSplit: true,
    // Avertissement si un chunk dépasse 500 KiB
    chunkSizeWarningLimit: 500,
  },
})
