import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, Package, Users, BarChart3, Settings, CreditCard, Truck, Star, 
  Search, Target, ShoppingCart, Smartphone, Puzzle, Zap, Shield, HelpCircle,
  FileText, MessageSquare, Calendar, Database, TrendingUp, Bell, Globe
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
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Catalogue", url: "/catalogue", icon: Package },
  { title: "Commandes", url: "/orders", icon: ShoppingCart },
  { title: "Inventaire", url: "/inventory", icon: Database },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Fournisseurs", url: "/suppliers", icon: Users },
];

const businessItems = [
  { title: "CRM", url: "/crm", icon: Users },
  { title: "Marketing", url: "/marketing", icon: Target },
  { title: "Avis", url: "/reviews", icon: Star },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "SEO", url: "/seo", icon: Search },
  { title: "Blog", url: "/blog", icon: FileText },
];

const toolsItems = [
  { title: "Suivi", url: "/tracking", icon: Truck },
  { title: "Automation", url: "/automation", icon: Zap },
  { title: "Import", url: "/import", icon: FileText },
  { title: "Plugins", url: "/plugins", icon: Puzzle },
  { title: "Mobile", url: "/mobile", icon: Smartphone },
  { title: "Extension", url: "/extension", icon: Globe },
];

const supportItems = [
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "Sécurité", url: "/security", icon: Shield },
  { title: "FAQ", url: "/faq", icon: MessageSquare },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  const renderMenuItems = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} className={getNavCls}>
              <item.icon className="mr-2 h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Principal"}</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(mainItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Business"}</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(businessItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Outils"}</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(toolsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Support"}</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(supportItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}