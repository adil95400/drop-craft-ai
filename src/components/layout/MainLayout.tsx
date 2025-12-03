import React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { RealTimeNotifications } from '@/components/notifications/RealTimeNotifications'
import { InteractiveOnboarding } from '@/components/onboarding/InteractiveOnboarding'
import { AccessibilityMenu } from '@/components/ux/AccessibilityMenu'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileHeader, MobileNav } from '@/components/mobile/MobileNav'

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
        <main className="flex-1 pb-20">
          <div className="container max-w-screen-sm mx-auto px-4 py-4">
            {children}
          </div>
        </main>
        <MobileNav />
        <InteractiveOnboarding />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="md:ml-[--sidebar-width] md:peer-data-[state=collapsed]:ml-[--sidebar-width-icon] transition-[margin] duration-200 ease-linear">
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <h1 className="font-semibold">ShopOpti</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <AccessibilityMenu />
                <RealTimeNotifications />
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
      
      <InteractiveOnboarding />
    </SidebarProvider>
  )
}