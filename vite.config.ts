import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tauri očakáva relatívne cesty pre assety
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    commonjsOptions: {
      include: [/xlsx/, /node_modules/]
    }
  },
  optimizeDeps: {
    include: ['xlsx']
  },
  server: {
    port: 5173,
    strictPort: true
  }
});