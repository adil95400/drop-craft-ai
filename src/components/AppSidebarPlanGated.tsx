import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronDown, Search, Bot, Sparkles, ShoppingCart, Package, BarChart3, 
  Users, ShieldCheck, Zap, Settings, HelpCircle, Lock, Crown, Star, 
  Database 
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { PlanBadge } from "@/components/plan/PlanBadge";

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
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      }
    ]
  },
  {
    title: "Import & Catalogue",
    icon: Package,
    items: [
      {
        title: "Import",
        url: "/import",
        icon: Package,
        badge: "Standard"
      },
      {
        title: "Import Ultra Pro",
        url: "/import-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Gestion des Imports",
        url: "/import-management",
        icon: Database,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Catalogue",
        url: "/catalogue",
        icon: ShoppingCart,
        badge: "Standard"
      },
      {
        title: "Catalogue Ultra Pro",
        url: "/catalogue-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      }
    ]
  },
  {
    title: "E-commerce",
    icon: ShoppingCart,
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
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Suivi Colis",
        url: "/tracking",
        icon: Package,
        badge: "Standard"
      },
      {
        title: "Suivi Ultra Pro",
        url: "/tracking-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      }
    ]
  },
  {
    title: "CRM & Marketing",
    icon: Users,
    items: [
      {
        title: "CRM",
        url: "/crm",
        icon: Users,
        badge: "Standard"
      },
      {
        title: "CRM Ultra Pro",
        url: "/crm-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Marketing",
        url: "/marketing",
        icon: Zap,
        badge: "Standard"
      },
      {
        title: "Marketing Ultra Pro",
        url: "/marketing-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      }
    ]
  },
  {
    title: "Automation & AI",
    icon: Bot,
    items: [
      {
        title: "Automatisation",
        url: "/automation",
        icon: Bot,
        badge: "Pro",
        requiredPlan: "pro" as const
      },
      {
        title: "Automation Ultra Pro",
        url: "/automation-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        badge: "Standard"
      },
      {
        title: "Analytics Ultra Pro",
        url: "/analytics-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      }
    ]
  },
  {
    title: "SEO & Reviews",
    icon: Sparkles,
    items: [
      {
        title: "SEO",
        url: "/seo",
        icon: Sparkles,
        badge: "Pro",
        requiredPlan: "pro" as const
      },
      {
        title: "SEO Ultra Pro",
        url: "/seo-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Avis Clients",
        url: "/reviews",
        icon: Star,
        badge: "Standard"
      },
      {
        title: "Reviews Ultra Pro",
        url: "/reviews-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      }
    ]
  },
  {
    title: "Configuration",
    icon: Settings,
    items: [
      {
        title: "Intégrations",
        url: "/integrations",
        icon: Zap,
        badge: "Standard"
      },
      {
        title: "Sécurité",
        url: "/security",
        icon: ShieldCheck,
        badge: "Pro",
        requiredPlan: "pro" as const
      },
      {
        title: "Security Ultra Pro",
        url: "/security-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Support",
        url: "/support",
        icon: HelpCircle,
        badge: "Standard"
      },
      {
        title: "Support Ultra Pro",
        url: "/support-ultra-pro",
        icon: Crown,
        badge: "Ultra Pro",
        requiredPlan: "ultra_pro" as const
      },
      {
        title: "Paramètres",
        url: "/settings",
        icon: Settings,
        badge: "Standard"
      }
    ]
  }
];

export function AppSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const collapsed = !sidebarOpen;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { hasPlan, plan } = usePlan(user);
  const { isAdmin } = useEnhancedAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Set default open groups based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingGroup = navigationGroups.find(group =>
      group.items.some(item => currentPath.startsWith(item.url))
    );
    if (matchingGroup && !openGroups.includes(matchingGroup.title)) {
      setOpenGroups(prev => [...prev, matchingGroup.title]);
    }
  }, [location.pathname]);

  // Filter items based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return navigationGroups;

    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0);
  }, [searchQuery]);

  const isActive = (path: string) => location.pathname === path;

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev =>
      prev.includes(groupTitle)
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const handleNavigation = (item: any) => {
    if (item.requiredPlan && !isAdmin && !hasPlan(item.requiredPlan)) {
      navigate('/pricing-plans', { 
        state: { highlightPlan: item.requiredPlan } 
      });
      return;
    }
    navigate(item.url);
  };

  const renderNavItem = (item: any) => {
    const hasAccess = !item.requiredPlan || isAdmin || hasPlan(item.requiredPlan);
    const isCurrentRoute = isActive(item.url);
    const ItemIcon = item.icon;
    const isLocked = !hasAccess;

    const button = (
      <SidebarMenuButton
        className={cn(
          "w-full justify-start transition-all duration-200",
          isCurrentRoute && "bg-accent text-accent-foreground font-medium",
          isLocked && "opacity-60 cursor-pointer"
        )}
        onClick={() => handleNavigation(item)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            <ItemIcon className={cn("h-4 w-4", isCurrentRoute && "text-accent-foreground")} />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={isCurrentRoute ? "default" : "secondary"}
                  className={cn(
                    "text-xs px-2 py-0.5",
                    item.requiredPlan === "ultra_pro" && "bg-purple-100 text-purple-700",
                    item.requiredPlan === "pro" && "bg-blue-100 text-blue-700"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </div>
          )}
        </div>
      </SidebarMenuButton>
    );

    if (isLocked) {
      return (
        <TooltipProvider key={item.url}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Fonctionnalité {item.requiredPlan === 'ultra_pro' ? 'Ultra Pro' : 'Pro'} - Mise à niveau requise</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.url}>{button}</div>;
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b">
        <ShopoptiLogo />
        {!collapsed && user && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlanBadge plan={plan} size="sm" />
              {plan !== 'ultra_pro' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/pricing-plans')}
                  className="text-xs"
                >
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        {!collapsed && (
          <div className="px-2 pb-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
        )}

        {filteredGroups.map((group) => {
          const GroupIcon = group.icon;
          const isGroupOpen = openGroups.includes(group.title);

          return (
            <SidebarGroup key={group.title}>
              <Collapsible
                open={isGroupOpen}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent rounded-md px-2 py-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                      <GroupIcon className="h-4 w-4" />
                      {!collapsed && <span className="font-medium">{group.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isGroupOpen && "rotate-180"
                        )}
                      />
                    )}
                  </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.url}>
                          {renderNavItem(item)}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}