/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 */
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { UnifiedProvider } from '@/components/unified/UnifiedProvider';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
import { NotificationProvider } from '@/components/notifications/NotificationService';
import { ThemeProvider } from 'next-themes';
import { GlobalModals } from '@/components/GlobalModals';
import { AppRoutes } from '@/routes';
import '@/lib/i18n';

function App() {
  return (
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
                <AppRoutes />
                <GlobalModals />
                <Toaster />
                <SonnerToaster position="top-right" />
              </NotificationProvider>
            </UnifiedProvider>
          </UnifiedAuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </PerformanceProvider>
  );
}

export default App;
