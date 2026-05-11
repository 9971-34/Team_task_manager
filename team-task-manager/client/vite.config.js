import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    allowedHosts: ['tender-purpose-production-5b86.up.railway.app'],
    host: '0.0.0.0'
    port: 3000
  }
});