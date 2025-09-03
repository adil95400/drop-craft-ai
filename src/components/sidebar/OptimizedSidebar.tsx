import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUnifiedPlan } from "@/components/plan/UnifiedPlanProvider";
import { useModules } from '@/hooks/useModules';
import { getSidebarItems } from './SidebarConfig';
import { Search, Crown } from 'lucide-react';

export function OptimizedSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = useUnifiedPlan();
  const { canAccess } = useModules();
  
  // State management optimisé
  const [searchQuery, setSearchQuery] = useState("");

  // Génération dynamique des éléments basée sur la configuration des modules
  const sidebarItems = useMemo(() => getSidebarItems(plan), [plan]);

  // Détection optimisée de la route active
  const isActive = useCallback((url?: string) => {
    if (!url) return false;
    return location.pathname === url || location.pathname.startsWith(url + '/');
  }, [location.pathname]);

  // Filtrage et groupement des éléments
  const filteredItems = useMemo(() => {
    return sidebarItems.filter(item => {
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const hasAccess = canAccess(item.id);
      return matchesSearch && hasAccess;
    });
  }, [searchQuery, sidebarItems, canAccess]);

  const groupedItems = useMemo(() => {
    return {
      core: filteredItems.filter(item => !item.requiredPlan || item.requiredPlan === 'standard'),
      pro: filteredItems.filter(item => item.requiredPlan === 'pro'),
      ultraPro: filteredItems.filter(item => item.requiredPlan === 'ultra_pro')
    };
  }, [filteredItems]);

  // Gestionnaire de navigation
  const handleNavigation = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  return (
    <Sidebar
      className={cn(
        "border-r bg-background/95 backdrop-blur-md transition-all duration-300",
        "shadow-lg shadow-black/5",
        collapsed && "w-16"
      )}
      collapsible="icon"
    >
      {/* Header avec recherche */}
      {!collapsed && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <SidebarContent className="px-2 py-4 space-y-4">
        {/* Core modules */}
        {groupedItems.core.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
                Essentiel
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {groupedItems.core.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2 h-10",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors duration-200",
                        isActive(item.url) && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Pro modules */}
        {groupedItems.pro.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-3 w-3" />
                Pro
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {groupedItems.pro.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2 h-10",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors duration-200",
                        isActive(item.url) && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge variant="default" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Ultra Pro modules */}
        {groupedItems.ultraPro.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-3 w-3 text-primary" />
                Ultra Pro
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {groupedItems.ultraPro.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2 h-10",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors duration-200",
                        isActive(item.url) && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge variant="default" className="ml-auto text-xs bg-primary">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Message de recherche vide */}
        {searchQuery && filteredItems.length === 0 && !collapsed && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucun résultat trouvé</p>
            <p className="text-xs mt-1">
              Essayez un autre terme de recherche
            </p>
          </div>
        )}

        {/* Upgrade prompt pour les modules non accessibles */}
        {!collapsed && plan === 'standard' && (
          <div className="mt-auto p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center space-y-2">
              <Crown className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium text-sm">Débloquez plus de fonctionnalités</h4>
              <p className="text-xs text-muted-foreground">
                Accédez aux modules Pro et Ultra Pro
              </p>
              <Button 
                size="sm" 
                className="w-full" 
                onClick={() => navigate('/pricing-plans')}
              >
                Voir les plans
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}