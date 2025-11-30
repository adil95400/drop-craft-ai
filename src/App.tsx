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
import { QueryClientProvider } from '@tanstack/react-query';
import { PWAInstallBanner } from '@/components/mobile/PWAInstallBanner';
import { useEffect } from 'react';

const AppContent = memo(() => {
  useAutoTheme();
  
  useEffect(() => {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);
  
  return (
    <>
      <AppRoutes />
      <GlobalModals />
      <ModalManager />
      <Toaster />
      <SonnerToaster position="top-right" />
      <PWAInstallBanner />
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
