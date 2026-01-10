import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Custom plugin to defer non-critical CSS loading
function deferCssPlugin(): Plugin {
  return {
    name: 'defer-css',
    transformIndexHtml(html) {
      // Convert blocking CSS to async loading using media="print" trick
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        `<link rel="stylesheet" href="$1" media="print" onload="this.media='all'">
        <noscript><link rel="stylesheet" href="$1"></noscript>`
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && deferCssPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // Defer SW registration to avoid render-blocking
      includeAssets: ['icons/*.png', 'og-image.png'],
      manifest: {
        name: 'ShopOpti+',
        short_name: 'ShopOpti',
        description: 'Plateforme SaaS de dropshipping intelligent propulsée par IA',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Accès rapide au tableau de bord',
            url: '/dashboard',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Produits',
            short_name: 'Produits',
            description: 'Gérer mes produits',
            url: '/products',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Commandes',
            short_name: 'Commandes',
            description: 'Suivre mes commandes',
            url: '/dashboard/orders',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - needed on all pages
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          
          // Charts - only load when dashboard/analytics pages need them
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          
          // Supabase - lazy loaded via auth context
          if (id.includes('@supabase/')) {
            return 'vendor-backend';
          }
          
          // Heavy deps - framer-motion, i18n, sentry - defer until needed
          if (id.includes('framer-motion') || 
              id.includes('i18next') || 
              id.includes('react-i18next') ||
              id.includes('@sentry/')) {
            return 'vendor-heavy';
          }
          
          // UI Core - dialogs/dropdowns used on many pages
          if (id.includes('@radix-ui/react-dialog') ||
              id.includes('@radix-ui/react-dropdown-menu') ||
              id.includes('@radix-ui/react-select') ||
              id.includes('@radix-ui/react-tabs') ||
              id.includes('@radix-ui/react-toast')) {
            return 'vendor-ui-core';
          }
          
          // Extended UI components
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui-extended';
          }
          
          // Data/Query layer
          if (id.includes('@tanstack/')) {
            return 'vendor-data';
          }
          
          // Forms
          if (id.includes('react-hook-form') || 
              id.includes('@hookform/') ||
              id.includes('node_modules/zod/')) {
            return 'vendor-forms';
          }
          
          // Utilities
          if (id.includes('date-fns') ||
              id.includes('clsx') ||
              id.includes('class-variance-authority') ||
              id.includes('tailwind-merge') ||
              id.includes('lucide-react')) {
            return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'production' ? 'hidden' : true,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: ['@testing-library/react', 'vitest'],
  },
}));
