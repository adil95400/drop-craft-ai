import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Package,
  ShoppingCart,
  Upload,
  Truck,
  BarChart3,
  Users,
  TrendingUp,
  Brain,
  Zap,
  Shield,
  Plug,
  Crown,
  Store,
  Search,
  FileText,
  Puzzle,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnifiedPlan } from "@/lib/unified-plan-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  requiredPlan?: "standard" | "pro" | "ultra_pro";
}

const navigationGroups = [
  {
    title: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Boutiques", url: "/stores", icon: Store, badge: "Stores" },
      { title: "Import Avancé", url: "/import/advanced", icon: Upload, badge: "Pro" },
      { title: "Sync Manager", url: "/sync-manager", icon: Zap, badge: "Nouveau" }
    ] as NavigationItem[]
  },
  {
    title: "Catalogue",
    items: [
      { title: "Produits", url: "/products", icon: Package },
      { title: "Catalogue", url: "/catalog", icon: Package, requiredPlan: "pro" },
      { title: "Fournisseurs", url: "/suppliers", icon: Truck },
    ] as NavigationItem[]
  },
  {
    title: "Commerce",
    items: [
      { title: "Commandes", url: "/orders", icon: ShoppingCart },
      { title: "Centre Commandes", url: "/orders-center", icon: ShoppingCart, badge: "Nouveau" },
      { title: "Clients", url: "/customers", icon: Users },
      { title: "CRM", url: "/crm", icon: Users, requiredPlan: "pro" },
    ] as NavigationItem[]
  },
  {
    title: "Analytics",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3, requiredPlan: "pro" },
      { title: "Monitoring", url: "/monitoring", icon: TrendingUp, requiredPlan: "ultra_pro" },
    ] as NavigationItem[]
  },
  {
    title: "Marketing",
    items: [
      { title: "Marketing", url: "/marketing", icon: TrendingUp, requiredPlan: "pro" },
      { title: "Blog", url: "/blog", icon: FileText, requiredPlan: "pro" },
      { title: "SEO", url: "/seo", icon: Search, requiredPlan: "pro" },
    ] as NavigationItem[]
  },
  {
    title: "Avancé",
    items: [
      { title: "Extensions", url: "/extensions", icon: Puzzle, badge: "Nouveau" },
      { title: "IA Assistant", url: "/ai", icon: Brain, badge: "AI", requiredPlan: "ultra_pro" },
      { title: "AI Studio", url: "/ai-studio", icon: Brain, badge: "Studio", requiredPlan: "ultra_pro" },
      { title: "Automation Studio", url: "/automation-studio", icon: Zap, badge: "Studio", requiredPlan: "ultra_pro" },
      { title: "Analytics Studio", url: "/analytics-studio", icon: BarChart3, badge: "Studio", requiredPlan: "ultra_pro" },
      { title: "Automation", url: "/automation", icon: Zap, requiredPlan: "ultra_pro" },
      { title: "Sécurité", url: "/security", icon: Shield, requiredPlan: "ultra_pro" },
      { title: "Intégrations", url: "/integrations", icon: Plug },
    ] as NavigationItem[]
  }
];

export function MainSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const collapsed = !sidebarOpen;
  const { user } = useAuth();
  const { effectivePlan: plan, hasFeature } = useUnifiedPlan();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const canAccessFeature = (item: NavigationItem) => {
    if (!item.requiredPlan) return true;
    if (hasFeature('advanced-analytics')) return true; // Admin ou plan supérieur
    
    const planHierarchy = { standard: 1, pro: 2, ultra_pro: 3 };
    const userPlanLevel = planHierarchy[plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[item.requiredPlan];
    
    return userPlanLevel >= requiredPlanLevel;
  };

  return (
    <Sidebar
      className={`border-r bg-card/50 backdrop-blur-sm transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      collapsible="icon"
    >
      {/* Header avec logo */}
      <SidebarHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
            <Crown className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Drop Craft AI
              </h2>
              <p className="text-xs text-muted-foreground">v2.0</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="p-2">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const canAccess = canAccessFeature(item);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild={canAccess}
                        className={`w-full transition-all duration-200 ${
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : canAccess 
                              ? "hover:bg-accent hover:text-accent-foreground" 
                              : "opacity-50 cursor-not-allowed"
                        }`}
                        tooltip={collapsed ? item.title : undefined}
                      >
                        {canAccess ? (
                          <NavLink to={item.url} className="flex items-center gap-3 w-full">
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!collapsed && (
                              <>
                                <span className="flex-1 text-left">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                                {item.requiredPlan && !hasFeature('advanced-analytics') && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.requiredPlan === 'pro' ? 'PRO' : 'ULTRA'}
                                  </Badge>
                                )}
                              </>
                            )}
                          </NavLink>
                        ) : (
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!collapsed && (
                              <>
                                <span className="flex-1 text-left">{item.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.requiredPlan === 'pro' ? 'PRO' : 'ULTRA'}
                                </Badge>
                              </>
                            )}
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer avec info utilisateur et plan */}
      <SidebarFooter className="border-t p-3">
        {/* Plan Info */}
        {!collapsed && (
          <div className="mb-3">
            <div className="rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 p-3 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Plan {plan}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan === 'ultra_pro' ? 'Toutes les fonctionnalités' : 'Fonctionnalités limitées'}
                  </p>
                </div>
                {plan !== 'ultra_pro' && (
                  <Button size="sm" variant="ghost" asChild>
                    <NavLink to="/subscription">
                      <Crown className="h-4 w-4" />
                    </NavLink>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/user-pro.jpg" alt="Avatar" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button size="sm" variant="ghost" asChild>
              <NavLink to="/settings">
                <Settings className="h-4 w-4" />
              </NavLink>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}