/**
 * SidebarNavItem - Item de navigation pour la sidebar
 */
import { memo, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronRight, Star, Lock } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface SubItem {
  id: string
  name: string
  route: string
  icon: string
}

interface SidebarNavItemProps {
  id: string
  name: string
  route: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  hasAccess: boolean
  collapsed: boolean
  planBadge?: 'pro' | 'ultra_pro'
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  subItems?: SubItem[]
  subItemsOpen?: boolean
  onSubItemsToggle?: () => void
  iconMap?: Record<string, React.ComponentType<{ className?: string }>>
  onNavigate: (route: string) => void
}

export const SidebarNavItem = memo<SidebarNavItemProps>(({
  id,
  name,
  route,
  icon: Icon,
  isActive,
  hasAccess,
  collapsed,
  planBadge,
  isFavorite,
  onFavoriteToggle,
  subItems,
  subItemsOpen,
  onSubItemsToggle,
  iconMap,
  onNavigate
}) => {
  const hasSubItems = subItems && subItems.length > 0

  // Badge de plan
  const PlanBadge = planBadge && (
    <Badge 
      className={cn(
        "text-[9px] px-1.5 py-0 h-4 font-medium",
        planBadge === 'pro' 
          ? "bg-primary/15 text-primary border-primary/30" 
          : "bg-gradient-to-r from-warning/20 to-destructive/20 text-warning border-warning/30"
      )}
      variant="outline"
    >
      {planBadge === 'pro' ? 'PRO' : 'ULTRA'}
    </Badge>
  )

  // Item avec sous-menus
  if (hasSubItems && !collapsed) {
    return (
      <Collapsible open={subItemsOpen} onOpenChange={onSubItemsToggle}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "w-full justify-between transition-all duration-200 group/item",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                (isActive || subItemsOpen) && "bg-sidebar-accent/70 text-sidebar-accent-foreground",
                !hasAccess && "opacity-50 cursor-not-allowed"
              )}
              disabled={!hasAccess}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                {PlanBadge}
                <ChevronRight 
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    subItemsOpen && "rotate-90"
                  )}
                />
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="animate-accordion-down">
            <SidebarMenuSub className="ml-4 mt-1 border-l border-sidebar-border/50 pl-2">
              {subItems.map(subItem => {
                const SubIcon = iconMap?.[subItem.icon] || Icon
                return (
                  <SidebarMenuSubItem key={subItem.id}>
                    <SidebarMenuSubButton
                      onClick={() => onNavigate(subItem.route)}
                      className={cn(
                        "text-xs py-1.5 transition-all duration-200",
                        "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <SubIcon className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{subItem.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  // Item simple
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => hasAccess && onNavigate(route)}
        tooltip={collapsed ? name : undefined}
        isActive={isActive}
        disabled={!hasAccess}
        className={cn(
          "w-full transition-all duration-200 group/item relative",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-primary text-primary-foreground shadow-sm shadow-primary/25",
          !hasAccess && "opacity-50 cursor-not-allowed"
        )}
      >
        <Icon className={cn(
          "h-4 w-4 flex-shrink-0 transition-transform duration-200",
          isActive && "scale-110"
        )} />
        
        {!collapsed && (
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{name}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
              {PlanBadge}
              {isFavorite !== undefined && onFavoriteToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onFavoriteToggle()
                  }}
                  className={cn(
                    "h-5 w-5 flex items-center justify-center rounded transition-all duration-200",
                    "opacity-0 group-hover/item:opacity-100",
                    isFavorite && "opacity-100"
                  )}
                >
                  <Star 
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-200",
                      isFavorite 
                        ? "fill-warning text-warning" 
                        : "text-muted-foreground hover:text-warning"
                    )}
                  />
                </button>
              )}
            </div>
          </div>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

SidebarNavItem.displayName = 'SidebarNavItem'
