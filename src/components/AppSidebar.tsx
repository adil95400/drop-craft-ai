import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Search, Bot, Sparkles, ShoppingCart, Package, BarChart3, Users, ShieldCheck, Zap, Settings, HelpCircle, Store, Smartphone, Download, Code } from "lucide-react";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge: string;
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
        Shopopti
      </span>
      <span className="text-xs text-muted-foreground -mt-1">Pro Dashboard</span>
    </div>
  </div>
);

const navigationGroups: NavigationGroup[] = [
  {
    title: "Dashboard",
    icon: BarChart3,
    items: [
      {
        title: "Dashboard Principal",
        url: "/dashboard",
        icon: BarChart3,
        badge: "Principal"
      },
      {
        title: "Dashboard Ultra Pro",
        url: "/dashboard-ultra-pro",
        icon: Zap,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "Super Dashboard",
        url: "/dashboard-super",
        icon: Sparkles,
        badge: "Super",
        premium: true
      }
    ]
  },
  {
    title: "Commerce",
    icon: ShoppingCart,
    items: [
      {
        title: "Boutiques",
        url: "/stores",
        icon: Store,
        badge: "Stores"
      },
      {
        title: "Produits",
        url: "/products",
        icon: Package,
        badge: "Produits"
      },
      {
        title: "Import",
        url: "/import",
        icon: Package,
        badge: "Import",
        subItems: [
          {
            title: "Import Management",
            url: "/import",
            icon: Package,
            badge: "Manage"
          },
          {
            title: "CSV Import",
            url: "/import/csv",
            icon: Package,
            badge: "CSV"
          },
          {
            title: "API Import",
            url: "/import/api",
            icon: Package,
            badge: "API"
          },
          {
            title: "Web Scraping",
            url: "/import/scraping",
            icon: Package,
            badge: "Scrape"
          },
          {
            title: "AI Import",
            url: "/import/ai",
            icon: Bot,
            badge: "AI",
            premium: true
          }
        ]
      },
      {
        title: "Catalogue",
        url: "/catalog",
        icon: Package,
        badge: "Catalog"
      },
      {
        title: "Marketplace",
        url: "/marketplace",
        icon: ShoppingCart,
        badge: "Market"
      },
      {
        title: "Intelligence Produit",
        url: "/product-intelligence",
        icon: Bot,
        badge: "Intel",
        premium: true
      }
    ]
  },
  {
    title: "Commandes & Clients",
    icon: Users,
    items: [
      {
        title: "Commandes",
        url: "/orders",
        icon: ShoppingCart,
        badge: "Orders"
      },
      {
        title: "Clients",
        url: "/customers",
        icon: Users,
        badge: "Clients"
      },
      {
        title: "CRM",
        url: "/crm",
        icon: Users,
        badge: "CRM"
      },
      {
        title: "Gestion Clients",
        url: "/customer-management",
        icon: Users,
        badge: "Manage"
      }
    ]
  },
  {
    title: "Logistique",
    icon: Package,
    items: [
      {
        title: "Fournisseurs",
        url: "/suppliers",
        icon: Package,
        badge: "Suppliers"
      },
      {
        title: "Inventaire",
        url: "/inventory",
        icon: Package,
        badge: "Stock"
      },
      {
        title: "Stock",
        url: "/stock",
        icon: Package,
        badge: "Stock"
      },
      {
        title: "Suivi Colis",
        url: "/tracking",
        icon: Package,
        badge: "Track"
      }
    ]
  },
  {
    title: "Marketing & SEO",
    icon: BarChart3,
    items: [
      {
        title: "Marketing",
        url: "/marketing",
        icon: BarChart3,
        badge: "Marketing"
      },
      {
        title: "SEO Manager",
        url: "/seo-manager",
        icon: BarChart3,
        badge: "SEO"
      },
      {
        title: "Blog",
        url: "/blog",
        icon: Bot,
        badge: "Blog"
      },
      {
        title: "Calendrier Marketing",
        url: "/marketing-calendar",
        icon: BarChart3,
        badge: "Calendar"
      },
      {
        title: "Génération Contenu",
        url: "/content-generation",
        icon: Bot,
        badge: "Content",
        premium: true
      },
      {
        title: "Publicités",
        url: "/ads-automation",
        icon: BarChart3,
        badge: "Ads",
        premium: true
      },
      {
        title: "A/B Testing",
        url: "/ab-testing",
        icon: BarChart3,
        badge: "A/B",
        premium: true
      }
    ]
  },
  {
    title: "Intelligence & IA",
    icon: Bot,
    items: [
      {
        title: "IA Assistant",
        url: "/ai-assistant",
        icon: Bot,
        badge: "AI",
        premium: true
      },
      {
        title: "AI Studio",
        url: "/ai-studio",
        icon: Bot,
        badge: "Studio",
        premium: true
      },
      {
        title: "Intelligence Avancée",
        url: "/advanced-intelligence",
        icon: Bot,
        badge: "Intel",
        premium: true
      },
      {
        title: "Business Intelligence",
        url: "/business-intelligence",
        icon: Bot,
        badge: "BI",
        premium: true
      },
      {
        title: "Creative Studio",
        url: "/creative-studio",
        icon: Bot,
        badge: "Creative",
        premium: true
      }
    ]
  },
  {
    title: "Automatisation",
    icon: Bot,
    items: [
      {
        title: "Automation",
        url: "/automation",
        icon: Bot,
        badge: "Auto"
      },
      {
        title: "Automation Studio",
        url: "/automation-studio",
        icon: Zap,
        badge: "Studio",
        premium: true
      },
      {
        title: "Optimisation Auto",
        url: "/automation-optimization",
        icon: Zap,
        badge: "Opti",
        premium: true
      },
      {
        title: "Automation IA",
        url: "/ai-automation",
        icon: Bot,
        badge: "AI Auto",
        premium: true
      },
      {
        title: "Automation Prix",
        url: "/pricing-automation",
        icon: Zap,
        badge: "Price",
        premium: true
      }
    ]
  },
  {
    title: "Analytics & Monitoring",
    icon: BarChart3,
    items: [
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        badge: "Analytics"
      },
      {
        title: "Analytics Studio",
        url: "/analytics-studio",
        icon: BarChart3,
        badge: "Studio",
        premium: true
      },
      {
        title: "Analytics Enterprise",
        url: "/advanced-analytics-enterprise",
        icon: BarChart3,
        badge: "Enterprise",
        premium: true
      },
      {
        title: "Monitoring",
        url: "/monitoring",
        icon: BarChart3,
        badge: "Monitor"
      },
      {
        title: "Observability",
        url: "/observability",
        icon: BarChart3,
        badge: "Observe",
        premium: true
      }
    ]
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    items: [
      {
        title: "Admin Panel",
        url: "/admin",
        icon: ShieldCheck,
        badge: "Admin"
      },
      {
        title: "Sécurité",
        url: "/security",
        icon: ShieldCheck,
        badge: "Security"
      },
      {
        title: "Intégrations",
        url: "/integrations",
        icon: Bot,
        badge: "API"
      },
      {
        title: "Enterprise API",
        url: "/enterprise-api",
        icon: Code,
        badge: "API",
        premium: true
      },
      {
        title: "Quotas Manager",
        url: "/quota-manager",
        icon: Settings,
        badge: "Quotas"
      }
    ]
  },
  {
    title: "Outils Avancés",
    icon: Zap,
    items: [
      {
        title: "Outils Avancés",
        url: "/advanced-tools",
        icon: Zap,
        badge: "Tools",
        premium: true
      },
      {
        title: "Finance",
        url: "/finance",
        icon: BarChart3,
        badge: "Finance"
      },
      {
        title: "Pricing",
        url: "/pricing-page",
        icon: BarChart3,
        badge: "Price"
      },
      {
        title: "Extensions Hub",
        url: "/extensions",
        icon: Bot,
        badge: "Hub"
      },
      {
        title: "Marketplace Connector",
        url: "/marketplace-connector",
        icon: Bot,
        badge: "Connect"
      }
    ]
  },
  {
    title: "Support & Aide",
    icon: HelpCircle,
    items: [
      {
        title: "Support",
        url: "/support",
        icon: HelpCircle,
        badge: "Help"
      },
      {
        title: "Centre d'aide",
        url: "/help-center",
        icon: HelpCircle,
        badge: "Center"
      },
      {
        title: "QA",
        url: "/qa",
        icon: HelpCircle,
        badge: "QA"
      },
      {
        title: "Status Application",
        url: "/application-status",
        icon: HelpCircle,
        badge: "Status"
      }
    ]
  },
  {
    title: "Mobile & PWA",
    icon: Smartphone,
    items: [
      {
        title: "PWA Install",
        url: "/pwa-install",
        icon: Smartphone,
        badge: "PWA"
      },
      {
        title: "App Flutter",
        url: "/flutter-mobile",
        icon: Download,
        badge: "Flutter"
      },
      {
        title: "Mobile Dashboard",
        url: "/mobile-dashboard",
        icon: Smartphone,
        badge: "Mobile",
        premium: true
      }
    ]
  },
  {
    title: "Configuration",
    icon: Settings,
    items: [
      {
        title: "Paramètres",
        url: "/settings",
        icon: Settings,
        badge: "Config"
      },
      {
        title: "Profil",
        url: "/profile",
        icon: Users,
        badge: "Profile"
      },
      {
        title: "Abonnement",
        url: "/subscription",
        icon: ShieldCheck,
        badge: "Plan"
      },
      {
        title: "White Label",
        url: "/white-label",
        icon: Sparkles,
        badge: "Label",
        premium: true
      }
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
      group.items.some(item => currentPath === item.url || currentPath.startsWith(item.url + '/'))
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
        item.badge.toLowerCase().includes(searchQuery.toLowerCase())
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
                <SidebarGroupLabel className="group/label w-full hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
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
                              <Badge 
                                variant={item.premium ? "default" : "secondary"}
                                className={cn(
                                  "text-xs h-5 px-1.5",
                                  item.premium && "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                )}
                              >
                                {item.badge}
                              </Badge>
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
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      "text-xs h-4 px-1",
                                      subItem.premium && "border-yellow-500 text-yellow-600"
                                    )}
                                  >
                                    {subItem.badge}
                                  </Badge>
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