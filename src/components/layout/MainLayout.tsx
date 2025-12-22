import React from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { RealTimeNotifications } from '@/components/notifications/RealTimeNotifications'
import { InteractiveOnboarding } from '@/components/onboarding/InteractiveOnboarding'
import { AccessibilityMenu } from '@/components/ux/AccessibilityMenu'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileHeader, MobileNav } from '@/components/mobile/MobileNav'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
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
        <InteractiveOnboarding />
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {/* Header fixe avec sidebar trigger toujours visible */}
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
            <div className="flex h-14 items-center justify-between px-4 gap-4">
              {/* Sidebar trigger - toujours visible */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
                <h1 className="font-semibold text-lg hidden sm:block">ShopOpti</h1>
              </div>
              
              {/* Actions à droite */}
              <div className="flex items-center gap-2 sm:gap-4">
                <AccessibilityMenu />
                <RealTimeNotifications />
              </div>
            </div>
          </header>
          
          {/* Contenu scrollable */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
      
      <InteractiveOnboarding />
    </SidebarProvider>
  )
}