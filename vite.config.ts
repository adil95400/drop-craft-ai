import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
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
          // Core framework
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          // Data visualization
          if (id.includes('recharts')) return 'vendor-charts';
          // Backend client
          if (id.includes('@supabase/')) return 'vendor-backend';
          // Animation
          if (id.includes('framer-motion')) return 'vendor-animation';
          // UI primitives
          if (id.includes('@radix-ui/')) return 'vendor-ui';
          // Data management
          if (id.includes('@tanstack/')) return 'vendor-data';
          // Icons - heavy, split out
          if (id.includes('lucide-react')) return 'vendor-icons';
          // Heavy export/data libs - lazy loaded
          if (id.includes('xlsx') || id.includes('jspdf') || id.includes('jszip')) return 'vendor-export';
          if (id.includes('papaparse')) return 'vendor-csv';
          // i18n
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          // Forms
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
          // Date utilities
          if (id.includes('date-fns')) return 'vendor-dates';
          // Content rendering
          if (id.includes('react-markdown') || id.includes('dompurify')) return 'vendor-content';
          // Monitoring
          if (id.includes('@sentry/')) return 'vendor-monitoring';
          // DnD
          if (id.includes('@dnd-kit/')) return 'vendor-dnd';
          // Embla carousel
          if (id.includes('embla-carousel')) return 'vendor-carousel';
          
          // App domain chunks — split large feature areas
          if (id.includes('/domains/ai') || id.includes('/components/ai/')) return 'app-ai';
          if (id.includes('/domains/marketplace') || id.includes('/components/marketplace/')) return 'app-marketplace';
          if (id.includes('/components/import/') || id.includes('/pages/import/')) return 'app-import';
          if (id.includes('/components/extensions/') || id.includes('/pages/extensions/')) return 'app-extensions';
          if (id.includes('/components/admin/') || id.includes('/pages/admin/')) return 'app-admin';
          if (id.includes('/components/analytics/') || id.includes('/pages/analytics/')) return 'app-analytics';
          if (id.includes('/components/suppliers/') || id.includes('/pages/suppliers/')) return 'app-suppliers';
          if (id.includes('/components/orders/') || id.includes('/components/fulfillment/')) return 'app-orders';
          if (id.includes('/components/marketing/') || id.includes('/pages/marketing/')) return 'app-marketing';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@testing-library/react', 'vitest'],
  },
}));
