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
import { RouteValidationProvider } from '@/components/providers/RouteValidationProvider';
import { ThemeProvider } from 'next-themes';
import { GlobalModals } from '@/components/GlobalModals';
import { AppRoutes } from '@/routes';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import '@/lib/i18n';

function AppContent() {
  useAutoTheme();
  
  return (
    <>
      <AppRoutes />
      <GlobalModals />
      <Toaster />
      <SonnerToaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <RouteValidationProvider showErrorsInUI={import.meta.env.DEV}>
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
                  <AppContent />
                </NotificationProvider>
              </UnifiedProvider>
            </UnifiedAuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </PerformanceProvider>
    </RouteValidationProvider>
  );
}

export default App;
