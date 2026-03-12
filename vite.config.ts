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
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('@supabase/')) return 'vendor-backend';
          if (id.includes('framer-motion')) return 'vendor-animation';
          if (id.includes('@radix-ui/')) return 'vendor-ui';
          if (id.includes('@tanstack/')) return 'vendor-data';
          if (id.includes('lucide-react')) return 'vendor-icons';
          // Heavy export/data libs - lazy loaded only when needed
          if (id.includes('xlsx') || id.includes('jspdf') || id.includes('jszip')) return 'vendor-export';
          if (id.includes('papaparse')) return 'vendor-csv';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
          if (id.includes('date-fns')) return 'vendor-dates';
          if (id.includes('react-markdown') || id.includes('dompurify')) return 'vendor-content';
          if (id.includes('@sentry/')) return 'vendor-monitoring';
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@testing-library/react', 'vitest'],
  },
}));
