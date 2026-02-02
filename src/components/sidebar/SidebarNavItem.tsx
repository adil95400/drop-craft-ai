/**
 * SidebarNavItem - Item de navigation optimisé pour la sidebar
 */
import { memo, useCallback } from 'react'
import { ChevronRight, Star, Lock } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
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

  const handleNavigate = useCallback(() => {
    if (hasAccess) onNavigate(route)
  }, [hasAccess, onNavigate, route])

  const handleSubNavigate = useCallback((subRoute: string) => {
    onNavigate(subRoute)
  }, [onNavigate])

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle?.()
  }, [onFavoriteToggle])

  // Badge de plan compact
  const PlanBadge = planBadge && (
    <Badge 
      className={cn(
        "text-[8px] px-1 py-0 h-3.5 font-bold",
        planBadge === 'pro' 
          ? "bg-primary/10 text-primary border-primary/20" 
          : "bg-warning/10 text-warning border-warning/20"
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
                "w-full justify-between group/item",
                "hover:bg-sidebar-accent/60",
                (isActive || subItemsOpen) && "bg-sidebar-accent/50",
                !hasAccess && "opacity-40 cursor-not-allowed"
              )}
              disabled={!hasAccess}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{name}</span>
              </div>
              <div className="flex items-center gap-1">
                {!hasAccess && <Lock className="h-3 w-3" />}
                {PlanBadge}
                <ChevronRight 
                  className={cn(
                    "h-3 w-3 transition-transform duration-150",
                    subItemsOpen && "rotate-90"
                  )}
                />
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <SidebarMenuSub className="ml-3 mt-0.5 border-l border-sidebar-border/40 pl-2">
              {subItems.map(subItem => {
                const SubIcon = iconMap?.[subItem.icon] || Icon
                return (
                  <SidebarMenuSubItem key={subItem.id}>
                    <SidebarMenuSubButton
                      onClick={() => handleSubNavigate(subItem.route)}
                      className="text-xs py-1 hover:bg-sidebar-accent/40"
                    >
                      <SubIcon className="h-3 w-3 mr-2 flex-shrink-0" />
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
    <SidebarMenuItem className="group/menu-item">
      <SidebarMenuButton
        onClick={handleNavigate}
        tooltip={collapsed ? name : undefined}
        isActive={isActive}
        disabled={!hasAccess}
        className={cn(
          "w-full peer/menu-button",
          "hover:bg-sidebar-accent/60",
          isActive && "bg-primary text-primary-foreground",
          !hasAccess && "opacity-40 cursor-not-allowed"
        )}
      >
        <Icon className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive && "scale-105"
        )} />
        
        {!collapsed && (
          <div className="flex items-center justify-between w-full gap-1 min-w-0">
            <span className="text-sm truncate">{name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!hasAccess && <Lock className="h-3 w-3" />}
              {PlanBadge}
            </div>
          </div>
        )}
      </SidebarMenuButton>
      
      {/* Favorite action - using SidebarMenuAction to avoid button nesting */}
      {!collapsed && isFavorite !== undefined && onFavoriteToggle && (
        <SidebarMenuAction
          onClick={handleFavoriteClick}
          showOnHover={!isFavorite}
          className={cn(isFavorite && "opacity-100")}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star 
            className={cn(
              "h-3 w-3",
              isFavorite 
                ? "fill-warning text-warning" 
                : "text-muted-foreground hover:text-warning"
            )}
          />
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  )
})

SidebarNavItem.displayName = 'SidebarNavItem'
