import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { 
  ChevronDown, Search, Bot, Sparkles, ShoppingCart, Package, BarChart3, Users, 
  ShieldCheck, Zap, Settings, HelpCircle, Store, Smartphone, Download, Code,
  TrendingUp, DollarSign, Truck, RotateCcw, MessageSquare, Star, Target,
  Mail, Share2, Calculator, Tag, Warehouse, Globe, CreditCard, FileText,
  PieChart, Activity, Bell, Clock, Database, Boxes, ShoppingBag, Megaphone,
  Link2, Upload, Eye, BookOpen, Calendar, GitBranch, Building2, Crown,
  UserCircle, Lightbulb, Palette, TestTube, Workflow, Cog, LineChart,
  Gauge, Puzzle, Link, Shield, Building, History, Brain, RefreshCcw,
  MessageCircle
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  premium?: boolean;
  subItems?: NavigationItem[];
}

interface NavigationGroup {
  title: string;
  icon: React.ComponentType<any>;
  items: NavigationItem[];
}

// Logo Shopopti
const ShopoptiLogo = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
      <ShoppingCart className="w-5 h-5 text-white" />
    </div>
    <div className="flex flex-col">
      <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        DropCraft AI
      </span>
      <span className="text-xs text-muted-foreground -mt-1">Pro Platform</span>
    </div>
  </div>
);

