// vite.config.ts
import { defineConfig } from "file:///C:/Users/Usuario/Desktop/maiscapinhas/maiscapinhas-7d425b09/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Usuario/Desktop/maiscapinhas/maiscapinhas-7d425b09/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Usuario/Desktop/maiscapinhas/maiscapinhas-7d425b09/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/Usuario/Desktop/maiscapinhas/maiscapinhas-7d425b09/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Usuario\\Desktop\\maiscapinhas\\maiscapinhas-7d425b09";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/v1": {
        target: "https://api.maiscapinhas.com.br",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error:", err.message);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxying:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Response:", proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "masked-icon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "logo.png"
      ],
      manifest: {
        name: "Mais Capinhas ERP",
        short_name: "MaisCapinhas",
        description: "Sistema de gest\xE3o completo para lojas Mais Capinhas - Controle de vendas, metas, comiss\xF5es e confer\xEAncia de caixa",
        theme_color: "#7c3aed",
        background_color: "#0a0a0b",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        orientation: "any",
        scope: "/",
        start_url: "/",
        id: "maiscapinhas-erp",
        categories: ["business", "productivity", "finance"],
        lang: "pt-BR",
        dir: "ltr",
        prefer_related_applications: false,
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Acessar dashboard principal",
            url: "/dashboard",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Lan\xE7ar Turno",
            short_name: "Turno",
            description: "Lan\xE7ar fechamento de turno",
            url: "/conferencia/lancar",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Diverg\xEAncias",
            short_name: "Diverg\xEAncias",
            description: "Ver turnos pendentes",
            url: "/conferencia/divergencias",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ],
        screenshots: [
          {
            src: "/logo.png",
            sizes: "500x300",
            type: "image/png",
            form_factor: "wide",
            label: "Mais Capinhas ERP - Sistema de Gest\xE3o"
          },
          {
            src: "/logo.png",
            sizes: "500x300",
            type: "image/png",
            form_factor: "narrow",
            label: "Mais Capinhas ERP - Mobile"
          }
        ],
        handle_links: "preferred",
        launch_handler: {
          client_mode: ["navigate-existing", "auto"]
        }
      },
      workbox: {
        // Globbing patterns for precache
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Cache strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.maiscapinhas\.com\.br\/api\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
                // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
                // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
                // 7 days
              }
            }
          }
        ],
        // Offline fallback
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        // Skip waiting
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Target modern browsers
    target: "es2020",
    // Minification
    minify: mode === "production" ? "esbuild" : false,
    // Source maps for debugging (external in prod)
    sourcemap: mode === "production" ? "hidden" : true,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          // UI components by category
          "vendor-ui-dialog": ["@radix-ui/react-dialog", "@radix-ui/react-alert-dialog"],
          "vendor-ui-menu": ["@radix-ui/react-dropdown-menu", "@radix-ui/react-menubar", "@radix-ui/react-select"],
          "vendor-ui-form": ["@radix-ui/react-checkbox", "@radix-ui/react-radio-group", "@radix-ui/react-switch", "@radix-ui/react-label"],
          "vendor-ui-overlay": ["@radix-ui/react-tooltip", "@radix-ui/react-popover", "@radix-ui/react-hover-card"],
          "vendor-ui-misc": ["@radix-ui/react-tabs", "@radix-ui/react-accordion", "@radix-ui/react-separator"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Charts (lazy loaded)
          "vendor-charts": ["recharts"],
          // Forms
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Utilities
          "vendor-utils": ["class-variance-authority", "clsx", "tailwind-merge"]
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"]
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc3VhcmlvXFxcXERlc2t0b3BcXFxcbWFpc2NhcGluaGFzXFxcXG1haXNjYXBpbmhhcy03ZDQyNWIwOVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXN1YXJpb1xcXFxEZXNrdG9wXFxcXG1haXNjYXBpbmhhc1xcXFxtYWlzY2FwaW5oYXMtN2Q0MjViMDlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VzdWFyaW8vRGVza3RvcC9tYWlzY2FwaW5oYXMvbWFpc2NhcGluaGFzLTdkNDI1YjA5L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpL3YxJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYXBpLm1haXNjYXBpbmhhcy5jb20uYnInLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgX3JlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHJveHkgZXJyb3I6JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgX3JlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUHJveHlpbmc6JywgcmVxLm1ldGhvZCwgcmVxLnVybCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcycsIChwcm94eVJlcywgcmVxLCBfcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZTonLCBwcm94eVJlcy5zdGF0dXNDb2RlLCByZXEudXJsKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgIFZpdGVQV0Eoe1xyXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgaW5jbHVkZUFzc2V0czogW1xyXG4gICAgICAgICdmYXZpY29uLmljbycsXHJcbiAgICAgICAgJ2FwcGxlLXRvdWNoLWljb24ucG5nJyxcclxuICAgICAgICAnbWFza2VkLWljb24uc3ZnJyxcclxuICAgICAgICAncHdhLTE5MngxOTIucG5nJyxcclxuICAgICAgICAncHdhLTUxMng1MTIucG5nJyxcclxuICAgICAgICAnbG9nby5wbmcnXHJcbiAgICAgIF0sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ01haXMgQ2FwaW5oYXMgRVJQJyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnTWFpc0NhcGluaGFzJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Npc3RlbWEgZGUgZ2VzdFx1MDBFM28gY29tcGxldG8gcGFyYSBsb2phcyBNYWlzIENhcGluaGFzIC0gQ29udHJvbGUgZGUgdmVuZGFzLCBtZXRhcywgY29taXNzXHUwMEY1ZXMgZSBjb25mZXJcdTAwRUFuY2lhIGRlIGNhaXhhJyxcclxuICAgICAgICB0aGVtZV9jb2xvcjogJyM3YzNhZWQnLFxyXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMGEwYTBiJyxcclxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXHJcbiAgICAgICAgZGlzcGxheV9vdmVycmlkZTogWyd3aW5kb3ctY29udHJvbHMtb3ZlcmxheScsICdzdGFuZGFsb25lJywgJ21pbmltYWwtdWknXSxcclxuICAgICAgICBvcmllbnRhdGlvbjogJ2FueScsXHJcbiAgICAgICAgc2NvcGU6ICcvJyxcclxuICAgICAgICBzdGFydF91cmw6ICcvJyxcclxuICAgICAgICBpZDogJ21haXNjYXBpbmhhcy1lcnAnLFxyXG4gICAgICAgIGNhdGVnb3JpZXM6IFsnYnVzaW5lc3MnLCAncHJvZHVjdGl2aXR5JywgJ2ZpbmFuY2UnXSxcclxuICAgICAgICBsYW5nOiAncHQtQlInLFxyXG4gICAgICAgIGRpcjogJ2x0cicsXHJcbiAgICAgICAgcHJlZmVyX3JlbGF0ZWRfYXBwbGljYXRpb25zOiBmYWxzZSxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICcvcHdhLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL3B3YS01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9wd2EtNTEyeDUxMi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgcHVycG9zZTogJ21hc2thYmxlJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzaG9ydGN1dHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ0Rhc2hib2FyZCcsXHJcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdEYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjZXNzYXIgZGFzaGJvYXJkIHByaW5jaXBhbCcsXHJcbiAgICAgICAgICAgIHVybDogJy9kYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnL3B3YS0xOTJ4MTkyLnBuZycsIHNpemVzOiAnMTkyeDE5MicgfV0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnTGFuXHUwMEU3YXIgVHVybm8nLFxyXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnVHVybm8nLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xhblx1MDBFN2FyIGZlY2hhbWVudG8gZGUgdHVybm8nLFxyXG4gICAgICAgICAgICB1cmw6ICcvY29uZmVyZW5jaWEvbGFuY2FyJyxcclxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJy9wd2EtMTkyeDE5Mi5wbmcnLCBzaXplczogJzE5MngxOTInIH1dLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ0RpdmVyZ1x1MDBFQW5jaWFzJyxcclxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ0RpdmVyZ1x1MDBFQW5jaWFzJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWZXIgdHVybm9zIHBlbmRlbnRlcycsXHJcbiAgICAgICAgICAgIHVybDogJy9jb25mZXJlbmNpYS9kaXZlcmdlbmNpYXMnLFxyXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnL3B3YS0xOTJ4MTkyLnBuZycsIHNpemVzOiAnMTkyeDE5MicgfV0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc2NyZWVuc2hvdHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL2xvZ28ucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MDB4MzAwJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIGZvcm1fZmFjdG9yOiAnd2lkZScsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnTWFpcyBDYXBpbmhhcyBFUlAgLSBTaXN0ZW1hIGRlIEdlc3RcdTAwRTNvJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9sb2dvLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTAweDMwMCcsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBmb3JtX2ZhY3RvcjogJ25hcnJvdycsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnTWFpcyBDYXBpbmhhcyBFUlAgLSBNb2JpbGUnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIGhhbmRsZV9saW5rczogJ3ByZWZlcnJlZCcsXHJcbiAgICAgICAgbGF1bmNoX2hhbmRsZXI6IHtcclxuICAgICAgICAgIGNsaWVudF9tb2RlOiBbJ25hdmlnYXRlLWV4aXN0aW5nJywgJ2F1dG8nXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgLy8gR2xvYmJpbmcgcGF0dGVybnMgZm9yIHByZWNhY2hlXHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYsd29mZjJ9J10sXHJcbiAgICAgICAgLy8gQ2FjaGUgc3RyYXRlZ2llc1xyXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvYXBpXFwubWFpc2NhcGluaGFzXFwuY29tXFwuYnJcXC9hcGlcXC92MVxcLy4qL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrRmlyc3QnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnYXBpLWNhY2hlJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQsIC8vIDI0IGhvdXJzXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgbmV0d29ya1RpbWVvdXRTZWNvbmRzOiAxMCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzpwbmd8anBnfGpwZWd8c3ZnfGdpZnx3ZWJwfGljbykkLyxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnaW1hZ2UtY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLCAvLyAzMCBkYXlzXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzp3b2ZmfHdvZmYyfHR0Znxlb3QpJC8sXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2ZvbnQtY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDIwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LCAvLyAxIHllYXJcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLig/OmpzfGNzcykkLyxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ1N0YWxlV2hpbGVSZXZhbGlkYXRlJyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N0YXRpYy1jYWNoZScsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA3LCAvLyA3IGRheXNcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vIE9mZmxpbmUgZmFsbGJhY2tcclxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrOiAnL2luZGV4Lmh0bWwnLFxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpL10sXHJcbiAgICAgICAgLy8gU2tpcCB3YWl0aW5nXHJcbiAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsXHJcbiAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB0eXBlOiAnbW9kdWxlJyxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxyXG4gICAgLy8gTWluaWZpY2F0aW9uXHJcbiAgICBtaW5pZnk6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/ICdlc2J1aWxkJyA6IGZhbHNlLFxyXG4gICAgLy8gU291cmNlIG1hcHMgZm9yIGRlYnVnZ2luZyAoZXh0ZXJuYWwgaW4gcHJvZClcclxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2hpZGRlbicgOiB0cnVlLFxyXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIC8vIFJlYWN0IGNvcmVcclxuICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxyXG4gICAgICAgICAgJ3ZlbmRvci1yb3V0ZXInOiBbJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgIC8vIFVJIGNvbXBvbmVudHMgYnkgY2F0ZWdvcnlcclxuICAgICAgICAgICd2ZW5kb3ItdWktZGlhbG9nJzogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2cnXSxcclxuICAgICAgICAgICd2ZW5kb3ItdWktbWVudSc6IFsnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLCAnQHJhZGl4LXVpL3JlYWN0LW1lbnViYXInLCAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCddLFxyXG4gICAgICAgICAgJ3ZlbmRvci11aS1mb3JtJzogWydAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLCAnQHJhZGl4LXVpL3JlYWN0LXJhZGlvLWdyb3VwJywgJ0ByYWRpeC11aS9yZWFjdC1zd2l0Y2gnLCAnQHJhZGl4LXVpL3JlYWN0LWxhYmVsJ10sXHJcbiAgICAgICAgICAndmVuZG9yLXVpLW92ZXJsYXknOiBbJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJywgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJywgJ0ByYWRpeC11aS9yZWFjdC1ob3Zlci1jYXJkJ10sXHJcbiAgICAgICAgICAndmVuZG9yLXVpLW1pc2MnOiBbJ0ByYWRpeC11aS9yZWFjdC10YWJzJywgJ0ByYWRpeC11aS9yZWFjdC1hY2NvcmRpb24nLCAnQHJhZGl4LXVpL3JlYWN0LXNlcGFyYXRvciddLFxyXG4gICAgICAgICAgLy8gRGF0YSBmZXRjaGluZ1xyXG4gICAgICAgICAgJ3ZlbmRvci1xdWVyeSc6IFsnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J10sXHJcbiAgICAgICAgICAvLyBDaGFydHMgKGxhenkgbG9hZGVkKVxyXG4gICAgICAgICAgJ3ZlbmRvci1jaGFydHMnOiBbJ3JlY2hhcnRzJ10sXHJcbiAgICAgICAgICAvLyBGb3Jtc1xyXG4gICAgICAgICAgJ3ZlbmRvci1mb3Jtcyc6IFsncmVhY3QtaG9vay1mb3JtJywgJ0Bob29rZm9ybS9yZXNvbHZlcnMnLCAnem9kJ10sXHJcbiAgICAgICAgICAvLyBVdGlsaXRpZXNcclxuICAgICAgICAgICd2ZW5kb3ItdXRpbHMnOiBbJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eScsICdjbHN4JywgJ3RhaWx3aW5kLW1lcmdlJ10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBDaHVuayBzaXplIHdhcm5pbmdzXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcclxuICB9LFxyXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbScsICdAdGFuc3RhY2svcmVhY3QtcXVlcnknXSxcclxuICB9LFxyXG4gIC8vIEVuYWJsZSBDU1MgY29kZSBzcGxpdHRpbmdcclxuICBjc3M6IHtcclxuICAgIGRldlNvdXJjZW1hcDogdHJ1ZSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1csU0FBUyxvQkFBb0I7QUFDNVksT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFD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
