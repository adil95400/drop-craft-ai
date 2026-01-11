/**
 * Item de module pour le Sitemap
 */
import { memo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SitemapPlanBadge } from './SitemapPlanBadge'
import { SitemapSubModuleList } from './SitemapSubModuleList'
import type { ModuleConfig } from '@/config/modules'
import type { PlanType } from '@/lib/unified-plan-system'
import * as Icons from 'lucide-react'

interface SitemapModuleItemProps {
  module: ModuleConfig
  isAccessible: boolean
  currentPlan: PlanType
  searchQuery?: string
  defaultExpanded?: boolean
}

const getIcon = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName]
  return IconComponent || Icons.Package
}

export const SitemapModuleItem = memo<SitemapModuleItemProps>(({
  module,
  isAccessible,
  currentPlan,
  searchQuery = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || !!searchQuery)
  const hasSubModules = module.subModules && module.subModules.length > 0
  const Icon = getIcon(module.icon)

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(prev => !prev)
  }, [])

  const planHierarchy: PlanType[] = ['free', 'standard', 'pro', 'ultra_pro']
  const isLocked = planHierarchy.indexOf(module.minPlan) > planHierarchy.indexOf(currentPlan)

  return (
    <div className="group">
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-transparent",
          "hover:border-border hover:bg-accent/30 transition-all",
          isLocked && "opacity-60"
        )}
      >
        {/* Expand button */}
        {hasSubModules ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={toggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Icon */}
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0",
          isLocked ? "bg-muted" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isLocked ? "text-muted-foreground" : "text-primary"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={module.route}
              className={cn(
                "font-medium hover:text-primary transition-colors",
                isLocked && "pointer-events-none"
              )}
            >
              {module.name}
            </Link>
            <SitemapPlanBadge plan={module.minPlan} locked={isLocked} />
            {module.badge && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4",
                  module.badge === 'new' && "bg-green-500/15 text-green-600 border-green-500/30",
                  module.badge === 'beta' && "bg-amber-500/15 text-amber-600 border-amber-500/30"
                )}
              >
                {module.badge.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {module.description}
          </p>
        </div>

        {/* Sub-module count */}
        {hasSubModules && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
            {module.subModules!.length} sous-modules
          </Badge>
        )}

        {/* Link */}
        <Link
          to={module.route}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isLocked && "pointer-events-none"
          )}
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Link>
      </div>

      {/* Sub-modules */}
      {hasSubModules && isExpanded && (
        <SitemapSubModuleList 
          subModules={module.subModules!} 
          searchQuery={searchQuery}
        />
      )}
    </div>
  )
})

SitemapModuleItem.displayName = 'SitemapModuleItem'