const navigationGroups: NavigationGroup[] = [
  // ============= 📊 TABLEAU DE BORD =============
  {
    title: "📊 TABLEAU DE BORD",
    icon: BarChart3,
    items: [
      { title: "Dashboard Principal", url: "/dashboard", icon: BarChart3 },
      { title: "Super Dashboard", url: "/dashboard-super", icon: Crown, badge: "PRO", premium: true },
      { title: "Analytics", url: "/analytics", icon: TrendingUp }
    ]
  },
  
  // ============= 🛒 E-COMMERCE =============
  {
    title: "🛒 E-COMMERCE",
    icon: ShoppingBag,
    items: [
      { title: "Boutiques", url: "/stores", icon: Store },
      { title: "Produits", url: "/products", icon: Package },
      { title: "Commandes", url: "/orders", icon: ShoppingCart },
      { title: "Catalogue", url: "/catalog", icon: BookOpen },
      { title: "Marketplace", url: "/marketplace", icon: Store }
    ]
  },
  
  // ============= 🎯 SOURCING & IMPORT =============
  {
    title: "🎯 SOURCING & IMPORT",
    icon: Target,
    items: [
      { title: "Product Finder AI", url: "/product-finder", icon: Search, badge: "AI", premium: true },
      { title: "Product Sourcing", url: "/product-sourcing", icon: Target },
      { 
        title: "Import", 
        url: "/import", 
        icon: Upload,
        subItems: [
          { title: "Import Management", url: "/import", icon: Upload },
          { title: "CSV Import", url: "/import/csv", icon: FileText },
          { title: "API Import", url: "/import/api", icon: Code },
          { title: "Web Scraping", url: "/import/scraping", icon: Globe },
          { title: "AI Import", url: "/import/ai", icon: Brain, badge: "AI", premium: true },
          { title: "Import History", url: "/import/history", icon: History }
        ]
      },
      { title: "Import Sources", url: "/import/sources", icon: Database }
    ]
  },
  
  // ============= 📦 LOGISTIQUE & STOCK =============
  {
    title: "📦 LOGISTIQUE & STOCK",
    icon: Warehouse,
    items: [
      { title: "Inventory Management", url: "/inventory-management", icon: Package },
      { title: "Warehouse Management", url: "/warehouse-management", icon: Warehouse, badge: "PRO", premium: true },
      { title: "Shipping Manager", url: "/shipping-manager", icon: Truck },
      { title: "Returns Management", url: "/returns-management", icon: RefreshCcw },
      { title: "Auto Orders", url: "/auto-order", icon: Zap, badge: "AUTO", premium: true },
      { title: "Suppliers", url: "/suppliers", icon: Building2 }
    ]
  },
  
  // ============= 📢 MARKETING & VENTES =============
  {
    title: "📢 MARKETING & VENTES",
    icon: Megaphone,
    items: [
      { title: "Marketing Hub", url: "/marketing", icon: Megaphone },
      { title: "Email Marketing", url: "/email-marketing", icon: Mail },
      { title: "Pixel Tracking", url: "/pixel-tracking", icon: Eye },
      { title: "Upsell Manager", url: "/upsell-manager", icon: TrendingUp },
      { title: "Affiliate Program", url: "/affiliate-program", icon: Users },
      { title: "Ads Automation", url: "/ads-automation", icon: Zap, badge: "ADS", premium: true },
      { title: "A/B Testing", url: "/ab-testing", icon: TestTube, badge: "A/B", premium: true },
      { title: "Blog", url: "/blog", icon: FileText }
    ]
  },
  
  // ============= 👥 CLIENTS & SUPPORT =============
  {
    title: "👥 CLIENTS & SUPPORT",
    icon: Users,
    items: [
      { title: "Clients", url: "/customers", icon: Users },
      { title: "CRM", url: "/crm", icon: UserCircle },
      { title: "Live Chat", url: "/live-chat", icon: MessageSquare, badge: "CHAT", premium: true },
      { title: "Reviews Manager", url: "/reviews-manager", icon: Star },
      { title: "CRM Calendar", url: "/crm/calendar", icon: Calendar }
    ]
  },
  
  // ============= 💰 PRICING & FINANCE =============
  {
    title: "💰 PRICING & FINANCE",
    icon: DollarSign,
    items: [
      { title: "Profit Calculator", url: "/profit-calculator", icon: Calculator },
      { title: "Dynamic Pricing", url: "/dynamic-pricing", icon: TrendingUp, badge: "DYNAMIC", premium: true },
      { title: "Finance", url: "/finance", icon: DollarSign },
      { title: "Pricing Page", url: "/pricing-page", icon: CreditCard }
    ]
  },
  
  // ============= ⚡ AUTOMATISATION =============
  {
    title: "⚡ AUTOMATISATION",
    icon: Workflow,
    items: [
      { title: "Automation", url: "/automation", icon: Workflow },
      { title: "Automation Studio", url: "/automation-studio", icon: Cog, badge: "STUDIO", premium: true },
      { title: "AI Automation", url: "/ai-automation", icon: Brain, badge: "AI AUTO", premium: true },
      { title: "Workflow Automation", url: "/automation-optimization", icon: GitBranch, badge: "FLOW", premium: true }
    ]
  },
  
  // ============= 🤖 INTELLIGENCE & IA =============
  {
    title: "🤖 INTELLIGENCE & IA",
    icon: Brain,
    items: [
      { title: "AI Assistant", url: "/ai-assistant", icon: Brain, badge: "AI", premium: true },
      { title: "AI Studio", url: "/ai-studio", icon: Sparkles, badge: "STUDIO", premium: true },
      { title: "Business Intelligence", url: "/business-intelligence", icon: LineChart, badge: "BI", premium: true },
      { title: "Product Intelligence", url: "/product-intelligence", icon: Lightbulb, badge: "INTEL", premium: true },
      { title: "Creative Studio", url: "/creative-studio", icon: Palette, badge: "CREATIVE", premium: true }
    ]
  },
  
  // ============= 📈 ANALYTICS & MONITORING =============
  {
    title: "📈 ANALYTICS & MONITORING",
    icon: Activity,
    items: [
      { title: "Analytics Studio", url: "/analytics-studio", icon: PieChart, badge: "STUDIO", premium: true },
      { title: "Monitoring", url: "/monitoring", icon: Activity },
      { title: "Observability", url: "/observability", icon: Eye, badge: "OBSERVE", premium: true },
      { title: "Advanced Analytics", url: "/advanced-analytics-enterprise", icon: BarChart3, badge: "ADVANCED", premium: true }
    ]
  },
  
  // ============= 🌐 MULTI-STORE & ENTERPRISE =============
  {
    title: "🌐 MULTI-STORE & ENTERPRISE",
    icon: Building,
    items: [
      { title: "Multi-Store Manager", url: "/multi-store", icon: Store, badge: "MULTI", premium: true },
      { title: "Multi-Tenant", url: "/multi-tenant", icon: Building, badge: "TENANT", premium: true },
      { title: "White Label", url: "/white-label", icon: Tag, badge: "LABEL", premium: true },
      { title: "Enterprise API", url: "/enterprise-api", icon: Code, badge: "API", premium: true }
    ]
  },
  
  // ============= 🔗 INTÉGRATIONS =============
  {
    title: "🔗 INTÉGRATIONS",
    icon: Link2,
    items: [
      { title: "Intégrations Hub", url: "/integrations", icon: Link2 },
      { title: "Marketplace Connector", url: "/marketplace-connector", icon: Link },
      { title: "Extensions", url: "/extensions", icon: Puzzle },
      { title: "API Developer", url: "/api-developer", icon: Code, badge: "API", premium: true },
      { title: "API Documentation", url: "/api-docs", icon: BookOpen }
    ]
  },
  
  // ============= 🛡️ ADMINISTRATION =============
  {
    title: "🛡️ ADMINISTRATION",
    icon: Shield,
    items: [
      { title: "Admin Panel", url: "/admin", icon: Settings },
      { title: "Security", url: "/security", icon: Shield },
      { title: "Quota Manager", url: "/quota-manager", icon: Gauge },
      { title: "Team Collaboration", url: "/team-collaboration", icon: Users },
      { title: "Multi-Tenant Management", url: "/multi-tenant-management", icon: Building, badge: "TENANT", premium: true },
      { title: "Performance Monitoring", url: "/performance-monitoring", icon: Activity, badge: "PERF", premium: true }
    ]
  },
  
  // ============= 📱 MOBILE & PWA =============
  {
    title: "📱 MOBILE & PWA",
    icon: Smartphone,
    items: [
      { title: "PWA Install", url: "/pwa-install", icon: Smartphone },
      { title: "Flutter App", url: "/flutter-mobile", icon: Smartphone },
      { title: "Mobile Dashboard", url: "/mobile-dashboard", icon: Smartphone, badge: "MOBILE", premium: true }
    ]
  },
  
  // ============= ❓ SUPPORT & AIDE =============
  {
    title: "❓ SUPPORT & AIDE",
    icon: HelpCircle,
    items: [
      { title: "Support", url: "/support", icon: HelpCircle },
      { title: "Help Center", url: "/help-center", icon: BookOpen },
      { title: "QA", url: "/qa", icon: MessageCircle },
      { title: "App Status", url: "/application-status", icon: Activity }
    ]
  },
  
  // ============= ⚙️ CONFIGURATION =============
  {
    title: "⚙️ CONFIGURATION",
    icon: Settings,
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Profile", url: "/profile", icon: UserCircle },
      { title: "Subscription", url: "/subscription", icon: Crown }
    ]
  }
];

