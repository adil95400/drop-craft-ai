import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// Custom plugin to defer non-critical CSS loading
function deferCssPlugin(): Plugin {
  return {
    name: 'defer-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // Match various stylesheet link formats Vite may produce
      return html.replace(
        /<link\s+rel="stylesheet"(\s+crossorigin)?\s+href="(\/assets\/[^"]+\.css)">/g,
        `<link rel="stylesheet" href="$2" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="$2"></noscript>`
      );
    },
  };
}

// Custom plugin to add modulepreload hints for critical chunks
// This breaks the network dependency tree by preloading JS in parallel with HTML parsing
function modulePreloadPlugin(): Plugin {
  return {
    name: 'module-preload-hints',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      // Only apply in production builds
      if (!ctx.bundle) return html;
      
      // Find critical chunk filenames from the bundle
      const criticalChunks: string[] = [];
      const chunkPriority = ['vendor-react', 'vendor-utils', 'index'];
      
      for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          // Prioritize vendor-react, vendor-utils, and main index chunks
          for (const priority of chunkPriority) {
            if (fileName.includes(priority)) {
              criticalChunks.push(`/assets/${fileName.split('/').pop()}`);
              break;
            }
          }
        }
      }
      
      // Generate modulepreload link tags
      const preloadTags = criticalChunks
        .slice(0, 4) // Limit to 4 preloads to avoid bandwidth contention
        .map(chunk => `<link rel="modulepreload" href="${chunk}" crossorigin>`)
        .join('\n    ');
      
      // Insert after the last preconnect tag
      if (preloadTags) {
        return html.replace(
          /(<link rel="dns-prefetch"[^>]*>\s*)+/,
          `$&\n    <!-- Modulepreload critical JS chunks to break network dependency tree -->\n    ${preloadTags}\n    `
        );
      }
      
      return html;
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
    mode === 'production' && modulePreloadPlugin(),
    // Optimize images at build time - compress JPG/PNG and convert to WebP
    ViteImageOptimizer({
      jpg: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      png: {
        quality: 80,
      },
      webp: {
        lossless: false,
        quality: 80,
        alphaQuality: 80,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // Defer SW registration to avoid render-blocking
      includeAssets: ['logos/*.png', 'logos/*.svg', 'og-image.png'],
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
            src: '/logos/shopopti-logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/logos/shopopti-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/logos/shopopti-icon-512.png',
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
            icons: [{ src: '/logos/shopopti-icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Produits',
            short_name: 'Produits',
            description: 'Gérer mes produits',
            url: '/products',
            icons: [{ src: '/logos/shopopti-icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Commandes',
            short_name: 'Commandes',
            description: 'Suivre mes commandes',
            url: '/dashboard/orders',
            icons: [{ src: '/logos/shopopti-icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
      navigateFallbackDenylist: [/^\/~oauth/],
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
          
          // All Radix UI components in single chunk to avoid cross-chunk dependencies
          // This prevents "l is not a function" errors from minification issues
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui';
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
