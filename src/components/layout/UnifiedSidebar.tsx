import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3, Package, Truck, Upload, Trophy, Sparkles, Crown,
  TrendingUp, Zap, Users, Search, Brain, ShoppingCart, Shield, Plug,
  Settings, Home, ChevronDown
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useModules } from '@/hooks/useModules.tsx';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { MODULE_REGISTRY } from '@/config/modules';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const iconMap: Record<string, any> = {
  BarChart3, Package, Truck, Upload, Trophy, Sparkles, Crown,
  TrendingUp, Zap, Users, Search, Brain, ShoppingCart, Shield, Plug,
  Settings, Home
};

export function UnifiedSidebar() {
  const { open, state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { canAccess, currentPlan } = useModules();
  const { profile, user } = useUnifiedAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    standard: true,
    pro: true,
    ultra: true
  });

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  // Grouper les modules par plan
  const standardModules = Object.values(MODULE_REGISTRY).filter(m => m.minPlan === 'standard');
  const proModules = Object.values(MODULE_REGISTRY).filter(m => m.minPlan === 'pro');
  const ultraModules = Object.values(MODULE_REGISTRY).filter(m => m.minPlan === 'ultra_pro');

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const renderModuleItem = (module: typeof MODULE_REGISTRY[string]) => {
    const Icon = iconMap[module.icon] || Package;
    const hasAccess = canAccess(module.id);
    const active = isActive(module.route);

    return (
      <SidebarMenuItem key={module.id}>
        <SidebarMenuButton asChild disabled={!hasAccess}>
          <NavLink
            to={hasAccess ? module.route : '#'}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
              active && "bg-primary/10 text-primary font-medium",
              !active && hasAccess && "hover:bg-muted",
              !hasAccess && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{module.name}</span>
                {module.minPlan === 'pro' && (
                  <Badge variant="secondary" className="text-xs">PRO</Badge>
                )}
                {module.minPlan === 'ultra_pro' && (
                  <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">ULTRA</Badge>
                )}
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderModuleGroup = (
    title: string,
    modules: typeof standardModules,
    groupKey: string,
    badgeText?: string
  ) => {
    const hasActiveModule = modules.some(m => isActive(m.route));

    return (
      <Collapsible
        open={openGroups[groupKey] || hasActiveModule}
        onOpenChange={() => toggleGroup(groupKey)}
      >
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className={cn(
              "flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 py-1",
              collapsed && "justify-center"
            )}>
              <span className="flex items-center gap-2">
                {title}
                {badgeText && !collapsed && (
                  <Badge variant="outline" className="text-xs">{badgeText}</Badge>
                )}
              </span>
              {!collapsed && (
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  openGroups[groupKey] && "rotate-180"
                )} />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {modules.map(renderModuleItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm">DropCraft AI</h2>
              <p className="text-xs text-muted-foreground">E-commerce Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/dashboard"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg",
                      isActive('/dashboard') && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Home className="h-4 w-4" />
                    {!collapsed && <span>Accueil</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modules Standard */}
        {renderModuleGroup('Modules Standard', standardModules, 'standard')}

        {/* Modules Pro */}
        {renderModuleGroup('Modules Pro', proModules, 'pro', 'PRO')}

        {/* Modules Ultra Pro */}
        {renderModuleGroup('Modules Ultra Pro', ultraModules, 'ultra', 'ULTRA')}

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg",
                      isActive('/settings') && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Paramètres</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        {!collapsed && (user || profile) && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentPlan.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        {collapsed && (user || profile) && (
          <Avatar className="h-8 w-8 mx-auto">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
