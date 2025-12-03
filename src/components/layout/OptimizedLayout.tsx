// LAYOUT OPTIMISÉ POUR ÉVITER LES RE-RENDERS
// Version haute performance du layout principal

import { memo, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { LoadingSpinner, useAuthOptimized } from '@/shared'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { EnhancedNavigationBar } from '@/components/navigation/EnhancedNavigationBar'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileHeader, MobileNav } from '@/components/mobile/MobileNav'

interface OptimizedLayoutProps {
  className?: string
}

const OptimizedLayoutComponent = ({ className }: OptimizedLayoutProps) => {
  const { isAuthenticated, loading } = useAuthOptimized()
  const isMobile = useIsMobile()

  if (loading) {
    return <LoadingSpinner variant="fullscreen" text="Chargement..." />
  }

  if (!isAuthenticated) {
    return <Outlet />
  }

  // Version mobile avec navigation en bas
  if (isMobile) {
    return (
      <NavigationProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <MobileHeader />
          <main className="flex-1 pb-20">
            <div className="container max-w-screen-sm mx-auto px-4 py-4">
              <Suspense fallback={<LoadingSpinner text="Chargement de la page..." />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
          <MobileNav />
        </div>
      </NavigationProvider>
    )
  }

  return (
    <NavigationProvider>
      <SidebarProvider>
        <div className={cn("min-h-screen flex w-full bg-background", className)}>
          <AppSidebar />
          
          <SidebarInset className="md:ml-[--sidebar-width] md:peer-data-[state=collapsed]:ml-[--sidebar-width-icon] transition-[margin] duration-200 ease-linear">
            {/* Enhanced navigation bar */}
            <EnhancedNavigationBar />

            {/* Main content area */}
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<LoadingSpinner text="Chargement de la page..." />}>
                <Outlet />
              </Suspense>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NavigationProvider>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const OptimizedLayout = memo(OptimizedLayoutComponent, (prevProps, nextProps) => {
  return prevProps.className === nextProps.className
})