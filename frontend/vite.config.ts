import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows access from the local network
    port: 5174,       // You can set any available port
    open: true,       // Automatically opens the browser
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about dynamic imports
        if (warning.code === 'DYNAMIC_IMPORT') return;
        warn(warning);
      }
    },
    sourcemap: true, // Enable sourcemaps for better debugging
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 