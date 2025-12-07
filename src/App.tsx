/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 */
import { memo, useEffect } from 'react';
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
import { PWAInstallBanner } from '@/components/mobile/PWAInstallBanner';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { MobileGlobalOptimizer } from '@/components/mobile/MobileGlobalOptimizer';
import { AdaptiveBottomNav } from '@/components/mobile/AdaptiveBottomNav';

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
    <MobileGlobalOptimizer>
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      
      {/* Offline status indicator */}
      <OfflineIndicator variant="banner" />
      
      <main id="main-content" className="pb-20 md:pb-0">
        <AppRoutes />
      </main>
      
      <GlobalModals />
      <ModalManager />
      <Toaster />
      <SonnerToaster position="top-right" />
      <PWAInstallBanner />
      
      {/* Feedback widget for continuous user feedback */}
      <FeedbackWidget />
      
      {/* Adaptive bottom navigation for mobile */}
      <AdaptiveBottomNav />
    </MobileGlobalOptimizer>
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
