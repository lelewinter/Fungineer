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
    // Loopback only by default — exposing the dev server on the LAN combined
    // with Vite's `@fs` route lets anyone on the network read project files.
    // Set VITE_DEV_HOST=true if you need LAN access (e.g. mobile testing) and
    // accept the trust trade-off.
    host: process.env.VITE_DEV_HOST === 'true' ? true : '127.0.0.1',
    port: 5173,
    open: false,
    fs: {
      // public/assets is a symlink to ../../assets (the original Godot art/audio).
      // Restrict reads to the repo root only; previously '..' + '../..' walked
      // one level above the repo, which is unnecessary for the asset symlink.
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
