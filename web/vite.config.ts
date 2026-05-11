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
    host: process.env.VITE_DEV_HOST === 'true' ? true : '127.0.0.1',
    port: 5173,
    open: false,
    fs: {
      // public/assets is a symlink to ../../assets (the original Godot art/audio).
      strict: true,
      allow: ['..'],
      deny: ['.env', '.env.*', '**/.env', '**/.env.*'],
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
