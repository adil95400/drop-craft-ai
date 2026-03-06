import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

// Lazy-load non-critical components
const CookieBanner = lazy(() => import('./components/CookieBanner').then(m => ({ default: m.CookieBanner })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
})

// Remove initial loader using RAF to avoid forced reflow
requestAnimationFrame(() => {
  const loaderEl = document.getElementById('initial-loader');
  if (loaderEl) {
    loaderEl.style.opacity = '0';
    requestAnimationFrame(() => {
      setTimeout(() => loaderEl.remove(), 200);
    });
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster />
          <Suspense fallback={null}><CookieBanner /></Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)

// Defer non-critical initialization after first render
const initDeferred = () => {
  import('@/utils/consoleInterceptor').then(m => m.installConsoleInterceptor());
  import('@/utils/sentry').then(m => m.initSentry());
  import('./services/PWAService').then(m => m.PWAService.init());
  import('@/utils/logger').then(m => m.logger.info('Application started', { component: 'main' }));
};

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(initDeferred);
} else {
  setTimeout(initDeferred, 200);
}
