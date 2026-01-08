import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  description?: string;
  shortcut?: string;
  status?: 'active' | 'warning' | 'syncing' | 'connected' | 'new';
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  items?: NavItem[];
}

interface SidebarItemProps {
  item: NavItem;
  isActive: (url?: string) => boolean;
  collapsed: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  level?: number;
}

// Indicateur de statut avec animations
export const StatusIndicator: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  
  const indicators = {
    active: (
      <div className="relative">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <div className="absolute inset-0 w-2 h-2 bg-success rounded-full animate-ping opacity-75" />
      </div>
    ),
    warning: (
      <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
    ),
    syncing: (
      <div className="relative">
        <div className="w-2 h-2 bg-primary rounded-full animate-spin border border-primary-foreground/20" 
             style={{ 
               background: 'conic-gradient(from 0deg, hsl(var(--primary)), transparent, hsl(var(--primary)))' 
             }} />
      </div>
    ),
    connected: (
      <div className="w-2 h-2 bg-success rounded-full" />
    ),
    new: (
      <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
    ),
  };
  
  return indicators[status as keyof typeof indicators] || null;
};

// Badge animé avec variants optimisés
export const AnimatedBadge: React.FC<{ 
  badge: NavItem['badge']; 
  className?: string; 
}> = ({ badge, className }) => {
  if (!badge) return null;
  
  return (
    <Badge 
      variant={badge.variant}
      className={cn(
        "text-xs transition-all duration-200 animate-in fade-in-0 slide-in-from-right-1",
        "hover:scale-105 active:scale-95",
        className
      )}
    >
      {badge.text}
    </Badge>
  );
};

// Composant d'item de navigation principal
export const SidebarNavigationItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  collapsed,
  isOpen,
  onToggle,
  level = 0
}) => {
  const isActiveItem = isActive(item.url);
  const hasSubItems = item.items && item.items.length > 0;

  if (hasSubItems) {
    return (
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "w-full justify-between group transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isOpen && "bg-sidebar-accent/50 text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  "group-hover:text-sidebar-accent-foreground"
                )} />
                {!collapsed && (
                  <>
                    <span className="font-medium truncate">{item.title}</span>
                    {item.badge && (
                      <AnimatedBadge 
                        badge={item.badge} 
                        className="ml-auto shrink-0" 
                      />
                    )}
                  </>
                )}
              </div>
              {!collapsed && (
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 transition-all duration-200 shrink-0",
                    "group-hover:text-sidebar-accent-foreground",
                    isOpen && "rotate-90"
                  )} 
                />
              )}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          
          {!collapsed && isOpen && (
            <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
              <SidebarMenuSub className="ml-2 border-l border-border/50">
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.url || subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(subItem.url)}
                      className="group"
                    >
                      <Link 
                        to={subItem.url || '#'} 
                        className={cn(
                          "flex items-center gap-3 w-full transition-all duration-200",
                          "hover:bg-sidebar-accent/50 hover:translate-x-1",
                          "focus-visible:ring-2 focus-visible:ring-ring",
                          "active:scale-98"
                        )}
                      >
                        <subItem.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate text-sm">{subItem.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusIndicator status={subItem.status} />
                          {subItem.badge && (
                            <AnimatedBadge badge={subItem.badge} />
                          )}
                        </div>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          )}
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Item simple sans sous-éléments
  const itemContent = (
    <SidebarMenuButton 
      asChild 
      isActive={isActiveItem}
      className={cn(
        "group transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring",
        "active:scale-98"
      )}
    >
      <Link 
        to={item.url || '#'} 
        className="flex items-center gap-3 w-full min-w-0"
      >
        <item.icon className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200",
          "group-hover:text-sidebar-accent-foreground"
        )} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate font-medium">{item.title}</span>
            <div className="flex items-center gap-2 shrink-0">
              <StatusIndicator status={item.status} />
              {item.badge && <AnimatedBadge badge={item.badge} />}
            </div>
          </>
        )}
      </Link>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {collapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {itemContent}
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              className="font-medium animate-in fade-in-0 zoom-in-95"
              sideOffset={8}
            >
              <div className="space-y-1">
                <p className="font-semibold">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground max-w-48">
                    {item.description}
                  </p>
                )}
                {item.shortcut && (
                  <p className="text-xs text-muted-foreground">
                    Raccourci: {item.shortcut}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        itemContent
      )}
    </SidebarMenuItem>
  );
};