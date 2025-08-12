import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Search, Bot, Sparkles, ShoppingCart, Package, BarChart3, Users, ShieldCheck, Zap, Settings, HelpCircle } from "lucide-react";
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

const navigationGroups = [
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
      }
    ]
  },
  {
    title: "Commerce",
    icon: ShoppingCart,
    items: [
      {
        title: "Import Produits",
        url: "/import",
        icon: Package,
        badge: "Import"
      },
      {
        title: "Import Ultra Pro",
        url: "/import-ultra-pro", 
        icon: Bot,
        badge: "IA+",
        premium: true
      },
      {
        title: "Catalogue",
        url: "/catalogue",
        icon: Package,
        badge: "Standard"
      },
      {
        title: "Catalogue Ultra Pro",
        url: "/catalogue-ultra-pro",
        icon: Sparkles,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "Marketplace",
        url: "/marketplace",
        icon: ShoppingCart,
        badge: "Marché"
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
        badge: "Standard"
      },
      {
        title: "Commandes Ultra Pro",
        url: "/orders-ultra-pro",
        icon: Zap,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "CRM Clients",
        url: "/crm",
        icon: Users,
        badge: "CRM"
      },
      {
        title: "CRM Ultra Pro",
        url: "/crm-ultra-pro",
        icon: Bot,
        badge: "IA+",
        premium: true
      }
    ]
  },
  {
    title: "Logistique",
    icon: Package,
    items: [
      {
        title: "Suivi Colis",
        url: "/tracking",
        icon: Package,
        badge: "Tracking"
      },
      {
        title: "Suivi Ultra Pro",
        url: "/tracking-ultra-pro",
        icon: Sparkles,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "Inventaire",
        url: "/inventory",
        icon: Package,
        badge: "Stock"
      },
      {
        title: "Inventaire Ultra Pro",
        url: "/inventory-ultra-pro",
        icon: Bot,
        badge: "IA+",
        premium: true
      },
      {
        title: "Fournisseurs",
        url: "/suppliers",
        icon: Package,
        badge: "Suppliers"
      }
    ]
  },
  {
    title: "Marketing & SEO",
    icon: BarChart3,
    items: [
      {
        title: "SEO Optimizer",
        url: "/seo",
        icon: BarChart3,
        badge: "SEO"
      },
      {
        title: "SEO Ultra Pro",
        url: "/seo-ultra-pro",
        icon: Bot,
        badge: "IA+",
        premium: true
      },
      {
        title: "Marketing",
        url: "/marketing",
        icon: BarChart3,
        badge: "Marketing"
      },
      {
        title: "Marketing Ultra Pro",
        url: "/marketing-ultra-pro",
        icon: Sparkles,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "Blog IA",
        url: "/blog",
        icon: Bot,
        badge: "IA",
        premium: true
      },
      {
        title: "Reviews",
        url: "/reviews",
        icon: BarChart3,
        badge: "Reviews"
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
        title: "Automation Ultra Pro",
        url: "/automation-ultra-pro",
        icon: Zap,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "Plugins",
        url: "/plugins",
        icon: Bot,
        badge: "Plugins"
      },
      {
        title: "Extension",
        url: "/extension",
        icon: Bot,
        badge: "Ext"
      }
    ]
  },
  {
    title: "Analytics & Data",
    icon: BarChart3,
    items: [
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        badge: "Analytics"
      },
      {
        title: "Analytics Ultra Pro",
        url: "/analytics-ultra-pro",
        icon: Sparkles,
        badge: "Ultra Pro",
        premium: true
      },
      {
        title: "Winners",
        url: "/winners",
        icon: BarChart3,
        badge: "Hot"
      }
    ]
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    items: [
      {
        title: "Admin",
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
      }
    ]
  },
  {
    title: "Support & Mobile",
    icon: HelpCircle,
    items: [
      {
        title: "Support",
        url: "/support",
        icon: HelpCircle,
        badge: "Help"
      },
      {
        title: "Mobile App",
        url: "/mobile",
        icon: Bot,
        badge: "Mobile"
      },
      {
        title: "FAQ",
        url: "/faq",
        icon: HelpCircle,
        badge: "FAQ"
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
        title: "Notifications",
        url: "/notifications",
        icon: Settings,
        badge: "Notifs"
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