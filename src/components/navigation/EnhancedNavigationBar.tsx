import { memo } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { QuickNavigationBar } from './QuickNavigationBar'
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs'
import { cn } from '@/lib/utils'

interface EnhancedNavigationBarProps {
  className?: string
  showBreadcrumbs?: boolean
  showQuickSearch?: boolean
}

function EnhancedNavigationBarComponent({
  className,
  showBreadcrumbs = true,
  showQuickSearch = true,
}: EnhancedNavigationBarProps) {
  return (
    <header
      role="banner"
      aria-label="Barre de navigation principale"
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      {/* Main navigation row */}
      <nav
        role="navigation"
        aria-label="Navigation principale"
        className="flex h-14 md:h-12 items-center gap-3 px-4"
      >
        {/* Desktop: Sidebar trigger */}
        <SidebarTrigger
          className="-ml-1 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Ouvrir/fermer le menu latéral"
        />

        {/* Breadcrumbs - inline on desktop */}
        {showBreadcrumbs && (
          <div className="hidden md:flex flex-1 items-center min-w-0" aria-label="Fil d'Ariane">
            <NavigationBreadcrumbs />
          </div>
        )}

        {/* Right: Quick search */}
        <div className="flex items-center gap-2 ml-auto">
          {showQuickSearch && <QuickNavigationBar className="hidden sm:flex" />}
        </div>
      </nav>
    </header>
  )
}

export const EnhancedNavigationBar = memo(
  EnhancedNavigationBarComponent,
  (prevProps, nextProps) =>
    prevProps.showBreadcrumbs === nextProps.showBreadcrumbs &&
    prevProps.showQuickSearch === nextProps.showQuickSearch &&
    prevProps.className === nextProps.className
)
