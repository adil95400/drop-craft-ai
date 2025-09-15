// LAYOUT OPTIMISÉ POUR ÉVITER LES RE-RENDERS
// Version haute performance du layout principal

import { memo, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { LoadingSpinner, useAuthOptimized } from '@/shared'
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
    <SidebarProvider>
      <div className={cn("min-h-screen flex w-full bg-background", className)}>
        <AppSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header with sidebar trigger */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1" />
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            <Suspense fallback={<LoadingSpinner text="Chargement de la page..." />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const OptimizedLayout = memo(OptimizedLayoutComponent, (prevProps, nextProps) => {
  return prevProps.className === nextProps.className
})