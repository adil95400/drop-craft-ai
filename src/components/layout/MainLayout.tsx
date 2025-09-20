import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { RealTimeNotifications } from '@/components/notifications/RealTimeNotifications'
import { InteractiveOnboarding } from '@/components/onboarding/InteractiveOnboarding'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <h1 className="font-semibold">DropCraft AI</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <RealTimeNotifications />
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      
      <InteractiveOnboarding />
    </SidebarProvider>
  )
}