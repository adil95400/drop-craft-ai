/**
 * Application principale - Architecture simplifiée et modulaire
 * Routing délégué aux modules spécialisés pour une meilleure maintenance
 * 
 * PERFORMANCE: Heavy dependencies (supabase, framer-motion, i18n) are lazy loaded
 * to improve initial page load for public pages like the landing page.
 */
import { memo, useEffect, lazy, Suspense } from 'react';
import { GoogleTracking } from '@/components/seo/GoogleTracking';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemeProvider } from 'next-themes';
import { ModalContextProvider } from '@/hooks/useModalHelpers';
import { AppRoutes } from '@/routes';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { OfflineIndicatorLite } from '@/components/offline/OfflineIndicatorLite';
import { LightAuthProvider } from '@/contexts/LightAuthContext';

// Lazy load auth provider (pulls in supabase ~30KB)
const UnifiedAuthProvider = lazy(() => 
  import('@/contexts/UnifiedAuthContext').then(m => ({ default: m.UnifiedAuthProvider }))
);

// Lazy load heavy components to reduce initial bundle
const PWAInstallBanner = lazy(() => import('@/components/mobile/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })));
const FeedbackWidget = lazy(() => import('@/components/feedback/FeedbackWidget').then(m => ({ default: m.FeedbackWidget })));
const UpdateNotification = lazy(() => import('@/components/pwa/UpdateNotification').then(m => ({ default: m.UpdateNotification })));
const MobileGlobalOptimizer = lazy(() => import('@/components/mobile/MobileGlobalOptimizer').then(m => ({ default: m.MobileGlobalOptimizer })));
const OnboardingTour = lazy(() => import('@/components/onboarding/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const NotificationProvider = lazy(() => import('@/components/notifications/NotificationService').then(m => ({ default: m.NotificationProvider })));
const GlobalAIAssistant = lazy(() => import('@/components/ai/GlobalAIAssistant').then(m => ({ default: m.GlobalAIAssistant })));

// Lazy load modal systems (pulls in many dialog components with supabase/heavy deps)
const GlobalModals = lazy(() => import('@/components/GlobalModals').then(m => ({ default: m.GlobalModals })));
const ModalManager = lazy(() => import('@/components/modals/ModalManager').then(m => ({ default: m.ModalManager })));
const UnifiedProvider = lazy(() => import('@/components/unified/UnifiedProvider').then(m => ({ default: m.UnifiedProvider })));

// Initialize i18n lazily to reduce initial bundle
const initI18n = () => import('@/lib/i18n');

const AppContent = memo(() => {
  useAutoTheme();
  usePerformanceMonitor();
  
  useEffect(() => {
    // Initialize i18n lazily
    initI18n();
  }, []);
  
  return (
    <Suspense fallback={null}>
      <MobileGlobalOptimizer>
        {/* Skip link for keyboard navigation (WCAG 2.4.1) */}
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        
        {/* ARIA live region for dynamic announcements (WCAG 4.1.3) */}
        <div id="a11y-announcer" aria-live="polite" aria-atomic="true" className="sr-only" role="status" />
        
        {/* Lightweight offline status indicator (no framer-motion) */}
        <GoogleTracking />
        <OfflineIndicatorLite />
        
        <div className="pb-20 md:pb-0">
          <Suspense fallback={null}>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </Suspense>
        </div>
        
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
        
        {/* Notification de mise à jour PWA */}
        <Suspense fallback={null}>
          <UpdateNotification />
        </Suspense>
        
        {/* Onboarding tour for new users */}
        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
        
        {/* Feedback widget for continuous user feedback */}
        <Suspense fallback={null}>
          <FeedbackWidget />
        </Suspense>
        
        {/* Global AI Assistant with Lovable AI */}
        <Suspense fallback={null}>
          <GlobalAIAssistant />
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
        {/* LightAuthProvider provides quick session check without loading supabase */}
        <LightAuthProvider>
          {/* UnifiedAuthProvider lazy loaded - only loads supabase when needed */}
          <Suspense fallback={null}>
            <UnifiedAuthProvider>
              <Suspense fallback={null}>
                <UnifiedProvider>
                  <ModalContextProvider>
                    <AppContent />
                  </ModalContextProvider>
                </UnifiedProvider>
              </Suspense>
            </UnifiedAuthProvider>
          </Suspense>
        </LightAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
