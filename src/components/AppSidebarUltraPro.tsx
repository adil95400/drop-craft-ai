import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, Package, Users, BarChart3, Settings, ShoppingCart, Truck, Star, 
  Search, Target, Smartphone, Puzzle, Zap, Shield, HelpCircle,
  FileText, MessageSquare, Database, Bell, Globe, ChevronDown, 
  Command, User, Crown, TrendingUp, Activity, Filter, X, Menu,
  Bot, Sparkles, PlusCircle, AlertCircle, CheckCircle2, Clock,
  ArrowRight, Bookmark, Heart, Download, Upload, Link2, Eye,
  MoreHorizontal, LogOut, UserCircle, Palette, Sun, Moon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Enhanced navigation structure with real-time badges and status
const navigationItems = [
  {
    title: "Tableaux de Bord",
    icon: Home,
    badge: "Pro",
    badgeVariant: "default" as const,
    items: [
      { 
        title: "Dashboard Principal", 
        url: "/dashboard", 
        icon: Home, 
        badge: "Live", 
        badgeVariant: "default",
        description: "Vue d'ensemble temps réel",
        status: "active"
      },
      { 
        title: "Analytics Ultra", 
        url: "/analytics-ultra-pro", 
        icon: BarChart3, 
        badge: "AI", 
        badgeVariant: "secondary",
        description: "IA prédictive avancée",
        status: "new"
      },
    ],
  },
  {
    title: "E-commerce",
    icon: ShoppingCart,
    badge: "847",
    badgeVariant: "secondary" as const,
    items: [
      { 
        title: "Catalogue Ultra Pro", 
        url: "/catalogue-ultra-pro", 
        icon: Package, 
        badge: "847", 
        description: "Gestion avancée produits",
        status: "active"
      },
      { 
        title: "Commandes", 
        url: "/orders-ultra-pro", 
        icon: ShoppingCart, 
        badge: "24", 
        badgeVariant: "destructive", 
        description: "Suivi commandes temps réel",
        status: "urgent"
      },
      { 
        title: "Inventaire Pro", 
        url: "/inventory-ultra-pro", 
        icon: Database, 
        badge: "Sync", 
        badgeVariant: "default",
        description: "Stock automatisé",
        status: "active"
      },
      { 
        title: "Stock Ultra", 
        url: "/stock-ultra-pro", 
        icon: Package, 
        badge: "Low", 
        badgeVariant: "outline", 
        description: "Alertes intelligentes",
        status: "warning"
      },
      { 
        title: "Fournisseurs Pro", 
        url: "/suppliers-ultra-pro", 
        icon: Users, 
        badge: "API", 
        badgeVariant: "secondary",
        description: "Intégrations automatiques",
        status: "active"
      },
    ],
  },
  {
    title: "CRM & Marketing Ultra", 
    icon: Users,
    badge: "Hot",
    badgeVariant: "destructive" as const,
    items: [
      { 
        title: "CRM Ultra Pro", 
        url: "/crm-ultra-pro", 
        icon: Users, 
        badge: "156", 
        description: "CRM intelligent IA",
        status: "active"
      },
      { 
        title: "Prospects Ultra Pro", 
        url: "/crm-prospects-ultra-pro", 
        icon: Target, 
        badge: "AI", 
        badgeVariant: "secondary", 
        description: "Prospection automatisée",
        status: "new"
      },
      { 
        title: "Marketing Ultra", 
        url: "/marketing-ultra-pro", 
        icon: Target, 
        badge: "Auto", 
        badgeVariant: "default", 
        description: "Campagnes intelligentes",
        status: "active"
      },
      { 
        title: "Avis Positif Ultra Pro", 
        url: "/avis-positif-ultra-pro", 
        icon: Star, 
        badge: "4.8", 
        badgeVariant: "default", 
        description: "Gestion avis automatisée",
        status: "active"
      },
      { 
        title: "SEO Ultra Pro", 
        url: "/seo-ultra-pro", 
        icon: Search, 
        badge: "Boost", 
        badgeVariant: "secondary",
        description: "SEO IA optimisé",
        status: "active"
      },
      { 
        title: "Blog Ultra Pro", 
        url: "/blog-ultra-pro", 
        icon: FileText, 
        badge: "AI", 
        badgeVariant: "secondary",
        description: "Contenu généré par IA",
        status: "new"
      },
    ],
  },
  {
    title: "Automation Ultra",
    icon: Bot,
    badge: "AI",
    badgeVariant: "secondary" as const,
    items: [
      { 
        title: "Automation Ultra Pro", 
        url: "/automation-ultra-pro", 
        icon: Zap, 
        badge: "Live", 
        badgeVariant: "default", 
        description: "Workflows IA avancés",
        status: "active"
      },
      { 
        title: "Suivi en Transit Ultra", 
        url: "/suivi-en-transit-ultra-pro", 
        icon: Truck, 
        badge: "Real-time", 
        badgeVariant: "default",
        description: "Tracking intelligent",
        status: "active"
      },
      { 
        title: "Import Ultra Pro", 
        url: "/import-ultra-pro", 
        icon: Upload, 
        badge: "Bulk", 
        badgeVariant: "secondary",
        description: "Import massif intelligent",
        status: "active"
      },
    ],
  },
  {
    title: "Extensions & Mobile",
    icon: Smartphone,
    badge: "New",
    badgeVariant: "secondary" as const,
    items: [
      { 
        title: "Extension Ultra Pro", 
        url: "/extension-ultra-pro", 
        icon: Globe, 
        badge: "v2.0", 
        badgeVariant: "default",
        description: "Extension navigateur Pro",
        status: "new"
      },
      { 
        title: "Mobile Ultra Pro", 
        url: "/mobile-ultra-pro", 
        icon: Smartphone, 
        badge: "iOS/Android", 
        badgeVariant: "secondary",
        description: "Apps mobiles natives",
        status: "active"
      },
      { 
        title: "Plugins Ultra Pro", 
        url: "/plugins-ultra-pro", 
        icon: Puzzle, 
        badge: "Store", 
        badgeVariant: "outline",
        description: "Marketplace plugins",
        status: "active"
      },
    ],
  },
  {
    title: "Support & Sécurité",
    icon: Shield,
    badge: "24/7",
    badgeVariant: "default" as const,
    items: [
      { 
        title: "Support Ultra Pro", 
        url: "/support-ultra-pro", 
        icon: HelpCircle, 
        badge: "24/7", 
        badgeVariant: "default", 
        description: "Support prioritaire",
        status: "active"
      },
      { 
        title: "Sécurité Ultra Pro", 
        url: "/security-ultra-pro", 
        icon: Shield, 
        badge: "Max", 
        badgeVariant: "default", 
        description: "Sécurité renforcée",
        status: "active"
      },
      { 
        title: "Notifications", 
        url: "/notifications", 
        icon: Bell, 
        badge: "3", 
        badgeVariant: "destructive", 
        description: "Alertes intelligentes",
        status: "urgent"
      },
    ],
  },
];

