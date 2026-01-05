/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 */
import { memo, useEffect, lazy, Suspense } from 'react';
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
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';

// Lazy load heavy components to reduce initial bundle
const PWAInstallBanner = lazy(() => import('@/components/mobile/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })));
const FeedbackWidget = lazy(() => import('@/components/feedback/FeedbackWidget').then(m => ({ default: m.FeedbackWidget })));
const MobileGlobalOptimizer = lazy(() => import('@/components/mobile/MobileGlobalOptimizer').then(m => ({ default: m.MobileGlobalOptimizer })));
const AdaptiveBottomNav = lazy(() => import('@/components/mobile/AdaptiveBottomNav').then(m => ({ default: m.AdaptiveBottomNav })));
const OnboardingTour = lazy(() => import('@/components/onboarding/OnboardingTour').then(m => ({ default: m.OnboardingTour })));

// Initialize i18n lazily to reduce initial bundle
const initI18n = () => import('@/lib/i18n');

const AppContent = memo(() => {
  useAutoTheme();
  
  useEffect(() => {
    // Initialize i18n lazily
    initI18n();
    
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
    <Suspense fallback={null}>
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
        <Suspense fallback={null}>
          <PWAInstallBanner />
        </Suspense>
        
        {/* Onboarding tour for new users */}
        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
        
        {/* Feedback widget for continuous user feedback */}
        <Suspense fallback={null}>
          <FeedbackWidget />
        </Suspense>
        
        {/* Adaptive bottom navigation for mobile */}
        <Suspense fallback={null}>
          <AdaptiveBottomNav />
        </Suspense>
      </MobileGlobalOptimizer>
    </Suspense>
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
