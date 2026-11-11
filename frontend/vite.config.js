import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Proxy /api ke backend (port 3001) supaya frontend tidak kena masalah CORS
// saat development. Di production, frontend & backend bisa disajikan dari
// server yang sama.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
