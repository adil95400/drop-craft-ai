import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, Package, Users, BarChart3, Settings, ShoppingCart, Truck, Star, 
  Search, Target, Smartphone, Puzzle, Zap, Shield, HelpCircle,
  FileText, MessageSquare, Database, Bell, Globe, ChevronDown, ChevronRight,
  Command, User, Crown, TrendingUp, Activity, Filter, X
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
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    badge: "Pro",
    badgeVariant: "default" as const,
  },
  {
    title: "E-commerce",
    icon: ShoppingCart,
    badge: "12",
    badgeVariant: "secondary" as const,
    items: [
      { title: "Catalogue", url: "/catalogue", icon: Package, badge: "847", description: "Gérer vos produits" },
      { title: "Commandes", url: "/orders", icon: ShoppingCart, badge: "24", badgeVariant: "destructive", description: "Suivre les commandes" },
      { title: "Inventaire", url: "/inventory", icon: Database, description: "Stock en temps réel" },
      { title: "Stock", url: "/stock", icon: Package, badge: "Low", badgeVariant: "outline", description: "Niveaux de stock" },
      { title: "Fournisseurs", url: "/suppliers", icon: Users, description: "Gérer les fournisseurs" },
    ],
  },
  {
    title: "CRM & Marketing", 
    icon: Users,
    badge: "Hot",
    badgeVariant: "destructive" as const,
    items: [
      { title: "CRM", url: "/crm", icon: Users, badge: "156", description: "Gestion clients" },
      { title: "Marketing", url: "/marketing", icon: Target, badge: "New", badgeVariant: "secondary", description: "Campagnes marketing" },
      { title: "Avis", url: "/reviews", icon: Star, badge: "4.8", badgeVariant: "default", description: "Avis clients" },
      { title: "Analytics", url: "/analytics", icon: BarChart3, badge: "↗", description: "Statistiques avancées" },
      { title: "SEO", url: "/seo", icon: Search, description: "Optimisation SEO" },
      { title: "Blog", url: "/blog", icon: FileText, description: "Content marketing" },
    ],
  },
  {
    title: "Outils",
    icon: Puzzle,
    items: [
      { title: "Suivi", url: "/tracking", icon: Truck, badge: "8", description: "Suivi des livraisons" },
      { title: "Automation", url: "/automation", icon: Zap, badge: "AI", badgeVariant: "secondary", description: "Workflows automatisés" },
      { title: "Import", url: "/import", icon: FileText, description: "Import de données" },
      { title: "Plugins", url: "/plugins", icon: Puzzle, badge: "12", description: "Extensions tierces" },
      { title: "Mobile", url: "/mobile", icon: Smartphone, description: "App mobile" },
      { title: "Extension", url: "/extension", icon: Globe, description: "Extension navigateur" },
    ],
  },
  {
    title: "Support",
    icon: HelpCircle,
    items: [
      { title: "Support", url: "/support", icon: HelpCircle, badge: "24/7", badgeVariant: "default", description: "Support client" },
      { title: "Sécurité", url: "/security", icon: Shield, badge: "OK", badgeVariant: "default", description: "Sécurité système" },
      { title: "FAQ", url: "/faq", icon: MessageSquare, description: "Questions fréquentes" },
      { title: "Notifications", url: "/notifications", icon: Bell, badge: "3", badgeVariant: "destructive", description: "Alertes système" },
      { title: "Paramètres", url: "/settings", icon: Settings, description: "Configuration" },
    ],
  },
];

