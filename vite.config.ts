import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/v1': {
        target: 'https://api.maiscapinhas.com.br',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'logo.png'
      ],
      manifest: {
        name: 'Mais Capinhas ERP',
        short_name: 'MaisCapinhas',
        description: 'Sistema de gestão completo para lojas Mais Capinhas - Controle de vendas, metas, comissões e conferência de caixa',
        theme_color: '#7c3aed',
        background_color: '#0a0a0b',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: 'maiscapinhas-erp',
        categories: ['business', 'productivity', 'finance'],
        lang: 'pt-BR',
        dir: 'ltr',
        prefer_related_applications: false,
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Acessar dashboard principal',
            url: '/dashboard',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Lançar Turno',
            short_name: 'Turno',
            description: 'Lançar fechamento de turno',
            url: '/conferencia/lancar',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Divergências',
            short_name: 'Divergências',
            description: 'Ver turnos pendentes',
            url: '/conferencia/divergencias',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: '/logo.png',
            sizes: '500x300',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Mais Capinhas ERP - Sistema de Gestão',
          },
          {
            src: '/logo.png',
            sizes: '500x300',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mais Capinhas ERP - Mobile',
          },
        ],
        handle_links: 'preferred',
        launch_handler: {
          client_mode: ['navigate-existing', 'auto'],
        },
      },
      workbox: {
        // Globbing patterns for precache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Cache strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.maiscapinhas\.com\.br\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
        // Offline fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        // Skip waiting
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers
    target: 'es2020',
    // Minification
    minify: mode === 'production' ? 'esbuild' : false,
    // Source maps for debugging (external in prod)
    sourcemap: mode === 'production' ? 'hidden' : true,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          // UI components by category
          'vendor-ui-dialog': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
          'vendor-ui-menu': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-menubar', '@radix-ui/react-select'],
          'vendor-ui-form': ['@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-switch', '@radix-ui/react-label'],
          'vendor-ui-overlay': ['@radix-ui/react-tooltip', '@radix-ui/react-popover', '@radix-ui/react-hover-card'],
          'vendor-ui-misc': ['@radix-ui/react-tabs', '@radix-ui/react-accordion', '@radix-ui/react-separator'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Charts (lazy loaded)
          'vendor-charts': ['recharts'],
          // Forms
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utilities
          'vendor-utils': ['class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true,
  },
}));
