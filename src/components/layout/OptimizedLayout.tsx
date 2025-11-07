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

interface OptimizedLayoutProps {
  className?: string
}

const OptimizedLayoutComponent = ({ className }: OptimizedLayoutProps) => {
  const { isAuthenticated, loading } = useAuthOptimized()

  if (loading) {
    return <LoadingSpinner variant="fullscreen" text="Chargement..." />
  }

  if (!isAuthenticated) {
    return <Outlet />
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