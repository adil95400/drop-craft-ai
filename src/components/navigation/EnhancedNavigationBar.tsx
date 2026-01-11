import { memo } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { QuickNavigationBar } from './QuickNavigationBar'
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs'
import { MobileNavigationMenu } from './MobileNavigationMenu'
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
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      {/* Main navigation row - simplified */}
      <div className="flex h-12 items-center gap-3 px-4">
        {/* Mobile: Hamburger menu */}
        <div className="flex items-center md:hidden">
          <MobileNavigationMenu />
        </div>

        {/* Desktop: Sidebar trigger */}
        <SidebarTrigger className="-ml-1 hidden md:flex shrink-0" />

        {/* Breadcrumbs - inline on desktop */}
        {showBreadcrumbs && (
          <div className="hidden md:flex flex-1 items-center min-w-0">
            <NavigationBreadcrumbs />
          </div>
        )}

        {/* Right: Quick search */}
        <div className="flex items-center gap-2 ml-auto">
          {showQuickSearch && <QuickNavigationBar className="hidden sm:flex" />}
        </div>
      </div>
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
