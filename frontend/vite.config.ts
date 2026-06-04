import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    open: false,
    fs: {
      // public/assets is a symlink to ../../assets (the original Godot art/audio).
      allow: ['..', '../..'],
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
