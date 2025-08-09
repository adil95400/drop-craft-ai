import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, Package, Users, BarChart3, Settings, ShoppingCart, Truck, Star, 
  Search, Target, Smartphone, Puzzle, Zap, Shield, HelpCircle,
  FileText, MessageSquare, Database, Bell, Globe, ChevronDown, ChevronRight
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "E-commerce",
    icon: ShoppingCart,
    items: [
      { title: "Catalogue", url: "/catalogue", icon: Package },
      { title: "Commandes", url: "/orders", icon: ShoppingCart },
      { title: "Inventaire", url: "/inventory", icon: Database },
      { title: "Stock", url: "/stock", icon: Package },
      { title: "Fournisseurs", url: "/suppliers", icon: Users },
    ],
  },
  {
    title: "CRM & Marketing", 
    icon: Users,
    items: [
      { title: "CRM", url: "/crm", icon: Users },
      { title: "Marketing", url: "/marketing", icon: Target },
      { title: "Avis", url: "/reviews", icon: Star },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "SEO", url: "/seo", icon: Search },
      { title: "Blog", url: "/blog", icon: FileText },
    ],
  },
  {
    title: "Outils",
    icon: Puzzle,
    items: [
      { title: "Suivi", url: "/tracking", icon: Truck },
      { title: "Automation", url: "/automation", icon: Zap },
      { title: "Import", url: "/import", icon: FileText },
      { title: "Plugins", url: "/plugins", icon: Puzzle },
      { title: "Mobile", url: "/mobile", icon: Smartphone },
      { title: "Extension", url: "/extension", icon: Globe },
    ],
  },
  {
    title: "Support",
    icon: HelpCircle,
    items: [
      { title: "Support", url: "/support", icon: HelpCircle },
      { title: "Sécurité", url: "/security", icon: Shield },
      { title: "FAQ", url: "/faq", icon: MessageSquare },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Paramètres", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<string[]>(["E-commerce", "CRM & Marketing", "Outils", "Support"]);

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + '/');
  
  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                if (!item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url!} 
                          className={({ isActive }) => 
                            isActive ? "bg-primary/10 text-primary font-medium" : ""
                          }
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isGroupOpen = openGroups.includes(item.title);
                const hasActiveChild = item.items.some(subItem => isActive(subItem.url));

                return (
                  <Collapsible key={item.title} open={isGroupOpen} onOpenChange={() => toggleGroup(item.title)}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                          {isGroupOpen ? (
                            <ChevronDown className="ml-auto h-4 w-4" />
                          ) : (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink 
                                  to={subItem.url} 
                                  className={({ isActive }) => 
                                    isActive ? "bg-primary/10 text-primary font-medium" : ""
                                  }
                                >
                                  <subItem.icon className="mr-2 h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}