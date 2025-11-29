import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useFavorites } from "@/stores/favoritesStore";
import { 
  Search, Bot, ShoppingCart, BarChart3, Truck, Upload, Trophy, TrendingUp, 
  Zap, Users, Brain, Shield, Plug, Settings, ChevronDown, Package, Sparkles, 
  Crown, Calculator, Megaphone, FileText, Globe, Store, Puzzle, GitCompare, 
  Database, ShoppingBag, GraduationCap, HelpCircle, Activity, Building2, 
  Home, Boxes, CreditCard, LifeBuoy, Video 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, 
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, 
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar 
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MODULE_REGISTRY, NAV_GROUPS, type NavGroupId } from "@/config/modules";
import { useModules } from "@/hooks/useModules";
import { getAccessibleSubModules } from "@/config/sub-modules";
import { FavoriteButton } from "@/components/navigation/FavoriteButton";
import { Star } from "lucide-react";

// Logo mémoïsé
const ShopoptiLogo = memo(() => (
  <div className="flex items-center gap-3 px-2 group cursor-pointer">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl rounded-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative w-9 h-9 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/40 group-hover:scale-105">
        <ShoppingCart className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:rotate-12" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text transition-all duration-300 group-hover:from-primary/90 group-hover:via-primary group-hover:to-secondary/90 drop-shadow-sm text-lg text-blue-700">
        ShopOpti
      </span>
      <div className="flex items-center gap-1.5 -mt-0.5">
        <div className="relative">
          <Sparkles className="w-3 h-3 text-primary drop-shadow-md" />
          <div className="absolute inset-0 blur-sm">
            <Sparkles className="w-3 h-3 text-primary animate-pulse-subtle" />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          Pro Platform
        </span>
      </div>
    </div>
  </div>
));
ShopoptiLogo.displayName = "ShopoptiLogo";

