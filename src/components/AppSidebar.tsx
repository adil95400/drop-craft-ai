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
  {
    title: "Tableau de bord",
    icon: BarChart3,
    items: [
      { title: "Dashboard Principal", url: "/dashboard", icon: BarChart3, badge: "Home" },
      { title: "Super Dashboard", url: "/dashboard-super", icon: Sparkles, badge: "Pro", premium: true },
      { title: "Analytics", url: "/analytics", icon: PieChart, badge: "Data" }
    ]
  },
  {
    title: "E-commerce",
    icon: ShoppingCart,
    items: [
      { title: "Boutiques", url: "/stores", icon: Store, badge: "Stores" },
      { title: "Produits", url: "/products", icon: Package, badge: "Products" },
      { title: "Commandes", url: "/orders", icon: ShoppingBag, badge: "Orders" },
      { title: "Catalogue", url: "/catalog", icon: BookOpen, badge: "Catalog" },
      { title: "Marketplace", url: "/marketplace", icon: Globe, badge: "Market" }
    ]
  },
  {
    title: "Sourcing & Import",
    icon: Target,
    items: [
      { title: "Product Finder AI", url: "/product-finder", icon: Target, badge: "AI", premium: true },
      { title: "Product Sourcing", url: "/product-sourcing", icon: Search, badge: "Source" },
      { 
        title: "Import", 
        url: "/import", 
        icon: Upload, 
        badge: "Import",
        subItems: [
          { title: "Import Management", url: "/import", icon: Database, badge: "Manage" },
          { title: "CSV Import", url: "/import/csv", icon: FileText, badge: "CSV" },
          { title: "API Import", url: "/import/api", icon: Code, badge: "API" },
          { title: "Web Scraping", url: "/import/scraping", icon: Globe, badge: "Scrape" },
          { title: "AI Import", url: "/import/ai", icon: Bot, badge: "AI", premium: true }
        ]
      },
      { title: "Import History", url: "/import/history", icon: Clock, badge: "History" },
      { title: "Import Sources", url: "/import-sources", icon: Database, badge: "Sources" }
    ]
  },
  {
    title: "Logistique & Stock",
    icon: Warehouse,
    items: [
      { title: "Inventory Management", url: "/inventory-management", icon: Boxes, badge: "Stock" },
      { title: "Warehouse Management", url: "/warehouse-management", icon: Warehouse, badge: "Warehouses", premium: true },
      { title: "Shipping Manager", url: "/shipping-manager", icon: Truck, badge: "Shipping" },
      { title: "Returns Management", url: "/returns-management", icon: RotateCcw, badge: "Returns" },
      { title: "Auto Orders", url: "/auto-order", icon: Zap, badge: "Auto", premium: true },
      { title: "Suppliers", url: "/suppliers", icon: Package, badge: "Suppliers" }
    ]
  },
  {
    title: "Marketing & Ventes",
    icon: Megaphone,
    items: [
      { title: "Marketing Hub", url: "/marketing", icon: Megaphone, badge: "Hub" },
      { title: "Email Marketing", url: "/email-marketing", icon: Mail, badge: "Email" },
      { title: "Pixel Tracking", url: "/pixel-tracking", icon: Eye, badge: "Pixels" },
      { title: "Upsell Manager", url: "/upsell-manager", icon: TrendingUp, badge: "Upsells" },
      { title: "Affiliate Program", url: "/affiliate-program", icon: Share2, badge: "Affiliates" },
      { title: "Ads Automation", url: "/ads-automation", icon: Target, badge: "Ads", premium: true },
      { title: "A/B Testing", url: "/ab-testing", icon: GitBranch, badge: "A/B", premium: true },
      { title: "Blog", url: "/blog", icon: FileText, badge: "Blog" }
    ]
  },
  {
    title: "Clients & Support",
    icon: Users,
    items: [
      { title: "Clients", url: "/customers", icon: Users, badge: "Clients" },
      { title: "CRM", url: "/crm", icon: Users, badge: "CRM" },
      { title: "Live Chat", url: "/live-chat", icon: MessageSquare, badge: "Chat", premium: true },
      { title: "Reviews Manager", url: "/reviews-manager", icon: Star, badge: "Reviews" },
      { title: "CRM Calendar", url: "/crm/calendar", icon: Calendar, badge: "Calendar" }
    ]
  },
  {
    title: "Pricing & Finance",
    icon: DollarSign,
    items: [
      { title: "Profit Calculator", url: "/profit-calculator", icon: Calculator, badge: "Profit" },
      { title: "Dynamic Pricing", url: "/dynamic-pricing", icon: Tag, badge: "Dynamic", premium: true },
      { title: "Finance", url: "/finance", icon: CreditCard, badge: "Finance" },
      { title: "Pricing", url: "/pricing-page", icon: DollarSign, badge: "Price" }
    ]
  },
  {
    title: "Automatisation",
    icon: Zap,
    items: [
      { title: "Automation", url: "/automation", icon: Zap, badge: "Auto" },
      { title: "Automation Studio", url: "/automation-studio", icon: Bot, badge: "Studio", premium: true },
      { title: "AI Automation", url: "/ai-automation", icon: Bot, badge: "AI Auto", premium: true },
      { title: "Workflow Automation", url: "/automation-optimization", icon: GitBranch, badge: "Flow", premium: true }
    ]
  },
  {
    title: "Intelligence & IA",
    icon: Bot,
    items: [
      { title: "AI Assistant", url: "/ai-assistant", icon: Bot, badge: "AI", premium: true },
      { title: "AI Studio", url: "/ai-studio", icon: Sparkles, badge: "Studio", premium: true },
      { title: "Business Intelligence", url: "/business-intelligence", icon: BarChart3, badge: "BI", premium: true },
      { title: "Product Intelligence", url: "/product-intelligence", icon: Target, badge: "Intel", premium: true },
      { title: "Creative Studio", url: "/creative-studio", icon: Sparkles, badge: "Creative", premium: true }
    ]
  },
  {
    title: "Analytics & Monitoring",
    icon: Activity,
    items: [
      { title: "Analytics Studio", url: "/analytics-studio", icon: BarChart3, badge: "Studio", premium: true },
      { title: "Monitoring", url: "/monitoring", icon: Activity, badge: "Monitor" },
      { title: "Observability", url: "/observability", icon: Eye, badge: "Observe", premium: true },
      { title: "Advanced Analytics", url: "/advanced-analytics-enterprise", icon: PieChart, badge: "Advanced", premium: true }
    ]
  },
  {
    title: "Multi-Store & Enterprise",
    icon: Globe,
    items: [
      { title: "Multi-Store Manager", url: "/multi-store", icon: Store, badge: "Multi", premium: true },
      { title: "Multi-Tenant", url: "/multi-tenant", icon: Building2, badge: "Tenant", premium: true },
      { title: "White Label", url: "/white-label", icon: Tag, badge: "Label", premium: true },
      { title: "Enterprise API", url: "/enterprise-api", icon: Code, badge: "API", premium: true }
    ]
  },
  {
    title: "Intégrations",
    icon: Link2,
    items: [
      { title: "Intégrations Hub", url: "/integrations", icon: Link2, badge: "Hub" },
      { title: "Marketplace Connector", url: "/marketplace-connector", icon: Globe, badge: "Connect" },
      { title: "Extensions", url: "/extensions", icon: Boxes, badge: "Extensions" }
    ]
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    items: [
      { title: "Admin Panel", url: "/admin", icon: ShieldCheck, badge: "Admin" },
      { title: "Security", url: "/security", icon: ShieldCheck, badge: "Security" },
      { title: "Quota Manager", url: "/quota-manager", icon: Settings, badge: "Quotas" },
      { title: "Team Collaboration", url: "/team-collaboration", icon: Users, badge: "Team" }
    ]
  },
  {
    title: "Mobile & PWA",
    icon: Smartphone,
    items: [
      { title: "PWA Install", url: "/pwa-install", icon: Smartphone, badge: "PWA" },
      { title: "Flutter App", url: "/flutter-mobile", icon: Download, badge: "Flutter" },
      { title: "Mobile Dashboard", url: "/mobile-dashboard", icon: Smartphone, badge: "Mobile", premium: true }
    ]
  },
  {
    title: "Support & Aide",
    icon: HelpCircle,
    items: [
      { title: "Support", url: "/support", icon: HelpCircle, badge: "Help" },
      { title: "Help Center", url: "/help-center", icon: BookOpen, badge: "Center" },
      { title: "QA", url: "/qa", icon: HelpCircle, badge: "QA" },
      { title: "App Status", url: "/application-status", icon: Activity, badge: "Status" }
    ]
  },
  {
    title: "Configuration",
    icon: Settings,
    items: [
      { title: "Settings", url: "/settings", icon: Settings, badge: "Config" },
      { title: "Profile", url: "/profile", icon: Users, badge: "Profile" },
      { title: "Subscription", url: "/subscription", icon: CreditCard, badge: "Plan" }
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
                                  variant={item.premium ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs h-5 px-1.5",
                                    item.premium && "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
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
                                        "text-xs h-4 px-1",
                                        subItem.premium && "border-yellow-500 text-yellow-600"
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
