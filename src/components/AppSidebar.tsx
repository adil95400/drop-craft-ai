import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useFavorites } from "@/stores/favoritesStore";
import { 
  Search, Bot, ShoppingCart, BarChart3, 
  Truck, Upload, Trophy, TrendingUp, Zap, 
  Users, Brain, Shield, Plug, Settings,
  ChevronDown, Package, Sparkles, Crown, Calculator,
  Megaphone, FileText, Globe, Store, Puzzle, GitCompare,
  Database, ShoppingBag, GraduationCap, HelpCircle, 
  Activity, Building2, Building, Star,
  LayoutDashboard, Link, Layers, LineChart,
  FileSpreadsheet, Code, Clock, History,
  Download, Key, UserPlus, Mail,
  Phone, Calendar, MessageSquare, Type,
  DollarSign, Heart, BookOpen
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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
import { getAccessibleSubModules } from "@/config/sub-modules";
import { FavoriteButton } from "@/components/navigation/FavoriteButton";

// Logo mémoïsé pour éviter les re-renders inutiles
const ShopoptiLogo = memo(() => (
  <div className="flex items-center gap-3 px-2 group cursor-pointer">
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl rounded-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main logo container */}
      <div className="relative w-9 h-9 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/40 group-hover:scale-105">
        <ShoppingCart className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:rotate-12" />
        
        {/* Shine overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Animated border */}
        <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300" />
      </div>
    </div>
    
    <div className="flex flex-col">
      <span className="font-bold text-lg bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent transition-all duration-300 group-hover:from-primary/90 group-hover:via-primary group-hover:to-secondary/90 drop-shadow-sm">
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
  'GitCompare': GitCompare,
  'Database': Database,
  'ShoppingBag': ShoppingBag,
  'GraduationCap': GraduationCap,
  'HelpCircle': HelpCircle,
  'Activity': Activity,
  'Building2': Building2,
  'Building': Building,
  // Icônes pour sous-modules
  'LayoutDashboard': LayoutDashboard,
  'Link': Link,
  'Layers': Layers,
  'LineChart': LineChart,
  'FileSpreadsheet': FileSpreadsheet,
  'Code': Code,
  'Clock': Clock,
  'History': History,
  'Download': Download,
  'Key': Key,
  'UserPlus': UserPlus,
  'Mail': Mail,
  'Phone': Phone,
  'Calendar': Calendar,
  'MessageSquare': MessageSquare,
  'Type': Type,
  'DollarSign': DollarSign,
  'Heart': Heart,
  'BookOpen': BookOpen
};

// Regroupements logiques - TOUS les 32+ modules organisés par workflow business
const moduleGroups = [
  {
    title: "🏠 ESSENTIEL",
    description: "Vue d'ensemble et accès rapide",
    modules: ['dashboard']
  },
  {
    title: "🛍️ VENTES & COMMANDES",
    description: "Gestion des ventes et boutiques",
    modules: ['orders', 'stores', 'marketplaceHub', 'commerce']
  },
  {
    title: "📦 PRODUITS",
    description: "Catalogue et recherche de produits",
    modules: ['products', 'import', 'winners', 'productResearch', 'marketplace', 'importSources']
  },
  {
    title: "🚚 FOURNISSEURS",
    description: "Gestion des fournisseurs et stock",
    modules: ['suppliers', 'premiumSuppliers', 'premiumCatalog', 'network', 'supplierAdmin', 'inventoryPredictor']
  },
  {
    title: "✍️ CONTENU & SEO",
    description: "Optimisation et création de contenu",
    modules: ['bulkContent', 'seo']
  },
  {
    title: "👥 CLIENTS & CRM",
    description: "Relation client et intelligence",
    modules: ['customers', 'customerIntelligence', 'crm']
  },
  {
    title: "📊 ANALYTICS",
    description: "Analyse et performance",
    modules: ['analytics', 'competitiveComparison', 'profitCalculator']
  },
  {
    title: "⚡ AUTOMATION",
    description: "Automatisation et outils",
    modules: ['automation', 'autoFulfillment', 'adsManager', 'extension']
  },
  {
    title: "🤖 INTELLIGENCE ARTIFICIELLE",
    description: "IA et prédictions avancées",
    modules: ['ai']
  },
  {
    title: "🏢 ENTERPRISE",
    description: "Gestion multi-tenant et admin",
    modules: ['multiTenant', 'adminPanel']
  },
  {
    title: "🔌 INTÉGRATIONS",
    description: "API et connecteurs",
    modules: ['integrations']
  },
  {
    title: "🛡️ SÉCURITÉ & SYSTÈME",
    description: "Sécurité, monitoring et observabilité",
    modules: ['security', 'observability']
  },
  {
    title: "🎓 FORMATION & SUPPORT",
    description: "Apprendre et obtenir de l'aide",
    modules: ['academy', 'support']
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
  
  // Utiliser le système de modules et favoris
  const modulesData = useModules();
  const { availableModules, canAccess, isModuleEnabled } = modulesData;
  const currentPlan = modulesData.currentPlan;
  const isAdminBypass = modulesData.isAdminBypass || false;
  const { favorites, isFavorite } = useFavorites();

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
      const subModules = getAccessibleSubModules(activeModule.id, currentPlan);
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
      case 'pro': 
        return 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40';
      case 'ultra_pro': 
        return 'bg-gradient-to-r from-yellow-500 via-orange-500 to-orange-600 hover:from-yellow-600 hover:via-orange-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/40 hover:shadow-xl hover:shadow-orange-500/50';
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
              
              {/* Theme Toggle */}
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
              {/* Theme Toggle collapsed */}
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
                  <span className="text-xs font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">FAVORIS</span>
                  <Badge variant="secondary" className="text-xs ml-auto bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
                    {favorites.length}
                  </Badge>
                </>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favorites.slice(0, 5).map((fav) => {
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
                            : "hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md hover:scale-[1.01] backdrop-blur-sm",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                        )}
                        isActive={active}
                      >
                        <Icon className={cn("h-4 w-4 transition-transform duration-300", active && "scale-110 drop-shadow-lg")} />
                        {state !== "collapsed" && (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="truncate text-sm font-medium">{module.name}</span>
                            <FavoriteButton moduleId={module.id} size="icon" className="h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity" />
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

        {/* Groupes de modules */}
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
                  <SidebarGroupLabel className="group/label w-full hover:bg-gradient-to-r hover:from-accent/80 hover:to-accent/40 hover:text-accent-foreground rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md hover:shadow-primary/5 backdrop-blur-sm border border-transparent hover:border-border/30">
                    <div className="flex items-center justify-between w-full px-1">
                      {state !== "collapsed" && (
                        <>
                          <span className="text-xs font-bold tracking-wide transition-all duration-200 group-hover/label:text-primary">{group.title}</span>
                          <div className="relative">
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-all duration-300 group-hover/label:text-primary group-hover/label:scale-110",
                              openGroups.includes(group.title) && "rotate-180"
                            )} />
                            <div className="absolute inset-0 blur-sm opacity-0 group-hover/label:opacity-50 transition-opacity">
                              <ChevronDown className="h-4 w-4 text-primary" />
                            </div>
                          </div>
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
                        const subModules = getAccessibleSubModules(module.id, currentPlan);
                        const hasSubItems = subModules.length > 0;
                        const subMenuOpen = openSubMenus[module.id] || false;

                          return (
                            <SidebarMenuItem key={module.id} className="animate-fade-in">
                              {!hasSubItems ? (
                                <SidebarMenuButton
                                  onClick={() => handleNavigate(module.route, module.id)}
                                  tooltip={state === "collapsed" ? module.name : undefined}
                                  className={cn(
                                    "w-full justify-start transition-all duration-300 group relative overflow-hidden rounded-lg",
                                    active 
                                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] border border-primary/20" 
                                      : "hover:bg-gradient-to-r hover:from-accent/80 hover:to-accent/40 hover:text-accent-foreground hover:shadow-md hover:scale-[1.01] backdrop-blur-sm border border-transparent hover:border-border/30",
                                    !accessible && "opacity-50 cursor-not-allowed hover:scale-100",
                                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                                  )}
                                  disabled={!accessible}
                                isActive={active}
                              >
                                              <Icon className={cn(
                                                "h-4 w-4 transition-all duration-300",
                                                active && "scale-110 drop-shadow-lg"
                                              )} />
                                               {state !== "collapsed" && (
                                                <div className="flex items-center justify-between w-full gap-2">
                                                  <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5 font-medium">
                                                    {module.name}
                                                  </span>
                                                  <div className="flex items-center gap-1.5">
                                                    <FavoriteButton moduleId={module.id} size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    {module.minPlan !== 'standard' && (
                                                      <Badge 
                                                        variant="secondary"
                                                        className={cn(
                                                          "text-xs h-5 px-2 font-bold transition-all duration-200 group-hover:scale-105 shadow-sm",
                                                          getBadgeVariant(module.minPlan)
                                                        )}
                                                      >
                                                        {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                              </SidebarMenuButton>
                            ) : (
                                <Collapsible open={subMenuOpen} onOpenChange={() => toggleSubMenu(module.id)}>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                      tooltip={state === "collapsed" ? module.name : undefined}
                                      className={cn(
                                        "w-full justify-start transition-all duration-300 group relative overflow-hidden rounded-lg",
                                        active 
                                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] border border-primary/20" 
                                          : "hover:bg-gradient-to-r hover:from-accent/80 hover:to-accent/40 hover:text-accent-foreground hover:shadow-md hover:scale-[1.01] backdrop-blur-sm border border-transparent hover:border-border/30",
                                        !accessible && "opacity-50 cursor-not-allowed hover:scale-100",
                                        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                                      )}
                                      disabled={!accessible}
                                      isActive={active}
                                    >
                                      <Icon className={cn(
                                        "h-4 w-4 transition-all duration-300",
                                        active && "scale-110 drop-shadow-lg"
                                      )} />
                                      {state !== "collapsed" && (
                                        <div className="flex items-center justify-between w-full gap-2">
                                          <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5 font-medium">
                                            {module.name}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <FavoriteButton moduleId={module.id} size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {module.minPlan !== 'standard' && (
                                              <Badge 
                                                variant="secondary"
                                                className={cn(
                                                  "text-xs h-5 px-2 font-bold transition-all duration-200 group-hover:scale-105",
                                                  getBadgeVariant(module.minPlan)
                                                )}
                                              >
                                                {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                                              </Badge>
                                            )}
                                            <ChevronDown className={cn(
                                              "h-4 w-4 transition-all duration-300 text-muted-foreground",
                                              subMenuOpen && "rotate-180 text-primary scale-110"
                                            )} />
                                          </div>
                                        </div>
                                      )}
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  
                                  {state !== "collapsed" && (
                                    <CollapsibleContent className="overflow-hidden transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                      <div className="ml-6 mt-1.5 space-y-1 border-l-2 border-gradient-to-b from-primary/40 via-primary/20 to-transparent pl-3 py-1.5 bg-gradient-to-r from-muted/20 to-transparent rounded-r-lg">
                                        {subModules.map((subModule, idx) => {
                                          const SubIcon = iconMap[subModule.icon] || Settings;
                                          const subActive = isActive(subModule.route);
                                          
                                          return (
                                            <div 
                                              key={subModule.id}
                                              className="animate-fade-in"
                                              style={{ animationDelay: `${idx * 30}ms` }}
                                            >
                                              <SidebarMenuButton
                                                onClick={() => handleNavigate(subModule.route, module.id)}
                                                className={cn(
                                                  "w-full justify-start text-sm transition-all duration-300 group/sub relative rounded-lg overflow-hidden",
                                                  subActive 
                                                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold border border-primary/30 shadow-sm shadow-primary/20" 
                                                    : "hover:bg-gradient-to-r hover:from-accent/60 hover:to-accent/30 hover:border hover:border-border/30 hover:translate-x-1 hover:shadow-sm",
                                                  "pl-2.5"
                                                )}
                                                isActive={subActive}
                                              >
                                                <SubIcon className={cn(
                                                  "h-3.5 w-3.5 transition-all duration-300",
                                                  subActive && "text-primary scale-110 drop-shadow-sm"
                                                )} />
                                                <span className="truncate">{subModule.name}</span>
                                                {subActive && (
                                                  <div className="ml-auto flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/50" />
                                                  </div>
                                                )}
                                            </SidebarMenuButton>
                                          </div>
                                        );
                                      })}
                                    </div>
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
      
      {/* Rail pour rouvrir la sidebar en mode collapsed avec animation et effets visuels */}
      <SidebarRail className="transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:shadow-md hover:shadow-primary/20 backdrop-blur-sm" />
    </Sidebar>
  );
}
