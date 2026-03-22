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
          // DnD
          if (id.includes('@dnd-kit/')) return 'vendor-dnd';
          // Embla carousel
          if (id.includes('embla-carousel')) return 'vendor-carousel';

          // NOTE: keep app code in Rollup defaults to avoid cross-chunk circular init errors
          // that can cause blank pages in production (TDZ "Cannot access X before initialization").
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
