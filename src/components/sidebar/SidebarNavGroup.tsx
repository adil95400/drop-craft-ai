/**
 * SidebarNavGroup - Groupe de navigation collapsible optimisé
 */
import { memo, ReactNode, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarNavGroupProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isOpen: boolean
  onToggle: () => void
  collapsed: boolean
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
  children,
  itemCount
}) => {
  const handleToggle = useCallback(() => onToggle(), [onToggle])

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <SidebarGroup className="py-0.5">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel 
            className={cn(
              "flex items-center w-full cursor-pointer rounded-md px-2 py-1.5",
              "hover:bg-sidebar-accent/50 transition-colors duration-150",
              "text-muted-foreground font-semibold text-[11px] uppercase tracking-wide",
              isOpen && "text-foreground bg-sidebar-accent/30",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <Icon className="h-4 w-4" />
            ) : (
              <>
                <Icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span className="flex-1 truncate text-left">{label}</span>
                {itemCount !== undefined && (
                  <span className="text-[10px] text-muted-foreground/60 mr-1.5 tabular-nums">
                    {itemCount}
                  </span>
                )}
                <ChevronDown 
                  className={cn(
                    "h-3 w-3 flex-shrink-0 transition-transform duration-150",
                    isOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <SidebarGroupContent className="pt-0.5 pb-1">
            <SidebarMenu className="gap-px">
              {children}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
})

SidebarNavGroup.displayName = 'SidebarNavGroup'