const quickActions = [
  { title: "Nouveau produit", icon: Package, action: () => window.location.href = "/catalogue" },
  { title: "Voir commandes", icon: ShoppingCart, action: () => window.location.href = "/orders" },
  { title: "Analytics", icon: TrendingUp, action: () => window.location.href = "/analytics" },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  const [openGroups, setOpenGroups] = useState<string[]>(["E-commerce", "CRM & Marketing", "Outils", "Support"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + '/');
  
  const toggleGroup = useCallback((title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  }, []);

  // Filtrage intelligent des éléments de navigation
  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery) return navigationItems;
    
    return navigationItems.map(group => ({
      ...group,
      items: group.items?.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => 
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.items && group.items.length > 0) ||
      (!group.items && group.url)
    );
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Animation des éléments
  const getItemAnimation = (index: number) => ({
    style: {
      animationDelay: `${index * 50}ms`
    },
    className: "animate-fade-in"
  });

  const SidebarItem = ({ item, index, isSubItem = false }: any) => {
    if (!item.items) {
      return (
        <SidebarMenuItem key={item.title} {...(!isSubItem ? getItemAnimation(index) : {})}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url!} 
                    className={({ isActive }) => cn(
                      "group relative transition-all duration-200 hover:scale-[1.02]",
                      isActive ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium shadow-sm border-l-2 border-primary" : "hover:bg-muted/60"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant || "secondary"} 
                        className="ml-auto text-xs scale-90 transition-transform group-hover:scale-100"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/5 rounded-md animate-pulse" />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  <p>{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  )}
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
        <SidebarMenuItem {...getItemAnimation(index)}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={cn(
                    "group relative transition-all duration-200 hover:scale-[1.01]",
                    hasActiveChild ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-medium" : "hover:bg-muted/60"
                  )}>
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 transition-all duration-200",
                      hasActiveChild ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant || "secondary"} 
                        className="text-xs scale-90 transition-transform group-hover:scale-100"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown className={cn(
                      "ml-2 h-4 w-4 transition-transform duration-200",
                      isGroupOpen ? "rotate-180" : "rotate-0"
                    )} />
                    {hasActiveChild && (
                      <div className="absolute inset-0 bg-primary/5 rounded-md" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  <p>{item.title}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.items.length} éléments
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <SidebarMenuSub>
              {item.items.map((subItem: any, subIndex: number) => (
                <SidebarMenuSubItem key={subItem.title} {...getItemAnimation(subIndex)}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuSubButton asChild>
                          <NavLink 
                            to={subItem.url} 
                            className={({ isActive }) => cn(
                              "group relative transition-all duration-200 hover:scale-[1.02]",
                              isActive ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium shadow-sm border-l-2 border-primary ml-2" : "hover:bg-muted/60 ml-2"
                            )}
                          >
                            <subItem.icon className={cn(
                              "mr-3 h-4 w-4 transition-all duration-200",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="flex-1">{subItem.title}</span>
                            {subItem.badge && (
                              <Badge 
                                variant={subItem.badgeVariant || "secondary"} 
                                className="ml-auto text-xs scale-90 transition-transform group-hover:scale-100"
                              >
                                {subItem.badge}
                              </Badge>
                            )}
                            {isActive && (
                              <div className="absolute inset-0 bg-primary/5 rounded-md animate-pulse" />
                            )}
                          </NavLink>
                        </SidebarMenuSubButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-medium">
                          <p>{subItem.title}</p>
                          {subItem.description && (
                            <p className="text-xs text-muted-foreground mt-1">{subItem.description}</p>
                          )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
      <Sidebar className={cn(
        "border-r transition-all duration-300 shadow-lg bg-gradient-to-b from-background via-background to-muted/20",
        collapsed ? "w-16" : "w-72"
      )}>
        <SidebarHeader className="border-b bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <div className={cn("p-4 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/src/assets/shopopti-logo.png" 
                  alt="Shopopti Pro" 
                  className="w-8 h-8 transition-transform duration-200 hover:scale-110" 
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
              {!collapsed && (
                <div className="transition-all duration-300">
                  <h2 className="font-bold text-lg bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Shopopti Pro
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Dropshipping Intelligent</p>
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Ultra
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            {/* Barre de recherche intelligente */}
            {!collapsed && (
              <div className="mt-4 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-9 bg-background/50 border-muted/50 focus:border-primary/50 transition-all duration-200"
                  />
                  {searchQuery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Actions rapides */}
                <div className="mt-3 flex gap-1">
                  {quickActions.map((action, index) => (
                    <TooltipProvider key={action.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={action.action}
                            className="h-8 w-8 p-0 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                          >
                            <action.icon className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{action.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto custom-scrollbar">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
              {searchQuery ? `Résultats pour "${searchQuery}"` : "Navigation"}
              {searchQuery && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filteredNavigationItems.reduce((acc, item) => 
                    acc + (item.items ? item.items.length : 1), 0
                  )}
                </Badge>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredNavigationItems.map((item, index) => (
                  <SidebarItem key={item.title} item={item} index={index} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!searchQuery && !collapsed && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                Statistiques
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Revenus</span>
                    <span className="font-semibold text-green-600">+24%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Commandes</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Conversion</span>
                    <span className="font-semibold text-blue-600">4.8%</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t bg-gradient-to-r from-muted/20 to-background">
          <div className={cn("p-3 transition-all duration-300", collapsed ? "px-2" : "px-3")}>
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">Admin Pro</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 mx-auto">
                      <AvatarImage src="/api/placeholder/32/32" />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        JD
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">Admin Pro</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {!collapsed && (
              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Système OK</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>En ligne</span>
                </div>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}