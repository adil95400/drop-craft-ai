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
        <MobileHeader />
        <main className="flex-1 pb-20 overflow-auto">
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
      <div className="min-h-screen flex w-full">
        <ChannableSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          <ChannableHeader />
          
          {/* Contenu scrollable */}
          <div className={cn("flex-1 overflow-auto bg-background", className)}>
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
      
      <OnboardingModal />
    </SidebarProvider>
  )
}
