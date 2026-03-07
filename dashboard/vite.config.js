import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@react-three/fiber': path.resolve(__dirname, 'node_modules/@react-three/fiber'),
      '@react-three/drei': path.resolve(__dirname, 'node_modules/@react-three/drei'),
      '@react-three/postprocessing': path.resolve(__dirname, 'node_modules/@react-three/postprocessing'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
