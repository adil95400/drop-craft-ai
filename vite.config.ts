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
          if (id.includes('lucide-react')) return 'vendor-utils';
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
