import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

/// <reference types="vitest/config" />

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'HAVEN — The Sovereign Algorithm',
        short_name: 'HAVEN IDE',
        description: "Saudi Arabia's first sovereign AI development environment. Built by Sulaiman Alshammari.",
        theme_color: '#00ff41',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        dir: 'ltr',
        lang: 'en',
        categories: ['developer', 'productivity', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,woff,ttf}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB — Monaco chunks are large
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Cache Ollama API requests (don't cache — network only)
            urlPattern: /\/api\/(generate|chat|tags|show|ps|pull)/,
            handler: 'NetworkOnly',
          },
          {
            // Cache Monaco editor CDN resources
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-cdn-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Enable in dev with `true` for testing
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '/api'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
