/**
 * SidebarNavGroup - Groupe de navigation collapsible
 */
import { memo, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SidebarNavGroupProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isOpen: boolean
  onToggle: () => void
  collapsed: boolean
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  children: ReactNode
  itemCount?: number
}

export const SidebarNavGroup = memo<SidebarNavGroupProps>(({
  id,
  label,
  icon: Icon,
  isOpen,
  onToggle,
  collapsed,
  badge,
  badgeVariant = 'secondary',
  children,
  itemCount
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel 
            className={cn(
              "flex items-center w-full cursor-pointer rounded-md px-2 py-2 transition-all duration-200",
              "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              "text-muted-foreground font-medium text-xs uppercase tracking-wider",
              isOpen && "text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <Icon className="h-4 w-4" />
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-1 truncate text-left">{label}</span>
                {badge && (
                  <Badge 
                    variant={badgeVariant} 
                    className="text-[9px] px-1.5 py-0 h-4 mr-1.5"
                  >
                    {badge}
                  </Badge>
                )}
                {itemCount !== undefined && (
                  <span className="text-[10px] text-muted-foreground/70 mr-1.5">
                    {itemCount}
                  </span>
                )}
                <ChevronDown 
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="animate-accordion-down">
          <SidebarGroupContent className="pt-1 pb-2">
            <SidebarMenu className="gap-0.5">
              {children}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
})

SidebarNavGroup.displayName = 'SidebarNavGroup'
