import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';

// PWA manifest — keep in sync with index.html theme-color + apple-touch-icon.
// Display: 'fullscreen' on Android Chrome; iOS Safari falls back to 'standalone'.
// orientation 'landscape' is a *hint* — desktop browsers ignore it; mobile
// browsers usually respect it when launched from the home screen.
const pwaManifest: Partial<ManifestOptions> = {
  name: 'Fungineer',
  short_name: 'Fungineer',
  description: 'Anthology roguelike. Build a rocket, raid the AI-occupied Earth.',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  display_override: ['fullscreen', 'standalone', 'minimal-ui'],
  orientation: 'landscape',
  background_color: '#0a0a14',
  theme_color: '#0a0a14',
  lang: 'pt-BR',
  categories: ['games', 'entertainment'],
  prefer_related_applications: false,
  icons: [
    // SVG works for Chrome, Edge, Firefox, Samsung Internet, and Safari 16+.
    // We declare multiple `sizes` entries pointing to the same SVG so the
    // browser can pick the right "rendered size" — SVG scales losslessly.
    {
      src: 'pwa/icon.svg',
      sizes: '192x192 256x256 384x384 512x512',
      type: 'image/svg+xml',
      purpose: 'any',
    },
    {
      src: 'pwa/icon-maskable.svg',
      sizes: '192x192 256x256 384x384 512x512',
      type: 'image/svg+xml',
      purpose: 'maskable',
    },
  ],
};

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
    // Vite hashes JS/CSS automatically: e.g. assets/index-[hash].js. The
    // sourcemap stays on for prod debugging; remove if bundle size matters.
    sourcemap: true,
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  plugins: [
    VitePWA({
      // injectManifest mode = WE own the service worker source; Vite injects
      // the precache manifest (filenames + content hashes) at build time
      // via the `self.__WB_MANIFEST` placeholder inside our sw.ts.
      // This gives us a transparent, debuggable SW + automatic cache busting.
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      registerType: 'prompt', // we register manually in main.ts for full control
      injectRegister: false,

      // Manifest is emitted as `manifest.webmanifest` at the dist root.
      manifest: pwaManifest,
      // We hand-link the manifest in index.html (already present), so don't
      // inject another <link> automatically.
      manifestFilename: 'manifest.webmanifest',

      injectManifest: {
        // What gets precached on first install. Audio is too heavy (~100MB of
        // WAVs) so we keep it out of precache and serve from runtime cache.
        globPatterns: [
          '**/*.{js,css,html,svg,png,webp,woff2}',
        ],
        globIgnores: [
          // Keep audio out of precache (runtime cached instead).
          '**/audio/**',
          // Sourcemaps don't belong in user caches.
          '**/*.map',
        ],
        // 5 MB per-file cap on precache. Anything bigger -> runtime cache only.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      // Make the dev server load the SW too, so we can debug the update flow
      // locally before deploying. Disabled in `vite preview` by default
      // because we want the production SW behaviour there.
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
});
