import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: parseInt(process.env.VITE_PORT || '5173'),
    strictPort: false, // Si le port est occupé, utiliser le suivant
    cors: true,
  }
})
