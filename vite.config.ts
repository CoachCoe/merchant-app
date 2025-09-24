import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/frontend',
  publicDir: 'public',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/frontend/index.html')
      }
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/initiate-payment': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/scan-wallet': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/cancel-payment': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/generate-qr': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/transaction-history': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/supported-chains': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
