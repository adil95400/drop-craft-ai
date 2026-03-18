/**
 * ChannableLayout - Layout principal avec navigation Channable
 * Intègre sidebar + header avec design cohérent
 * Responsive: mobile (bottom nav), tablet (sidebar collapsed), desktop (sidebar open)
 */
import React, { lazy, Suspense } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ChannableSidebar } from './ChannableSidebar'
import { ChannableHeader } from './ChannableHeader'
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile'
import { MobileHeader, MobileNav } from '@/components/mobile/MobileNav'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { cn } from '@/lib/utils'
import { useRetentionTracking } from '@/hooks/useRetentionTracking'

// Lazy-load non-critical overlay components
const OnboardingModal = lazy(() => import('@/components/onboarding/UnifiedOnboarding').then(m => ({ default: m.OnboardingModal })));
const DiagnosticWidget = lazy(() => import('@/components/support/DiagnosticWidget').then(m => ({ default: m.DiagnosticWidget })));

interface ChannableLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ChannableLayout({ children, className }: ChannableLayoutProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  useRetentionTracking()

  // Version mobile avec navigation en bas
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SkipToContent />
        <MobileHeader />
        <main id="main-content" className="flex-1 pb-20 overflow-auto" role="main">
          <div className="container max-w-screen-sm mx-auto px-3 py-3">
            {children}
          </div>
        </main>
        <MobileNav />
        <Suspense fallback={null}><OnboardingModal /></Suspense>
        <Suspense fallback={null}><DiagnosticWidget /></Suspense>
      </div>
    )
  }

  // Version desktop/tablet avec sidebar Channable
  // Sidebar collapsed by default on tablet for more content space
  return (
    <SidebarProvider defaultOpen={!isTablet}>
      <SkipToContent />
      <div className="min-h-screen flex w-full">
        <ChannableSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          <ChannableHeader />
          
          {/* Contenu scrollable - responsive padding */}
          <main id="main-content" className={cn("flex-1 overflow-auto bg-background", className)} role="main">
            <div className={cn(
              "p-3 sm:p-4 lg:p-6",
              isTablet && "max-w-4xl mx-auto"
            )}>
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      
      <Suspense fallback={null}><OnboardingModal /></Suspense>
      <Suspense fallback={null}><DiagnosticWidget /></Suspense>
    </SidebarProvider>
  )
}
