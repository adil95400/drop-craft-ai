import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { 
  Search, Bot, ShoppingCart, BarChart3, 
  Truck, Upload, Trophy, TrendingUp, Zap, 
  Users, Brain, Shield, Plug, Settings,
  ChevronDown, Package, Sparkles, Crown, Calculator,
  Megaphone, FileText, Globe, Store, Puzzle, GitCompare
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MODULE_REGISTRY, type ModuleConfig } from "@/config/modules";
import { useModules } from "@/hooks/useModules";
import { getSubModules } from "@/config/sub-modules";

// Logo mémoïsé pour éviter les re-renders inutiles
const ShopoptiLogo = memo(() => (
  <div className="flex items-center gap-3 px-2 group">
    <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
      <ShoppingCart className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-12" />
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
    <div className="flex flex-col">
      <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent transition-all duration-300 group-hover:from-primary/80 group-hover:to-secondary/80">
        DropCraft AI
      </span>
      <span className="text-xs text-muted-foreground -mt-1 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Pro Platform
      </span>
    </div>
  </div>
));
ShopoptiLogo.displayName = "ShopoptiLogo";

// Map des icônes pour chaque module
const iconMap: Record<string, React.ComponentType<any>> = {
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
  'GitCompare': GitCompare
};

// Regroupements logiques des modules
const moduleGroups = [
  {
    title: "🚀 ESSENTIELS",
    modules: ['dashboard', 'products', 'suppliers', 'premiumCatalog', 'import', 'winners', 'marketplace', 'network']
  },
  {
    title: "📊 ANALYTICS & AUTOMATION",
    modules: ['analytics', 'automation']
  },
  {
    title: "💼 BUSINESS",
    modules: ['crm', 'seo']
  },
  {
    title: "⚡ ADVANCED",
    modules: ['ai', 'commerce', 'security', 'integrations', 'supplierAdmin']
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useUnifiedAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(
    moduleGroups.map(g => g.title) // Tous les groupes ouverts par défaut
  );
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  
  // Utiliser le système de modules
  const modulesData = useModules();
  const { availableModules, canAccess, isModuleEnabled } = modulesData;
  const isAdminBypass = (modulesData as any).isAdminBypass || false;

  // Debounce la recherche
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Déterminer le groupe actif basé sur l'URL
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
      const group = moduleGroups.find(g => g.modules.includes(activeModule.id));
      if (group && !openGroups.includes(group.title)) {
        setOpenGroups(prev => [...prev, group.title]);
      }
      
      // Ouvrir le sous-menu si une route de sous-module est active
      const subModules = getSubModules(activeModule.id);
      if (subModules.length > 0) {
        const hasActiveSubModule = subModules.some(sm => isActive(sm.route));
        if (hasActiveSubModule && !openSubMenus[activeModule.id]) {
          setOpenSubMenus(prev => ({
            ...prev,
            [activeModule.id]: true
          }));
        }
      }
    }
  }, [activeModule, openGroups, openSubMenus, isActive]);

  const toggleGroup = useCallback((groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  }, []);

  const handleNavigate = useCallback((url: string, moduleId: string) => {
    if (canAccess(moduleId)) {
      navigate(url);
    }
  }, [navigate, canAccess]);

  const toggleSubMenu = useCallback((moduleId: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  }, []);

  // Filtrer les modules par recherche
  const filteredModuleGroups = useMemo(() => {
    if (!debouncedSearchQuery) return moduleGroups;
    
    const query = debouncedSearchQuery.toLowerCase();
    return moduleGroups.map(group => ({
      ...group,
      modules: group.modules.filter(moduleId => {
        const module = MODULE_REGISTRY[moduleId];
        return module && (
          module.name.toLowerCase().includes(query) ||
          module.description.toLowerCase().includes(query)
        );
      })
    })).filter(group => group.modules.length > 0);
  }, [debouncedSearchQuery]);

  const getBadgeVariant = useCallback((plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm';
      case 'ultra_pro': return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md';
      default: return 'bg-secondary text-secondary-foreground';
    }
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r bg-card/50 backdrop-blur-md transition-all duration-300">
      <SidebarHeader className="border-b bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-md">
        <div className="px-2 py-4 animate-fade-in">
          {state !== "collapsed" ? (
            <div className="space-y-2">
              <ShopoptiLogo />
              {isAdminBypass && (
                <Badge className="w-full justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg animate-pulse">
                  <Crown className="w-3 h-3 mr-1" />
                  ADMIN - ACCÈS TOTAL
                </Badge>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
              <ShoppingCart className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
          )}
        </div>
        
        {state !== "collapsed" && (
          <div className="px-2 pb-4 animate-fade-in">
            <div className="relative group">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <Input
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background/50 border-border/50 transition-all duration-200 focus:bg-background focus:border-primary/50 focus:shadow-sm"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredModuleGroups.map((group) => {
          const groupModules = group.modules
            .map(id => MODULE_REGISTRY[id])
            .filter(m => m && isModuleEnabled(m.id));

          if (groupModules.length === 0) return null;

          return (
            <Collapsible
              key={group.title}
              open={openGroups.includes(group.title)}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="group/label w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-all duration-200 cursor-pointer hover:shadow-sm">
                    <div className="flex items-center justify-between w-full">
                      {state !== "collapsed" && (
                        <>
                          <span className="text-xs font-semibold transition-colors duration-200">{group.title}</span>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-all duration-300 group-hover/label:text-primary",
                            openGroups.includes(group.title) && "rotate-180"
                          )} />
                        </>
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent className="animate-accordion-down">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupModules.map((module) => {
                        const Icon = iconMap[module.icon] || Settings;
                        const active = isActive(module.route);
                        const accessible = canAccess(module.id);
                        const subModules = getSubModules(module.id);
                        const hasSubItems = subModules.length > 0;
                        const subMenuOpen = openSubMenus[module.id] || false;

                        return (
                          <SidebarMenuItem key={module.id} className="animate-fade-in">
                            {!hasSubItems ? (
                              <SidebarMenuButton
                                onClick={() => handleNavigate(module.route, module.id)}
                                tooltip={state === "collapsed" ? module.name : undefined}
                                className={cn(
                                  "w-full justify-start transition-all duration-300 group relative overflow-hidden",
                                  active 
                                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                                    : "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                                  !accessible && "opacity-50 cursor-not-allowed",
                                  "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                                )}
                                disabled={!accessible}
                                isActive={active}
                              >
                                <Icon className={cn(
                                  "h-4 w-4 transition-all duration-300",
                                  active && "scale-110"
                                )} />
                                {state !== "collapsed" && (
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                                      {module.name}
                                    </span>
                                    {module.minPlan !== 'standard' && (
                                      <Badge 
                                        variant="secondary"
                                        className={cn(
                                          "text-xs h-5 px-2 font-medium transition-all duration-200 group-hover:scale-105",
                                          getBadgeVariant(module.minPlan)
                                        )}
                                      >
                                        {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </SidebarMenuButton>
                            ) : (
                              <Collapsible open={subMenuOpen} onOpenChange={() => toggleSubMenu(module.id)}>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    onClick={() => handleNavigate(module.route, module.id)}
                                    tooltip={state === "collapsed" ? module.name : undefined}
                                    className={cn(
                                      "w-full justify-start transition-all duration-300 group relative overflow-hidden",
                                      active 
                                        ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                                        : "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                                      !accessible && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={!accessible}
                                    isActive={active}
                                  >
                                    <Icon className={cn(
                                      "h-4 w-4 transition-all duration-300",
                                      active && "scale-110"
                                    )} />
                                    {state !== "collapsed" && (
                                      <div className="flex items-center justify-between w-full gap-2">
                                        <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                                          {module.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {module.minPlan !== 'standard' && (
                                            <Badge 
                                              variant="secondary"
                                              className={cn(
                                                "text-xs h-5 px-2 font-medium transition-all duration-200",
                                                getBadgeVariant(module.minPlan)
                                              )}
                                            >
                                              {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                                            </Badge>
                                          )}
                                          <ChevronDown className={cn(
                                            "h-4 w-4 transition-transform duration-300",
                                            subMenuOpen && "rotate-180"
                                          )} />
                                        </div>
                                      </div>
                                    )}
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                
                                {state !== "collapsed" && (
                                  <CollapsibleContent className="ml-4 mt-1 space-y-1">
                                    {subModules.map((subModule) => {
                                      const SubIcon = iconMap[subModule.icon] || Settings;
                                      const subActive = isActive(subModule.route);
                                      
                                      return (
                                        <SidebarMenuButton
                                          key={subModule.id}
                                          onClick={() => handleNavigate(subModule.route, module.id)}
                                          className={cn(
                                            "w-full justify-start text-sm transition-all duration-200",
                                            subActive 
                                              ? "bg-primary/20 text-primary font-medium" 
                                              : "hover:bg-accent/50"
                                          )}
                                          isActive={subActive}
                                        >
                                          <SubIcon className="h-3.5 w-3.5" />
                                          <span className="truncate">{subModule.name}</span>
                                        </SidebarMenuButton>
                                      );
                                    })}
                                  </CollapsibleContent>
                                )}
                              </Collapsible>
                            )}
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
      
      {/* Rail pour rouvrir la sidebar en mode collapsed avec animation */}
      <SidebarRail className="transition-all duration-300 hover:bg-primary/10" />
    </Sidebar>
  );
}
