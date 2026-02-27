import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from '@sentry/react'
import { initSentry } from '@/utils/sentry'
import { logger } from '@/utils/logger'
import { installConsoleInterceptor } from '@/utils/consoleInterceptor'
import App from './App'
import './index.css'
// Animation CSS is loaded lazily via useAnimationStyles hook to reduce initial CSS bundle
import { PWAService } from './services/PWAService'

// 1. Intercept all console.* calls globally (must be first)
installConsoleInterceptor()

// 2. Initialize PWA
PWAService.init()

// 3. Initialize error monitoring
initSentry()

// 4. Initialize analytics (GA4, Mixpanel, Hotjar)
import { initAnalytics } from '@/lib/analytics'
initAnalytics()

// Log application start
logger.info('Application started', { component: 'main' })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes (increased for better cache retention)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      // Serve stale data while revalidating in background
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
})

const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: (errorData) => {
    const error = errorData.error as Error;
    logger.critical('Application crashed', error, { component: 'ErrorBoundary' });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Critical Error</h1>
          <p className="text-muted-foreground mb-4">The team has been notified automatically.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload
          </button>
        </div>
      </div>
    );
  },
  showDialog: false,
});

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
          <SentryErrorBoundary />
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)
