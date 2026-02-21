/**
 * ChannableLayout - Layout principal avec navigation Channable
 * Intègre sidebar + header avec design cohérent
 */
import React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ChannableSidebar } from './ChannableSidebar'
import { ChannableHeader } from './ChannableHeader'
import { OnboardingModal } from '@/components/onboarding/UnifiedOnboarding'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileHeader, MobileNav } from '@/components/mobile/MobileNav'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { cn } from '@/lib/utils'

interface ChannableLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ChannableLayout({ children, className }: ChannableLayoutProps) {
  const isMobile = useIsMobile()

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
        <OnboardingModal />
      </div>
    )
  }

  // Version desktop avec sidebar Channable
  return (
    <SidebarProvider defaultOpen={true}>
      <SkipToContent />
      <div className="min-h-screen flex w-full">
        <ChannableSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          <ChannableHeader />
          
          {/* Contenu scrollable */}
          <main id="main-content" className={cn("flex-1 overflow-auto bg-background", className)} role="main">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      
      <OnboardingModal />
    </SidebarProvider>
  )
}
