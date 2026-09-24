import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt": a new version waits until the user taps Refresh, so an update
      // never reloads the page in the middle of an emergency or a half-filled form.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'BCHS DRRM Management System',
        short_name: 'BCHS DRRM',
        description: 'School Disaster Risk Reduction and Management: hazards, drills, incidents and emergency information.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#1d4ed8',
        background_color: '#f8fafc',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Emergency information', short_name: 'Emergency info', url: '/info', icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // The public /info page's live data: try the network, but if it is
            // slow or offline fall back to the last copy. The page checks the
            // server timestamp inside it, so a cached copy is never shown as "live".
            urlPattern: ({ url }) => url.pathname === '/api/public/info',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'public-info',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Lets the frontend call /api/... during dev without CORS juggling.
      // Matches CLIENT_ORIGIN=http://localhost:5173 in the backend .env.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
