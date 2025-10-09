import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronDown, Search, Bot, Sparkles, ShoppingCart, Package, BarChart3, Users, 
  ShieldCheck, Zap, Settings, HelpCircle, Store, Smartphone, Download, Code,
  TrendingUp, DollarSign, Truck, RotateCcw, MessageSquare, Star, Target,
  Mail, Share2, Calculator, Tag, Warehouse, Globe, CreditCard, FileText,
  PieChart, Activity, Bell, Clock, Database, Boxes, ShoppingBag, Megaphone,
  Link2, Upload, Eye, BookOpen, Calendar, GitBranch, Building2
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
  // ============= PRINCIPAL =============
  {
    title: "PRINCIPAL",
    icon: BarChart3,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
      { title: "Boutiques", url: "/stores", icon: Store },
      { 
        title: "Import", 
        url: "/import", 
        icon: Upload,
        subItems: [
          { title: "Import Management", url: "/import", icon: Database },
          { title: "CSV Import", url: "/import/csv", icon: FileText },
          { title: "API Import", url: "/import/api", icon: Code },
          { title: "Web Scraping", url: "/import/scraping", icon: Globe },
          { title: "Import History", url: "/import/history", icon: Clock },
          { title: "Import Sources", url: "/import-sources", icon: Database }
        ]
      }
    ]
  },
  
  // ============= CATALOGUE =============
  {
    title: "CATALOGUE",
    icon: Package,
    items: [
      { title: "Produits", url: "/products", icon: Package },
      { title: "Produits Ultra", url: "/products-ultra", icon: Sparkles, badge: "Ultra", premium: true },
      { title: "Catalogue", url: "/catalog", icon: BookOpen },
      { title: "Fournisseurs", url: "/suppliers", icon: Truck },
      { title: "Product Finder", url: "/product-finder", icon: Target, badge: "AI", premium: true },
      { title: "Product Sourcing", url: "/product-sourcing", icon: Search }
    ]
  },
  
  // ============= STOCK & LOGISTIQUE =============
  {
    title: "STOCK & LOGISTIQUE",
    icon: Warehouse,
    items: [
      { title: "Inventory", url: "/inventory-management", icon: Boxes },
      { title: "Warehouse", url: "/warehouse-management", icon: Warehouse, badge: "Ultra", premium: true },
      { title: "Shipping", url: "/shipping-manager", icon: Truck },
      { title: "Retours", url: "/returns-management", icon: RotateCcw },
      { title: "Auto-Orders", url: "/auto-order", icon: Zap, badge: "Ultra", premium: true }
    ]
  },
  
  // ============= COMMERCE =============
  {
    title: "COMMERCE",
    icon: ShoppingBag,
    items: [
      { title: "Commandes", url: "/orders", icon: ShoppingBag },
      { title: "Clients", url: "/customers", icon: Users },
      { title: "CRM", url: "/crm", icon: Users },
      { title: "Reviews", url: "/reviews-manager", icon: Star },
      { title: "Live Chat", url: "/live-chat", icon: MessageSquare, badge: "Ultra", premium: true }
    ]
  },
  
  // ============= ANALYTICS =============
  {
    title: "ANALYTICS",
    icon: Activity,
    items: [
      { title: "Analytics", url: "/analytics", icon: PieChart },
      { title: "Monitoring", url: "/monitoring", icon: Activity },
      { title: "Analytics Studio", url: "/analytics-studio", icon: BarChart3, badge: "Ultra", premium: true },
      { title: "Business Intelligence", url: "/business-intelligence", icon: TrendingUp, badge: "Ultra", premium: true },
      { title: "Observability", url: "/observability", icon: Eye, badge: "Ultra", premium: true },
      { title: "Super Dashboard", url: "/dashboard-super", icon: Sparkles, badge: "Pro", premium: true }
    ]
  },
  
  // ============= MARKETING =============
  {
    title: "MARKETING",
    icon: Megaphone,
    items: [
      { title: "Marketing Hub", url: "/marketing", icon: Megaphone },
      { title: "Email Marketing", url: "/email-marketing", icon: Mail },
      { title: "Blog", url: "/blog", icon: FileText },
      { title: "SEO", url: "/seo", icon: Search },
      { title: "Pixels", url: "/pixel-tracking", icon: Eye },
      { title: "Ads Automation", url: "/ads-automation", icon: Target, badge: "Ultra", premium: true },
      { title: "A/B Testing", url: "/ab-testing", icon: GitBranch, badge: "Ultra", premium: true },
      { title: "Affiliates", url: "/affiliate-program", icon: Share2 },
      { title: "Upsell Manager", url: "/upsell-manager", icon: TrendingUp }
    ]
  },
  
  // ============= AVANCÉ =============
  {
    title: "AVANCÉ",
    icon: Zap,
    items: [
      { title: "Extensions", url: "/extensions", icon: Boxes, badge: "Nouveau" },
      { title: "AI Assistant", url: "/ai-assistant", icon: Bot, badge: "AI", premium: true },
      { title: "AI Studio", url: "/ai-studio", icon: Sparkles, badge: "Studio", premium: true },
      { title: "Automation", url: "/automation", icon: Zap, badge: "Auto" },
      { title: "Automation Studio", url: "/automation-studio", icon: Bot, badge: "Studio", premium: true },
      { title: "Creative Studio", url: "/creative-studio", icon: Sparkles, badge: "Studio", premium: true },
      { title: "Finance", url: "/finance", icon: CreditCard },
      { title: "Profit Calculator", url: "/profit-calculator", icon: Calculator },
      { title: "Dynamic Pricing", url: "/dynamic-pricing", icon: Tag, badge: "Ultra", premium: true },
      { title: "Multi-Store", url: "/multi-store", icon: Store, badge: "Ultra", premium: true },
      { title: "Multi-Tenant", url: "/multi-tenant", icon: Building2, badge: "Ultra", premium: true },
      { title: "White Label", url: "/white-label", icon: Tag, badge: "Ultra", premium: true },
      { title: "Enterprise API", url: "/enterprise-api", icon: Code, badge: "Ultra", premium: true },
      { title: "Intégrations", url: "/integrations", icon: Link2 },
      { title: "Marketplace", url: "/marketplace", icon: Globe },
      { title: "Security", url: "/security", icon: ShieldCheck },
      { title: "Admin Panel", url: "/admin", icon: ShieldCheck },
      { title: "Mobile & PWA", url: "/pwa-install", icon: Smartphone },
      { title: "Mobile Dashboard", url: "/mobile-dashboard", icon: Smartphone, badge: "Ultra", premium: true },
      { title: "Support", url: "/support", icon: HelpCircle },
      { title: "Help Center", url: "/help-center", icon: BookOpen },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Profile", url: "/profile", icon: Users },
      { title: "Abonnement", url: "/subscription", icon: CreditCard, badge: "Plan" }
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

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
  }, [activeGroup]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  // Filtrer les éléments de navigation basé sur la recherche
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return navigationGroups;
    
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.subItems?.some(sub => 
          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    })).filter(group => group.items.length > 0);
  }, [searchQuery]);

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
                        <SidebarMenuButton
                          onClick={() => navigate(item.url)}
                          className={cn(
                            "w-full justify-start transition-all duration-200",
                            isActive(item.url) 
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
                                    item.badge === "Ultra" && "bg-purple-500 text-white hover:bg-purple-600",
                                    item.badge === "Pro" && "bg-gray-500 text-white hover:bg-gray-600",
                                    item.badge === "AI" && "bg-blue-500 text-white hover:bg-blue-600",
                                    item.badge === "Studio" && "bg-pink-500 text-white hover:bg-pink-600",
                                    item.badge === "Auto" && "bg-orange-500 text-white hover:bg-orange-600",
                                    item.badge === "Nouveau" && "bg-green-500 text-white hover:bg-green-600"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          )}
                        </SidebarMenuButton>
                        
                        {/* Sub-items */}
                        {item.subItems && state !== "collapsed" && (
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  onClick={() => navigate(subItem.url)}
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
                                        subItem.badge === "Ultra" && "border-purple-500 text-purple-600",
                                        subItem.badge === "Pro" && "border-gray-500 text-gray-600",
                                        subItem.badge === "AI" && "border-blue-500 text-blue-600",
                                        subItem.badge === "Studio" && "border-pink-500 text-pink-600",
                                        subItem.badge === "Auto" && "border-orange-500 text-orange-600",
                                        subItem.badge === "Nouveau" && "border-green-500 text-green-600"
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
