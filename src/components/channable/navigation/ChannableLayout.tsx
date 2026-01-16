/**
 * ChannableLayout - Layout principal avec navigation Channable
 * Intègre sidebar + header avec design cohérent
 */
import React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ChannableSidebar } from './ChannableSidebar'
import { ChannableHeader } from './ChannableHeader'
import { InteractiveOnboarding } from '@/components/onboarding/InteractiveOnboarding'
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
        <InteractiveOnboarding />
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
          
          {/* Bannière décorative sous le header */}
          <div className="relative w-full h-32 sm:h-40 overflow-hidden bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=400&fit=crop')] bg-cover bg-center opacity-30 dark:opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
            {/* Motif décoratif */}
            <svg className="absolute right-0 top-0 h-full w-1/3 opacity-10" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)" />
            </svg>
          </div>
          
          {/* Contenu scrollable */}
          <div className={cn("flex-1 overflow-auto bg-background -mt-8", className)}>
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
