/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 */
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedProvider } from '@/components/unified/UnifiedProvider';
import { HelmetProvider } from 'react-helmet-async';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
import { NotificationProvider } from '@/components/notifications/NotificationService';
import { ThemeProvider } from 'next-themes';
import { GlobalModals } from '@/components/GlobalModals';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import '@/lib/i18n';

// Optimized QueryClient with caching strategies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000,   // 10 minutes - cache retention
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnReconnect: true,
      retry: 1, // Only retry failed requests once
      networkMode: 'offlineFirst', // Prefer cached data when available
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <PerformanceProvider showWidget={false}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <UnifiedAuthProvider>
                <UnifiedProvider>
                  <NotificationProvider>
                    <BrowserRouter>
                      <AppRoutes />
                      <GlobalModals />
                      <Toaster />
                      <SonnerToaster position="top-right" />
                    </BrowserRouter>
                  </NotificationProvider>
                </UnifiedProvider>
              </UnifiedAuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </PerformanceProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
