import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No importamos tailwindcss aquí para evitar el error de "not defined"
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})