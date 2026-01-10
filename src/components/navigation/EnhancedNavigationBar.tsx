import { memo } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ModuleNavigationMenu } from './ModuleNavigationMenu'
import { QuickNavigationBar } from './QuickNavigationBar'
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs'
import { cn } from '@/lib/utils'

interface EnhancedNavigationBarProps {
  className?: string
  showBreadcrumbs?: boolean
  showModuleMenu?: boolean
  showQuickSearch?: boolean
}

function EnhancedNavigationBarComponent({
  className,
  showBreadcrumbs = true,
  showModuleMenu = true,
  showQuickSearch = true,
}: EnhancedNavigationBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      {/* Main navigation row */}
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Left: Sidebar trigger */}
        <SidebarTrigger className="-ml-1 shrink-0" />

        {/* Center: Module navigation menu (hidden on mobile) */}
        {showModuleMenu && (
          <div className="hidden md:flex flex-1 justify-center">
            <ModuleNavigationMenu />
          </div>
        )}

        {/* Right: Quick search */}
        <div className="flex items-center gap-2 ml-auto">
          {showQuickSearch && <QuickNavigationBar />}
        </div>
      </div>

      {/* Breadcrumbs row (optional) */}
      {showBreadcrumbs && (
        <div className="hidden md:flex h-10 items-center border-t bg-muted/30 px-4">
          <NavigationBreadcrumbs />
        </div>
      )}
    </header>
  )
}

export const EnhancedNavigationBar = memo(
  EnhancedNavigationBarComponent,
  (prevProps, nextProps) =>
    prevProps.showBreadcrumbs === nextProps.showBreadcrumbs &&
    prevProps.showModuleMenu === nextProps.showModuleMenu &&
    prevProps.showQuickSearch === nextProps.showQuickSearch &&
    prevProps.className === nextProps.className
)
