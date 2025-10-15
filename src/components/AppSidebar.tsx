import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { 
  Search, Bot, ShoppingCart, BarChart3, 
  Truck, Upload, Trophy, TrendingUp, Zap, 
  Users, Brain, Shield, Plug, Settings,
  ChevronDown, Package
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MODULE_REGISTRY, type ModuleConfig } from "@/config/modules";
import { useModules } from "@/hooks/useModules";

// Logo
const ShopoptiLogo = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
      <ShoppingCart className="w-5 h-5 text-white" />
    </div>
    <div className="flex flex-col">
      <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        DropCraft AI
      </span>
      <span className="text-xs text-muted-foreground -mt-1">Pro Platform</span>
    </div>
  </div>
);

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
  'Settings': Settings
};

// Regroupements logiques des modules
const moduleGroups = [
  {
    title: "🚀 ESSENTIELS",
    modules: ['dashboard', 'products', 'suppliers', 'import', 'winners']
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
    modules: ['ai', 'commerce', 'security', 'integrations']
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(["🚀 ESSENTIELS"]);
  
  // Utiliser le système de modules
  const { availableModules, canAccess, isModuleEnabled } = useModules();

  // Debounce la recherche
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Déterminer le groupe actif basé sur l'URL
  const activeModule = useMemo(() => {
    const currentPath = location.pathname;
    return availableModules.find(module => 
      currentPath === module.route || currentPath.startsWith(module.route + '/')
    );
  }, [location.pathname, availableModules]);

  // Garder le groupe actif ouvert
  useEffect(() => {
    if (activeModule) {
      const group = moduleGroups.find(g => g.modules.includes(activeModule.id));
      if (group && !openGroups.includes(group.title)) {
        setOpenGroups(prev => [...prev, group.title]);
      }
    }
  }, [activeModule, openGroups]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

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

  const getBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-500 hover:bg-purple-600 text-white';
      case 'ultra_pro': return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-card/50 backdrop-blur-md">
      <SidebarHeader className="border-b bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-md">
        <div className="px-2 py-4">
          <ShopoptiLogo />
        </div>
        
        {state !== "collapsed" && (
          <div className="px-2 pb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background/50 border-border/50"
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
                  <SidebarGroupLabel className="group/label w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer">
                    <div className="flex items-center justify-between w-full">
                      {state !== "collapsed" && (
                        <>
                          <span className="text-xs font-semibold">{group.title}</span>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            openGroups.includes(group.title) && "rotate-180"
                          )} />
                        </>
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupModules.map((module) => {
                        const Icon = iconMap[module.icon] || Settings;
                        const active = isActive(module.route);
                        const accessible = canAccess(module.id);

                        return (
                          <SidebarMenuItem key={module.id}>
                            <SidebarMenuButton
                              onClick={() => handleNavigate(module.route, module.id)}
                              className={cn(
                                "w-full justify-start transition-all duration-200",
                                active 
                                  ? "bg-primary text-primary-foreground shadow-md" 
                                  : "hover:bg-accent hover:text-accent-foreground",
                                !accessible && "opacity-50 cursor-not-allowed"
                              )}
                              disabled={!accessible}
                            >
                              <Icon className="h-4 w-4" />
                              {state !== "collapsed" && (
                                <div className="flex items-center justify-between w-full">
                                  <span className="truncate">{module.name}</span>
                                  {module.minPlan !== 'standard' && (
                                    <Badge 
                                      variant="secondary"
                                      className={cn(
                                        "text-xs h-5 px-2 font-medium",
                                        getBadgeVariant(module.minPlan)
                                      )}
                                    >
                                      {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                                    </Badge>
                                  )}
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
    </Sidebar>
  );
}