// Map des icônes
const iconMap: Record<string, React.ComponentType<any>> = {
  'Home': Home,
  'BarChart3': BarChart3,
  'Package': Package,
  'Truck': Truck,
  'Upload': Upload,
  'Trophy': Trophy,
  'TrendingUp': TrendingUp,
  'Zap': Zap,
  'Users': Users,
  'Search': Search,
  'Brain': Brain,
  'Shield': Shield,
  'Plug': Plug,
  'ShoppingCart': ShoppingCart,
  'Bot': Bot,
  'Settings': Settings,
  'Sparkles': Sparkles,
  'Crown': Crown,
  'Calculator': Calculator,
  'Megaphone': Megaphone,
  'FileText': FileText,
  'Globe': Globe,
  'Store': Store,
  'PuzzlePiece': Puzzle,
  'Puzzle': Puzzle,
  'GitCompare': GitCompare,
  'Database': Database,
  'ShoppingBag': ShoppingBag,
  'GraduationCap': GraduationCap,
  'HelpCircle': HelpCircle,
  'Activity': Activity,
  'Building2': Building2,
  'Boxes': Boxes,
  'CreditCard': CreditCard,
  'LifeBuoy': LifeBuoy,
  'Video': Video,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useUnifiedAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<NavGroupId[]>([]);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // Utiliser le système de modules et favoris
  const modulesData = useModules();
  const { availableModules, canAccess, isModuleEnabled } = modulesData;
  const currentPlan = modulesData.currentPlan;
  const isAdminBypass = modulesData.isAdminBypass || false;
  const { favorites, isFavorite } = useFavorites();

  // Debounce la recherche
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Déterminer le module actif basé sur l'URL
  const activeModule = useMemo(() => {
    const currentPath = location.pathname;
    return availableModules.find(module => 
      currentPath === module.route || currentPath.startsWith(module.route + '/')
    );
  }, [location.pathname, availableModules]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Garder le groupe actif et sous-menu actif ouverts
  useEffect(() => {
    if (activeModule) {
      const groupId = activeModule.groupId;
      if (groupId && !openGroups.includes(groupId)) {
        setOpenGroups(prev => [...prev, groupId]);
      }

      // Ouvrir le sous-menu si une route de sous-module est active
      const subModules = getAccessibleSubModules(activeModule.id, currentPlan);
      if (subModules.length > 0) {
        const hasActiveSubModule = subModules.some(sm => isActive(sm.route));
        if (hasActiveSubModule && !openSubMenus[activeModule.id]) {
          setOpenSubMenus(prev => ({ ...prev, [activeModule.id]: true }));
        }
      }
    }
  }, [activeModule, openGroups, openSubMenus, isActive, currentPlan]);

  const toggleGroup = useCallback((groupId: NavGroupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  }, []);

  const handleNavigate = useCallback((url: string, moduleId: string) => {
    if (canAccess(moduleId)) {
      navigate(url);
    }
  }, [navigate, canAccess]);

  const toggleSubMenu = useCallback((moduleId: string) => {
    setOpenSubMenus(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  // Grouper les modules par NavGroup
  const modulesByGroup = useMemo(() => {
    const grouped: Record<NavGroupId, typeof availableModules> = {} as any;
    
    availableModules.forEach(module => {
      if (!module.groupId || !isModuleEnabled(module.id)) return;
      if (!grouped[module.groupId]) {
        grouped[module.groupId] = [];
      }
      grouped[module.groupId].push(module);
    });

    // Trier les modules dans chaque groupe par order
    Object.keys(grouped).forEach(groupId => {
      grouped[groupId as NavGroupId].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [availableModules, isModuleEnabled]);

  // Filtrer les groupes par recherche
  const filteredGroups = useMemo(() => {
    if (!debouncedSearchQuery) {
      return NAV_GROUPS.filter(group => modulesByGroup[group.id]?.length > 0);
    }
    
    const query = debouncedSearchQuery.toLowerCase();
    return NAV_GROUPS.filter(group => {
      const groupModules = modulesByGroup[group.id] || [];
      return groupModules.some(module => 
        module.name.toLowerCase().includes(query) || 
        module.description.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearchQuery, modulesByGroup]);

  const getBadgeVariant = useCallback((plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md shadow-purple-500/30';
      case 'ultra_pro':
        return 'bg-gradient-to-r from-yellow-500 via-orange-500 to-orange-600 hover:from-yellow-600 hover:via-orange-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/40';
      default:
        return 'bg-secondary/80 text-secondary-foreground border border-border/50 shadow-sm';
    }
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-gradient-to-b from-card/80 to-background/60 backdrop-blur-xl backdrop-saturate-150 shadow-xl transition-all duration-300">
      <SidebarHeader className="border-b border-border/30 bg-gradient-to-br from-background/95 via-muted/20 to-background/90 backdrop-blur-2xl shadow-sm">
        <div className="px-3 py-4 animate-fade-in">
          {state !== "collapsed" ? (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl rounded-2xl" />
                <div className="relative">
                  <ShopoptiLogo />
                </div>
              </div>
              
              {isAdminBypass && (
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-md" />
                  <Badge className="relative w-full justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 animate-pulse border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    ADMIN - ACCÈS TOTAL
                  </Badge>
                </div>
              )}
              
              <div className="pt-1">
                <ThemeToggle collapsed={false} variant="ghost" className="w-full hover:bg-accent/50" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 blur-lg rounded-lg" />
                <div className="relative w-9 h-9 mx-auto bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-110 transition-all duration-300 cursor-pointer group">
                  <ShoppingCart className="w-5 h-5 text-primary-foreground group-hover:rotate-12 transition-transform duration-300" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              <ThemeToggle collapsed={true} variant="ghost" className="mx-auto hover:bg-accent/50" />
            </div>
          )}
        </div>
        
        {state !== "collapsed" && (
          <div className="px-3 pb-4 animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-all duration-200 group-focus-within:text-primary group-focus-within:scale-110" />
              <Input 
                placeholder="Rechercher un module..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="relative pl-9 pr-4 bg-background/60 border-border/40 backdrop-blur-sm rounded-lg transition-all duration-200 focus:bg-background focus:border-primary/50 focus:shadow-md focus:shadow-primary/10 hover:border-border/60" 
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 custom-scrollbar">
        {/* Section Favoris */}
        {favorites.length > 0 && (
          <SidebarGroup className="mb-3">
            <SidebarGroupLabel className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-sm">
              {state !== "collapsed" && (
                <>
                  <div className="relative">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 drop-shadow-lg" />
                    <div className="absolute inset-0 blur-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    FAVORIS
                  </span>
                  <Badge variant="secondary" className="text-xs ml-auto bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
                    {favorites.length}
                  </Badge>
                </>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favorites.slice(0, 5).map(fav => {
                  const module = MODULE_REGISTRY[fav.moduleId];
                  if (!module || !canAccess(module.id)) return null;
                  const Icon = iconMap[module.icon] || Settings;
                  const active = isActive(module.route);
                  
                  return (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigate(module.route, module.id)}
                        tooltip={state === "collapsed" ? module.name : undefined}
                        className={cn(
                          "w-full justify-start transition-all duration-300 group relative overflow-hidden rounded-lg",
                          active 
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]" 
                            : "hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md hover:scale-[1.01] backdrop-blur-sm"
                        )}
                        isActive={active}
                      >
                        <Icon className={cn("h-4 w-4 transition-transform duration-300", active && "scale-110 drop-shadow-lg")} />
                        {state !== "collapsed" && (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="truncate text-sm font-medium">{module.name}</span>
                            <FavoriteButton 
                              moduleId={module.id} 
                              size="icon" 
                              className="h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity" 
                            />
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Groupes de navigation dynamiques */}
        {filteredGroups.map(navGroup => {
          const groupModules = modulesByGroup[navGroup.id] || [];
          if (groupModules.length === 0) return null;

          const GroupIcon = iconMap[navGroup.icon] || Settings;
          const isGroupOpen = openGroups.includes(navGroup.id);

          return (
            <Collapsible 
              key={navGroup.id} 
              open={isGroupOpen} 
              onOpenChange={() => toggleGroup(navGroup.id)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="group/label w-full hover:bg-gradient-to-r hover:from-accent/80 hover:to-accent/40 hover:text-accent-foreground rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md hover:shadow-primary/5 backdrop-blur-sm border border-transparent hover:border-border/30">
                    <div className="flex items-center justify-between w-full px-1">
                      {state !== "collapsed" && (
                        <>
                          <div className="flex items-center gap-2">
                            <GroupIcon className="h-4 w-4 transition-transform duration-300 group-hover/label:scale-110" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {navGroup.label}
                            </span>
                          </div>
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-all duration-300", 
                              isGroupOpen && "rotate-180"
                            )} 
                          />
                        </>
                      )}
                      {state === "collapsed" && (
                        <GroupIcon className="h-4 w-4 mx-auto" />
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0.5">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupModules.map(module => {
                        const Icon = iconMap[module.icon] || Settings;
                        const active = isActive(module.route);
                        const accessible = canAccess(module.id);
                        const subModules = getAccessibleSubModules(module.id, currentPlan);
                        const hasSubModules = subModules.length > 0;
                        const isSubMenuOpen = openSubMenus[module.id];

                        if (hasSubModules) {
                          return (
                            <Collapsible
                              key={module.id}
                              open={isSubMenuOpen}
                              onOpenChange={() => toggleSubMenu(module.id)}
                            >
                              <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    className={cn(
                                      "w-full justify-between transition-all duration-300",
                                      active && "bg-accent text-accent-foreground"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {state !== "collapsed" && (
                                        <span className="text-sm">{module.name}</span>
                                      )}
                                    </div>
                                    {state !== "collapsed" && (
                                      <ChevronDown 
                                        className={cn(
                                          "h-4 w-4 transition-transform duration-200",
                                          isSubMenuOpen && "rotate-180"
                                        )}
                                      />
                                    )}
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>

                                {state !== "collapsed" && (
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {subModules.map(subModule => {
                                        const SubIcon = iconMap[subModule.icon] || Settings;
                                        const subActive = isActive(subModule.route);
                                        
                                        return (
                                          <SidebarMenuSubItem key={subModule.id}>
                                            <SidebarMenuSubButton
                                              onClick={() => navigate(subModule.route)}
                                              className={cn(
                                                "transition-all duration-200",
                                                subActive && "bg-accent text-accent-foreground font-medium"
                                              )}
                                              isActive={subActive}
                                            >
                                              <SubIcon className="h-3 w-3" />
                                              <span className="text-xs">{subModule.name}</span>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        );
                                      })}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                )}
                              </SidebarMenuItem>
                            </Collapsible>
                          );
                        }

                        return (
                          <SidebarMenuItem key={module.id}>
                            <SidebarMenuButton
                              onClick={() => handleNavigate(module.route, module.id)}
                              tooltip={state === "collapsed" ? module.name : undefined}
                              className={cn(
                                "w-full justify-start transition-all duration-300 group relative overflow-hidden rounded-lg",
                                active 
                                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]" 
                                  : "hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md hover:scale-[1.01]",
                                !accessible && "opacity-50 cursor-not-allowed"
                              )}
                              isActive={active}
                              disabled={!accessible}
                            >
                              <Icon className={cn("h-4 w-4 transition-transform duration-300", active && "scale-110")} />
                              {state !== "collapsed" && (
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="truncate text-sm font-medium">{module.name}</span>
                                  <div className="flex items-center gap-1">
                                    {module.minPlan !== 'standard' && (
                                      <Badge className={cn("text-[10px] px-1.5 py-0", getBadgeVariant(module.minPlan))}>
                                        {module.minPlan === 'ultra_pro' ? 'Ultra' : 'Pro'}
                                      </Badge>
                                    )}
                                    <FavoriteButton 
                                      moduleId={module.id} 
                                      size="icon" 
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    />
                                  </div>
                                </div>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