// Quick actions with smart suggestions
const quickActions = [
  { 
    title: "IA Assistant", 
    icon: Bot, 
    action: () => window.location.href = "/ai-assistant",
    variant: "default" as const,
    shortcut: "Ctrl+I"
  },
  { 
    title: "Nouveau Produit", 
    icon: PlusCircle, 
    action: () => window.location.href = "/catalogue-ultra-pro?action=add",
    variant: "secondary" as const,
    shortcut: "Ctrl+N"
  },
  { 
    title: "Analytics Live", 
    icon: TrendingUp, 
    action: () => window.location.href = "/analytics-ultra-pro",
    variant: "outline" as const,
    shortcut: "Ctrl+A"
  },
  { 
    title: "Support Rapide", 
    icon: HelpCircle, 
    action: () => window.location.href = "/support-ultra-pro",
    variant: "outline" as const,
    shortcut: "Ctrl+?"
  },
];

// User status and activity
const userActivity = {
  status: "En ligne",
  lastActive: "Maintenant",
  completedTasks: 12,
  pendingTasks: 3,
  notifications: 5,
};

export function AppSidebarUltraPro() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state, open, setOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const collapsed = state === "collapsed";
  
  const [openGroups, setOpenGroups] = useState<string[]>(["E-commerce", "CRM & Marketing Ultra"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + '/');
  
  const toggleGroup = useCallback((title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  }, []);

  // Advanced search with AI suggestions
  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery) return navigationItems;
    
    const query = searchQuery.toLowerCase();
    return navigationItems.map(group => ({
      ...group,
      items: group.items?.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.badge?.toLowerCase().includes(query)
      )
    })).filter(group => 
      group.title.toLowerCase().includes(query) ||
      (group.items && group.items.length > 0)
    );
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k':
            e.preventDefault();
            document.querySelector<HTMLInputElement>('#sidebar-search')?.focus();
            break;
          case 'b':
            e.preventDefault();
            setOpen(!open);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [open, setOpen]);

  const clearSearch = () => setSearchQuery("");

  // Get status indicator
  const getStatusIndicator = (status?: string) => {
    switch(status) {
      case "urgent": return <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />;
      case "warning": return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case "new": return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />;
      case "active": return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      default: return null;
    }
  };

  // Enhanced sidebar item component
  const SidebarItem = ({ item, index, isSubItem = false }: any) => {
    if (!item.items) {
      const isItemActive = isActive(item.url);
      
      return (
        <SidebarMenuItem key={item.title}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url!} 
                    className={({ isActive }) => cn(
                      "group relative transition-all duration-300 hover:scale-[1.02]",
                      isActive 
                        ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary font-medium shadow-sm border-r-2 border-primary" 
                        : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <item.icon className={cn(
                          "h-4 w-4 transition-all duration-300",
                          isItemActive 
                            ? "text-primary drop-shadow-sm" 
                            : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        {getStatusIndicator(item.status)}
                      </div>
                      
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <Badge 
                                variant={item.badgeVariant || "secondary"} 
                                className="text-xs scale-90 transition-all duration-200 group-hover:scale-100"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {isItemActive && (
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {isItemActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-md animate-fade-in" />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </TooltipTrigger>
              
              {collapsed && (
                <TooltipContent side="right" className="font-medium max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "secondary"} className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </SidebarMenuItem>
      );
    }

    const isGroupOpen = openGroups.includes(item.title);
    const hasActiveChild = item.items.some((subItem: any) => isActive(subItem.url));

    return (
      <Collapsible key={item.title} open={isGroupOpen} onOpenChange={() => toggleGroup(item.title)}>
        <SidebarMenuItem>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={cn(
                    "group relative transition-all duration-300 hover:scale-[1.01]",
                    hasActiveChild 
                      ? "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary font-medium shadow-sm" 
                      : "hover:bg-gradient-to-r hover:from-muted/60 hover:to-transparent"
                  )}>
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <item.icon className={cn(
                          "h-4 w-4 transition-all duration-300",
                          hasActiveChild 
                            ? "text-primary drop-shadow-sm" 
                            : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      </div>
                      
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <Badge 
                                variant={item.badgeVariant || "secondary"} 
                                className="text-xs scale-90 transition-all duration-200 group-hover:scale-100"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronDown className={cn(
                              "h-3 w-3 transition-transform duration-300",
                              isGroupOpen ? "rotate-180" : "rotate-0"
                            )} />
                          </div>
                        </>
                      )}
                    </div>
                    
                    {hasActiveChild && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-md" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </TooltipTrigger>
              
              {collapsed && (
                <TooltipContent side="right" className="font-medium max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">{item.title}</p>
                    <div className="text-xs text-muted-foreground">
                      {item.items.length} éléments
                    </div>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "secondary"} className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <SidebarMenuSub className="ml-4 border-l border-border/50">
              {item.items.map((subItem: any, subIndex: number) => (
                <SidebarMenuSubItem key={subItem.title} className="pl-4">
                  <SidebarItem item={subItem} index={subIndex} isSubItem={true} />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <TooltipProvider>
      <Sidebar 
        className={cn(
          "border-r transition-all duration-500 shadow-xl bg-gradient-to-b from-background via-background to-muted/10",
          collapsed ? "w-16" : "w-80"
        )}
        collapsible="icon"
      >
        {/* Header avec logo et recherche */}
        <SidebarHeader className="border-b bg-gradient-to-r from-primary/5 via-background to-secondary/5 backdrop-blur-sm">
          <div className={cn("p-4 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/src/assets/shopopti-logo.png" 
                  alt="Shopopti Pro" 
                  className="w-8 h-8 transition-all duration-300 hover:scale-110 drop-shadow-md" 
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse ring-2 ring-background" />
              </div>
              
              {!collapsed && (
                <div className="transition-all duration-300 animate-fade-in">
                  <h2 className="font-bold text-lg bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Shopopti Pro
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Dropshipping Intelligent</p>
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      <Crown className="w-3 h-3 mr-1" />
                      Ultra Pro
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            {/* Advanced search bar */}
            {!collapsed && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200" />
                  <Input
                    id="sidebar-search"
                    type="text"
                    placeholder="Recherche intelligente... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={cn(
                      "pl-10 pr-10 h-9 bg-background/50 border-muted/50 transition-all duration-300",
                      "focus:border-primary/50 focus:bg-background focus:shadow-sm",
                      isSearchFocused && "ring-1 ring-primary/20"
                    )}
                  />
                  {searchQuery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Quick actions */}
                <div className="flex gap-1 flex-wrap">
                  {quickActions.map((action, index) => (
                    <TooltipProvider key={action.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={action.variant}
                            onClick={action.action}
                            className="h-8 px-2 text-xs bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 hover:scale-105"
                          >
                            <action.icon className="h-3.5 w-3.5 mr-1" />
                            <span className="sr-only lg:not-sr-only">{action.title.split(' ')[0]}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="text-xs font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground">{action.shortcut}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation content */}
        <SidebarContent className="overflow-y-auto custom-scrollbar">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-4">
              {searchQuery ? (
                <div className="flex items-center gap-2">
                  <Search className="h-3 w-3" />
                  <span>Résultats pour "{searchQuery}"</span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredNavigationItems.reduce((acc, item) => 
                      acc + (item.items ? item.items.length : 1), 0
                    )}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  <span>Navigation Ultra Pro</span>
                  <Badge variant="outline" className="text-xs animate-pulse">
                    Live
                  </Badge>
                </div>
              )}
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-2">
                {filteredNavigationItems.map((item, index) => (
                  <SidebarItem key={item.title} item={item} index={index} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>

            {/* Quick stats when no search */}
            {!searchQuery && !collapsed && (
              <div className="mt-6 px-4">
                <div className="bg-gradient-to-r from-primary/5 via-muted/50 to-secondary/5 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span>Statistiques Temps Réel</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Commandes</p>
                      <p className="font-bold text-primary">+12.5%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Revenus</p>
                      <p className="font-bold text-green-600">€2,847</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SidebarGroup>
        </SidebarContent>

        {/* Enhanced footer with user profile */}
        <SidebarFooter className="border-t bg-gradient-to-r from-muted/20 via-background to-muted/20 backdrop-blur-sm">
          <div className="p-4">
            {!collapsed ? (
              <div className="space-y-3">
                {/* User profile */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-bold">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">John Doe</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">{userActivity.status}</span>
                      </div>
                      <Badge variant="outline" className="text-xs px-1">
                        Pro
                      </Badge>
                    </div>
                  </div>
                  
                  {/* User menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem className="cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        {theme === "dark" ? (
                          <Sun className="mr-2 h-4 w-4" />
                        ) : (
                          <Moon className="mr-2 h-4 w-4" />
                        )}
                        <span>Thème</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Déconnexion</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* System status */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Système OK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Uptime: 99.9%</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Collapsed state */
              <div className="flex flex-col items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="w-8 h-8 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all duration-200">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-bold">
                          JD
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="space-y-1 text-center">
                        <p className="font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">Admin Pro</p>
                        <div className="flex items-center gap-1 justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-xs">{userActivity.status}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs">Système Opérationnel</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}