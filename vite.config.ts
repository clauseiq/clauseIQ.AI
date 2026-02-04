import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0) to fix "refused to connect" on some setups
    port: 3000,
    strictPort: true, // Don't switch ports silently
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
});