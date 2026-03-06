/**
 * Application principale - Architecture simplifiée et modulaire
 * 
 * PERFORMANCE: Public pages (landing, SEO) load WITHOUT heavy auth/plan providers.
 * Only authenticated routes load Supabase, modals, widgets etc.
 */
import React, { memo, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ModalContextProvider } from '@/hooks/useModalHelpers';
import { ThemeProvider } from 'next-themes';
import { AppRoutes } from '@/routes';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import { OfflineIndicatorLite } from '@/components/offline/OfflineIndicatorLite';
import { LightAuthProvider, useLightAuth } from '@/contexts/LightAuthContext';

// Lazy load heavy providers & widgets — only for authenticated users
const UnifiedAuthProvider = lazy(() => 
  import('@/contexts/UnifiedAuthContext').then(m => ({ default: m.UnifiedAuthProvider }))
);
const UnifiedProvider = lazy(() => import('@/components/unified/UnifiedProvider').then(m => ({ default: m.UnifiedProvider })));
const ModalContextProvider = lazy(() => import('@/hooks/useModalHelpers').then(m => ({ default: m.ModalContextProvider })));
const GlobalModals = lazy(() => import('@/components/GlobalModals').then(m => ({ default: m.GlobalModals })));
const ModalManager = lazy(() => import('@/components/modals/ModalManager').then(m => ({ default: m.ModalManager })));
const PWAInstallBanner = lazy(() => import('@/components/mobile/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })));
const UpdateNotification = lazy(() => import('@/components/pwa/UpdateNotification').then(m => ({ default: m.UpdateNotification })));
const OnboardingTour = lazy(() => import('@/components/onboarding/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const NotificationProvider = lazy(() => import('@/components/notifications/NotificationService').then(m => ({ default: m.NotificationProvider })));
const GlobalAIAssistant = lazy(() => import('@/components/ai/GlobalAIAssistant').then(m => ({ default: m.GlobalAIAssistant })));
const FeedbackWidget = lazy(() => import('@/components/feedback/FeedbackWidget').then(m => ({ default: m.FeedbackWidget })));

// Initialize i18n lazily
const initI18n = () => import('@/lib/i18n');

// List of public route prefixes that DON'T need heavy providers
const PUBLIC_PREFIXES = [
  '/', '/auth', '/pricing', '/features', '/contact', '/faq', '/about',
  '/privacy', '/terms', '/cgv', '/blog', '/documentation', '/docs',
  '/changelog', '/status', '/testimonials', '/integrations',
  '/logiciel-', '/alternative-', '/optimisation-', '/gestion-',
  '/import-produits-', '/automatisation-', '/outil-pricing-',
  '/analyse-boutique-', '/shopify-', '/shopopti-vs-', '/dropshipping-',
  '/product-research-', '/how-to-', '/ai-tool-for-', '/payment/',
  '/enterprise/observability', '/guides', '/academy', '/pwa-install',
  '/store', '/pricing-plans',
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(prefix => prefix !== '/' && pathname.startsWith(prefix));
}

/**
 * Lightweight shell for public pages — no Supabase, no modals, no widgets
 */
const PublicShell = memo(({ children }: { children: React.ReactNode }) => {
  useAutoTheme();
  useEffect(() => { initI18n(); }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>
      <OfflineIndicatorLite />
      {children}
      <Toaster />
      <SonnerToaster position="top-right" />
    </>
  );
});
PublicShell.displayName = 'PublicShell';

/**
 * Full shell for authenticated pages — loads all heavy providers & widgets
 */
const AuthenticatedShell = memo(({ children }: { children: React.ReactNode }) => {
  useAutoTheme();
  useEffect(() => { initI18n(); }, []);

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <UnifiedAuthProvider>
        <Suspense fallback={null}>
          <UnifiedProvider>
            <Suspense fallback={null}>
              <ModalContextProvider>
                <a href="#main-content" className="skip-link">Aller au contenu principal</a>
                <div id="a11y-announcer" aria-live="polite" aria-atomic="true" className="sr-only" role="status" />
                <OfflineIndicatorLite />
                
                <div className="pb-20 md:pb-0">
                  <Suspense fallback={null}>
                    <NotificationProvider>
                      {children}
                    </NotificationProvider>
                  </Suspense>
                </div>
                
                <Suspense fallback={null}><GlobalModals /></Suspense>
                <Suspense fallback={null}><ModalManager /></Suspense>
                <Toaster />
                <SonnerToaster position="top-right" />
                <Suspense fallback={null}><PWAInstallBanner /></Suspense>
                <Suspense fallback={null}><UpdateNotification /></Suspense>
                <Suspense fallback={null}><OnboardingTour /></Suspense>
                <Suspense fallback={null}><FeedbackWidget /></Suspense>
                <Suspense fallback={null}><GlobalAIAssistant /></Suspense>
              </ModalContextProvider>
            </Suspense>
          </UnifiedProvider>
        </Suspense>
      </UnifiedAuthProvider>
    </Suspense>
  );
});
AuthenticatedShell.displayName = 'AuthenticatedShell';

/**
 * Smart router that picks the right shell based on the current route
 */
const SmartShell = memo(() => {
  const location = useLocation();
  const { isAuthenticated } = useLightAuth();
  const isPublic = isPublicRoute(location.pathname);
  
  // Public route AND not authenticated → lightweight shell
  if (isPublic && !isAuthenticated) {
    return (
      <PublicShell>
        <AppRoutes />
      </PublicShell>
    );
  }
  
  // Authenticated or protected route → full shell
  return (
    <AuthenticatedShell>
      <AppRoutes />
    </AuthenticatedShell>
  );
});
SmartShell.displayName = 'SmartShell';

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <LightAuthProvider>
          <SmartShell />
        </LightAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