// Composants mémoïsés pour optimiser les performances
const SidebarItem = memo(({ 
  item, 
  isActive, 
  onClick, 
  state 
}: { 
  item: NavigationItem; 
  isActive: boolean; 
  onClick: () => void; 
  state: string;
}) => (
  <SidebarMenuButton
    onClick={onClick}
    className={cn(
      "w-full justify-start transition-all duration-200",
      isActive 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <item.icon className={cn(
      "h-4 w-4", 
      item.premium ? "text-yellow-500" : ""
    )} />
    {state !== "collapsed" && (
      <div className="flex items-center justify-between w-full">
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <Badge 
            variant="secondary"
            className={cn(
              "text-xs h-5 px-2 font-medium",
              item.badge === "PRO" && "bg-purple-500 text-white hover:bg-purple-600",
              item.badge === "AI" && "bg-blue-500 text-white hover:bg-blue-600",
              item.badge === "AUTO" && "bg-orange-500 text-white hover:bg-orange-600",
              item.badge === "ADS" && "bg-red-500 text-white hover:bg-red-600",
              item.badge === "A/B" && "bg-indigo-500 text-white hover:bg-indigo-600",
              item.badge === "CHAT" && "bg-green-500 text-white hover:bg-green-600",
              item.badge === "DYNAMIC" && "bg-yellow-500 text-white hover:bg-yellow-600",
              item.badge === "STUDIO" && "bg-pink-500 text-white hover:bg-pink-600",
              item.badge === "AI AUTO" && "bg-cyan-500 text-white hover:bg-cyan-600",
              item.badge === "FLOW" && "bg-violet-500 text-white hover:bg-violet-600",
              item.badge === "BI" && "bg-blue-600 text-white hover:bg-blue-700",
              item.badge === "INTEL" && "bg-teal-500 text-white hover:bg-teal-600",
              item.badge === "CREATIVE" && "bg-fuchsia-500 text-white hover:bg-fuchsia-600",
              item.badge === "OBSERVE" && "bg-amber-500 text-white hover:bg-amber-600",
              item.badge === "ADVANCED" && "bg-slate-600 text-white hover:bg-slate-700",
              item.badge === "MULTI" && "bg-emerald-500 text-white hover:bg-emerald-600",
              item.badge === "TENANT" && "bg-lime-500 text-white hover:bg-lime-600",
              item.badge === "LABEL" && "bg-rose-500 text-white hover:bg-rose-600",
              item.badge === "API" && "bg-sky-500 text-white hover:bg-sky-600",
              item.badge === "MOBILE" && "bg-purple-600 text-white hover:bg-purple-700"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </div>
    )}
  </SidebarMenuButton>
));

SidebarItem.displayName = 'SidebarItem';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Debounce la recherche pour éviter les re-renders excessifs
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Déterminer le groupe actif basé sur l'URL
  const activeGroup = useMemo(() => {
    const currentPath = location.pathname;
    return navigationGroups.find(group => 
      group.items.some(item => 
        currentPath === item.url || 
        currentPath.startsWith(item.url + '/') ||
        item.subItems?.some(sub => currentPath === sub.url || currentPath.startsWith(sub.url + '/'))
      )
    )?.title || null;
  }, [location.pathname]);

  // Garder le groupe actif ouvert
  useEffect(() => {
    if (activeGroup && !openGroups.includes(activeGroup)) {
      setOpenGroups(prev => [...prev, activeGroup]);
    }
  }, [activeGroup, openGroups]);

  // Mémoïser la fonction isActive
  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Mémoïser toggleGroup
  const toggleGroup = useCallback((groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  }, []);

  // Mémoïser handleNavigate
  const handleNavigate = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  // Filtrer les éléments de navigation basé sur la recherche (debounced)
  const filteredGroups = useMemo(() => {
    if (!debouncedSearchQuery) return navigationGroups;
    
    const query = debouncedSearchQuery.toLowerCase();
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.badge && item.badge.toLowerCase().includes(query)) ||
        item.subItems?.some(sub => 
          sub.title.toLowerCase().includes(query)
        )
      )
    })).filter(group => group.items.length > 0);
  }, [debouncedSearchQuery]);

  return (
    <Sidebar className="border-r bg-card/50 backdrop-blur-md">
      <SidebarHeader className="border-b bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-md">
        <div className="px-2 py-4">
          <ShopoptiLogo />
        </div>
        
        {state !== "collapsed" && (
          <div className="px-2 pb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background/50 border-border/50"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.includes(group.title)}
            onOpenChange={() => toggleGroup(group.title)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="group/label w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    {state !== "collapsed" && (
                      <>
                        <span className="flex-1 text-left">{group.title}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/label:rotate-180" />
                      </>
                    )}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarItem
                          item={item}
                          isActive={isActive(item.url)}
                          onClick={() => handleNavigate(item.url)}
                          state={state}
                        />
                        
                        {/* Sub-items */}
                        {item.subItems && state !== "collapsed" && (
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  onClick={() => handleNavigate(subItem.url)}
                                  className={cn(
                                    "transition-all duration-200",
                                    isActive(subItem.url) 
                                      ? "bg-primary/10 text-primary font-medium" 
                                      : "hover:bg-accent/50"
                                  )}
                                >
                                  <subItem.icon className={cn(
                                    "h-3 w-3", 
                                    subItem.premium ? "text-yellow-500" : ""
                                  )} />
                                  <span className="truncate">{subItem.title}</span>
                                   {subItem.badge && (
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        "text-xs h-4 px-1.5 font-medium",
                                        subItem.badge === "PRO" && "border-purple-500 text-purple-600",
                                        subItem.badge === "AI" && "border-blue-500 text-blue-600",
                                        subItem.badge === "AUTO" && "border-orange-500 text-orange-600",
                                        subItem.badge === "ADS" && "border-red-500 text-red-600",
                                        subItem.badge === "A/B" && "border-indigo-500 text-indigo-600",
                                        subItem.badge === "CHAT" && "border-green-500 text-green-600",
                                        subItem.badge === "DYNAMIC" && "border-yellow-500 text-yellow-600",
                                        subItem.badge === "STUDIO" && "border-pink-500 text-pink-600",
                                        subItem.badge === "AI AUTO" && "border-cyan-500 text-cyan-600",
                                        subItem.badge === "FLOW" && "border-violet-500 text-violet-600",
                                        subItem.badge === "BI" && "border-blue-600 text-blue-700",
                                        subItem.badge === "INTEL" && "border-teal-500 text-teal-600",
                                        subItem.badge === "CREATIVE" && "border-fuchsia-500 text-fuchsia-600",
                                        subItem.badge === "OBSERVE" && "border-amber-500 text-amber-600",
                                        subItem.badge === "ADVANCED" && "border-slate-600 text-slate-700",
                                        subItem.badge === "MULTI" && "border-emerald-500 text-emerald-600",
                                        subItem.badge === "TENANT" && "border-lime-500 text-lime-600",
                                        subItem.badge === "LABEL" && "border-rose-500 text-rose-600",
                                        subItem.badge === "API" && "border-sky-500 text-sky-600",
                                        subItem.badge === "MOBILE" && "border-purple-600 text-purple-700"
                                      )}
                                    >
                                      {subItem.badge}
                                    </Badge>
                                   )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
