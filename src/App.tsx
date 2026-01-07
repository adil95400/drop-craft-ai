/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 */
import { memo, useEffect, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemeProvider } from 'next-themes';
import { ModalContextProvider } from '@/hooks/useModalHelpers';
import { AppRoutes } from '@/routes';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import { OfflineIndicatorLite } from '@/components/offline/OfflineIndicatorLite';

// Lazy load heavy components to reduce initial bundle
const PWAInstallBanner = lazy(() => import('@/components/mobile/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })));
const FeedbackWidget = lazy(() => import('@/components/feedback/FeedbackWidget').then(m => ({ default: m.FeedbackWidget })));
const MobileGlobalOptimizer = lazy(() => import('@/components/mobile/MobileGlobalOptimizer').then(m => ({ default: m.MobileGlobalOptimizer })));
const AdaptiveBottomNav = lazy(() => import('@/components/mobile/AdaptiveBottomNav').then(m => ({ default: m.AdaptiveBottomNav })));
const OnboardingTour = lazy(() => import('@/components/onboarding/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const NotificationProvider = lazy(() => import('@/components/notifications/NotificationService').then(m => ({ default: m.NotificationProvider })));

// Lazy load modal systems (pulls in many dialog components with supabase/heavy deps)
const GlobalModals = lazy(() => import('@/components/GlobalModals').then(m => ({ default: m.GlobalModals })));
const ModalManager = lazy(() => import('@/components/modals/ModalManager').then(m => ({ default: m.ModalManager })));
const UnifiedProvider = lazy(() => import('@/components/unified/UnifiedProvider').then(m => ({ default: m.UnifiedProvider })));

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
        
        {/* Lightweight offline status indicator (no framer-motion) */}
        <OfflineIndicatorLite />
        
        <main id="main-content" className="pb-20 md:pb-0">
          <Suspense fallback={null}>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </Suspense>
        </main>
        
        <Suspense fallback={null}>
          <GlobalModals />
        </Suspense>
        <Suspense fallback={null}>
          <ModalManager />
        </Suspense>
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
          <Suspense fallback={null}>
            <UnifiedProvider>
              <ModalContextProvider>
                <AppContent />
              </ModalContextProvider>
            </UnifiedProvider>
          </Suspense>
        </UnifiedAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
