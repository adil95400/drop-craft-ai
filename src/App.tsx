/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 */
import { memo } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { UnifiedProvider } from '@/components/unified/UnifiedProvider';
import { NotificationProvider } from '@/components/notifications/NotificationService';
import { ThemeProvider } from 'next-themes';
import { GlobalModals } from '@/components/GlobalModals';
import { ModalContextProvider } from '@/hooks/useModalHelpers';
import { ModalManager } from '@/components/modals/ModalManager';
import { AppRoutes } from '@/routes';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import '@/lib/i18n';

const AppContent = memo(() => {
  useAutoTheme();
  
  return (
    <>
      <AppRoutes />
      <GlobalModals />
      <ModalManager />
      <Toaster />
      <SonnerToaster position="top-right" />
    </>
  );
});

AppContent.displayName = 'AppContent';

function App() {
  return (
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
              <ModalContextProvider>
                <AppContent />
              </ModalContextProvider>
            </NotificationProvider>
          </UnifiedProvider>
        </UnifiedAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
